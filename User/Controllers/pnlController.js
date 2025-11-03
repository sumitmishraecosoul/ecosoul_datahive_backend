import azureClient from '../../Utils/azureBlobConnection.js';
import { BlobServiceClient } from '@azure/storage-blob';
import dotenv from 'dotenv';
import getDistinctColumnValues from '../../Utils/filterSelector.js';
dotenv.config();

const pnlController = {};

// Filenames in the same blob/container (same structure as Supply Chain/Quick Commerce)
const PNL_TRANSACTION_FILE = 'Ecosoul-Ecom-Trans_PNL.csv';
const PNL_BUSINESS_FILE = 'Ecosoul-Ecom-BR_PNL.csv';

function buildBlobPath(filename) {
	const base = process.env.AZURE_BLOB_PATH || '';
	if (!base) return filename;

	// If base already ends with a CSV file, strip the filename to keep only the directory
	const baseIsFile = /\.csv$/i.test(base);
	const dirOnly = baseIsFile ? base.replace(/\/[^/]*$/, '') : base; // remove last segment

	// If after normalization it already ends with our target filename, return as-is
	if (dirOnly.endsWith(filename) || dirOnly.endsWith(`/${filename}`)) return dirOnly;

	const normalizedBase = dirOnly.endsWith('/') ? dirOnly : `${dirOnly}/`;
	return `${normalizedBase}${filename}`;
}

// Expose helpers for future APIs in this controller
pnlController.getPnlTransactionBlobPath = () => buildBlobPath(PNL_TRANSACTION_FILE);
pnlController.getPnlBusinessBlobPath = () => buildBlobPath(PNL_BUSINESS_FILE);

// Azure Storage connection for downloads (kept for parity/future use)
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_CONNECTION_STRING;
const containerName = process.env.AZURE_CONTAINER_NAME;

// Helper function to get blob stream for downloads (not used in requested APIs)
const getBlobStream = async (filename) => {
	const blobPath = buildBlobPath(filename);
	const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);

	// Use the container name from environment variables and the full blob path
	const containerClient = blobServiceClient.getContainerClient(containerName);
	const blockBlobClient = containerClient.getBlockBlobClient(blobPath);

	return blockBlobClient.download(0);
};

// Helper: flatten nested objects into single-level with dot paths
function flattenObject(obj, prefix = '', out = {}) {
	if (!obj || typeof obj !== 'object') return out;
	for (const key of Object.keys(obj)) {
		const path = prefix ? `${prefix}.${key}` : key;
		const val = obj[key];
		if (val && typeof val === 'object' && !Array.isArray(val)) {
			flattenObject(val, path, out);
		} else {
			out[path] = val;
		}
	}
	return out;
}

// Helper: coerce to numeric value
function toNumber(value) {
	if (value === null || value === undefined) return NaN;
	const n = parseFloat(String(value).toString().replace(/,/g, '').trim());
	return Number.isFinite(n) ? n : NaN;
}

function getValueByPossibleKeys(flatRow, keys) {
	for (const k of keys) {
		if (Object.prototype.hasOwnProperty.call(flatRow, k)) return flatRow[k];
	}
	return undefined;
}

// ============
// Filter helpers
// ============
function computeDefaultPrevMonthYear() {
	const now = new Date();
	const cur = new Date(now.getFullYear(), now.getMonth(), 1);
	const month = cur.getMonth() + 1;
	const paddedMonth = month < 10 ? `0${month}` : `${month}`;
	return `${cur.getFullYear()}-${paddedMonth}`;
}

function toSet(param) {
	if (!param || !String(param).trim()) return undefined;
	return new Set(String(param).split(',').map(s => s.trim()).filter(Boolean));
}

// Apply common filters across Ecommerce endpoints
// Filters: sku, material, country (comma-separated), monthYear (YYYY-MM; defaults to prev month)
 function applyCommonFilters(rows, query) {
     const skuSet = toSet(query?.sku);
     const materialSet = toSet(query?.material);
     const countrySet = toSet(query?.country);
     const alertSet = toSet(query?.alert);
     const skuTypeSet = toSet(query?.skuType);
     const statusSet = toSet(query?.status);

     const monthYearRaw = typeof query?.monthYear === 'string' ? query.monthYear.trim() : '';
     const hasAnyFilter = !!(skuSet || materialSet || countrySet || alertSet || skuTypeSet || statusSet || monthYearRaw);

     // If no filters provided at all, return all rows unchanged
     if (!hasAnyFilter) return rows;

     // Apply monthYear only if explicitly provided
     const monthYear = monthYearRaw || undefined;

     return rows.filter(row => {
         const flat = flattenObject(row);
         const sku = flat['SKU'] ?? flat['sku'] ?? flat['Sku'];
         const material = flat['Material'] ?? flat['material'];
         const country = flat['Country'] ?? flat['country'];
         const alert = flat['Alert'] ?? flat['alert'];
         const skuType = flat['SKU Type'] ?? flat['sku type'] ?? flat['sku_type'] ?? flat['skuType'];
         const status = flat['Status'] ?? flat['status'];
         const monthYearVal = flat['Month-Year'] ?? flat['month-year'] ?? flat['monthYear'];

         if (skuSet && (!sku || !skuSet.has(String(sku).trim()))) return false;
         if (materialSet && (!material || !materialSet.has(String(material).trim()))) return false;
         if (countrySet && (!country || !countrySet.has(String(country).trim()))) return false;
         if (alertSet && (!alert || !alertSet.has(String(alert).trim()))) return false;
         if (skuTypeSet && (!skuType || !skuTypeSet.has(String(skuType).trim()))) return false;
         if (statusSet && (!status || !statusSet.has(String(status).trim()))) return false;
         if (monthYear && (!monthYearVal || String(monthYearVal).trim() !== monthYear)) return false;

         return true;
     });
 }

pnlController.getPnlTransactionMetricData = async (req, res) => {
	try {
		const blobPath = pnlController.getPnlTransactionBlobPath();
        let rows = await azureClient.fecthDatafromBlog(blobPath);
        if (!Array.isArray(rows)) rows = [];

        const flattenedRows = rows.map(r => flattenObject(r));

        const monthYearParam = (req.query && typeof req.query.monthYear === 'string') ? req.query.monthYear.trim() : '';
        let rowsAfterMonth = flattenedRows;
        if (monthYearParam) {
            rowsAfterMonth = flattenedRows.filter(r => {
                const ym = r['Year-Month'] ?? r['year-month'] ?? r['YearMonth'] ?? r['Year_Month'] ?? r['yearmonth'];
                const my = r['Month-Year'] ?? r['month-year'];
                const v = ym !== undefined ? ym : my;
                if (v === undefined || v === null) return false;
                return String(v).trim() === monthYearParam;
            });
        }

        const channelParam = (req.query && typeof req.query.channel === 'string') ? req.query.channel.trim() : '';
        let filteredRows = rowsAfterMonth;
        if (channelParam) {
            filteredRows = rowsAfterMonth.filter(r => {
                const ch = r['Channel'] ?? r['channel'];
                if (ch === undefined || ch === null) return false;
                const norm = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
                return norm(ch) === norm(channelParam);
            });
        }

        function sumByHeaders(possibleHeaders) {
            let total = 0;
            for (const row of filteredRows) {
                let value;
                for (const key of possibleHeaders) {
                    if (Object.prototype.hasOwnProperty.call(row, key)) {
                        value = row[key];
                        break;
                    }
                }
                const num = toNumber(value);
                if (Number.isFinite(num)) total += num;
            }
            return total;
        }

        const denominatorHeaders = [
            'Total Sales', 'Revenue', 'total_sales', 'Total_Sales'
        ];
        const totalSales = sumByHeaders(denominatorHeaders);

        const headerSets = {
            cm1: ['CM1'],
            cm2: ['CM2'],
            cm3: ['Final_CM3', 'CM3'],
            sellingFee: ['selling fees', 'Selling Fee', 'Selling fees'],
            storageFee: ['Storage Fee'],
            adSpend: ['total_ad_spend', 'Ad Spend', 'Total Ad Spend', 'Spend']
        };

        function pct(numerator) {
            if (!Number.isFinite(totalSales) || totalSales === 0) return 0;
            return (numerator / totalSales) * 100;
        }

        const result = {
            cm1: pct(sumByHeaders(headerSets.cm1)),
            cm2: pct(sumByHeaders(headerSets.cm2)),
            cm3: pct(sumByHeaders(headerSets.cm3)),
            adSpend: pct(sumByHeaders(headerSets.adSpend)),
            storageFee: pct(sumByHeaders(headerSets.storageFee)),
            sellingFee: pct(sumByHeaders(headerSets.sellingFee))
        };

        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

 
// Sums for selected columns with same default filters as metric-data
pnlController.getPnlTransactionMetricTableData = async (req, res) => {
    try {
        const blobPath = pnlController.getPnlTransactionBlobPath();
        let rows = await azureClient.fecthDatafromBlog(blobPath);
        if (!Array.isArray(rows)) rows = [];

        const flattenedRows = rows.map(r => flattenObject(r));

        const monthYearParam = (req.query && typeof req.query.monthYear === 'string') ? req.query.monthYear.trim() : '';
	const channelParam = (req.query && typeof req.query.channel === 'string') ? req.query.channel.trim() : '';

	let filtered = flattenedRows;
	if (monthYearParam) {
		filtered = filtered.filter(r => {
			const ym = r['Year-Month'] ?? r['year-month'] ?? r['Month-Year'] ?? r['month-year'] ?? r['YearMonth'] ?? r['Year_Month'] ?? r['yearmonth'];
			if (!ym || String(ym).trim() !== monthYearParam) return false;
			return true;
		});
	}
	if (channelParam) {
		filtered = filtered.filter(r => {
			const ch = r['Channel'] ?? r['channel'];
			if (!ch) return false;
			const norm = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
			return norm(ch) === norm(channelParam);
		});
	}

        const columns = {
            'Revenue': ['Total Sales'],
            'COGS': ['Final_cogs_value'],
            'CM1': ['CM1'],
            'Deal Fee': ['Deal_fee'],
            'FBA Inv Placement Fee': ['FBA Inv Placement Fee'],
            'FBA Inventory Fee': ['FBA Inventory Fee'],
            'FBA Reimbursement': ['FBA Reimbursement'],
            'Liquidations': ['Liquidations'],
            'Storage Fee': ['Storage Fee'],
            'FBA Fees': ['fba Fees'],
            'CM2': ['CM2'],
            'Other Marketing Expenses': ['Other marekting expenses'],
            'Promotional Rebates': ['promotional rebates'],
            'Selling fees': ['selling fees'],
            'Total Ad Spend': ['total_ad_spend'],
            'Other Inventory Expenses': ['temp_cm3_manual'],
            'Final_CM3': ['Final_CM3'],

        };

        function sumByHeaders(rowsArr, keys) {
			let total = 0;
            for (const row of rowsArr) {
                let value;
                for (const k of keys) {
                    if (Object.prototype.hasOwnProperty.call(row, k)) { value = row[k]; break; }
                }
                const num = toNumber(value);
				if (Number.isFinite(num)) total += num;
			}
			return total;
		}

        const result = {};
        for (const [outKey, possible] of Object.entries(columns)) {
            result[outKey] = sumByHeaders(filtered, possible);
        }

        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}


pnlController.getPnlBusinessMetricData = async (req, res) => {
	try {
		const blobPath = pnlController.getPnlBusinessBlobPath();
        let rows = await azureClient.fecthDatafromBlog(blobPath);
        if (!Array.isArray(rows)) rows = [];

        const flattenedRows = rows.map(r => flattenObject(r));

        const monthYearParam = (req.query && typeof req.query.monthYear === 'string') ? req.query.monthYear.trim() : '';
        let rowsAfterMonth = flattenedRows;
        if (monthYearParam) {
            rowsAfterMonth = flattenedRows.filter(r => {
                const ym = r['Year-Month'] ?? r['year-month'] ?? r['YearMonth'] ?? r['Year_Month'] ?? r['yearmonth'];
                const my = r['Month-Year'] ?? r['month-year'];
                const v = ym !== undefined ? ym : my;
                if (v === undefined || v === null) return false;
                return String(v).trim() === monthYearParam;
            });
        }

        const channelParam = (req.query && typeof req.query.channel === 'string') ? req.query.channel.trim() : '';
        let filteredRows = rowsAfterMonth;
        if (channelParam) {
            filteredRows = rowsAfterMonth.filter(r => {
                const ch = r['Channel'] ?? r['channel'];
                if (ch === undefined || ch === null) return false;
                const norm = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
                return norm(ch) === norm(channelParam);
            });
        }

        function sumByHeaders(possibleHeaders) {
            let total = 0;
            for (const row of filteredRows) {
                let value;
                for (const key of possibleHeaders) {
                    if (Object.prototype.hasOwnProperty.call(row, key)) {
                        value = row[key];
                        break;
                    }
                }
                const num = toNumber(value);
                if (Number.isFinite(num)) total += num;
            }
            return total;
        }

        const denominatorHeaders = [
            'Total Sales', 'Revenue', 'total_sales', 'Total_Sales'
        ];
        const totalSales = sumByHeaders(denominatorHeaders);

        const headerSets = {
            cm1: ['CM1'],
            cm2: ['CM2'],
            cm3: ['Final_CM3', 'CM3'],
            sellingFee: ['selling fees', 'Selling Fee', 'Selling fees'],
            storageFee: ['Storage Fee'],
            adSpend: ['total_ad_spend', 'Ad Spend', 'Total Ad Spend', 'Spend']
        };

        function pct(numerator) {
            if (!Number.isFinite(totalSales) || totalSales === 0) return 0;
            return (numerator / totalSales) * 100;
        }

        const result = {
            cm1: pct(sumByHeaders(headerSets.cm1)),
            cm2: pct(sumByHeaders(headerSets.cm2)),
            cm3: pct(sumByHeaders(headerSets.cm3)),
            adSpend: pct(sumByHeaders(headerSets.adSpend)),
            storageFee: pct(sumByHeaders(headerSets.storageFee)),
            sellingFee: pct(sumByHeaders(headerSets.sellingFee))
        };

        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

 
// Sums for selected columns with same default filters as metric-data
pnlController.getPnlBusinessMetricTableData = async (req, res) => {
    try {
        const blobPath = pnlController.getPnlBusinessBlobPath();
        let rows = await azureClient.fecthDatafromBlog(blobPath);
        if (!Array.isArray(rows)) rows = [];

        const flattenedRows = rows.map(r => flattenObject(r));

        const monthYearParam = (req.query && typeof req.query.monthYear === 'string') ? req.query.monthYear.trim() : '';
	const channelParam = (req.query && typeof req.query.channel === 'string') ? req.query.channel.trim() : '';

	let filtered = flattenedRows;
	if (monthYearParam) {
		filtered = filtered.filter(r => {
			const ym = r['Year-Month'] ?? r['year-month'] ?? r['Month-Year'] ?? r['month-year'] ?? r['YearMonth'] ?? r['Year_Month'] ?? r['yearmonth'];
			if (!ym || String(ym).trim() !== monthYearParam) return false;
			return true;
		});
	}
	if (channelParam) {
		filtered = filtered.filter(r => {
			const ch = r['Channel'] ?? r['channel'];
			if (!ch) return false;
			const norm = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
			return norm(ch) === norm(channelParam);
		});
	}

        const columns = {
            'Revenue': ['Total Sales'],
            'COGS': ['Final_cogs_value'],
            'CM1': ['CM1'],
            'Deal Fee': ['Deal_fee'],
            'FBA Inv Placement Fee': ['FBA Inv Placement Fee'],
            'FBA Inventory Fee': ['FBA Inventory Fee'],
            'FBA Reimbursement': ['FBA Reimbursement'],
            'Liquidations': ['Liquidations'],
            'Storage Fee': ['Storage Fee'],
            'FBA Fees': ['fba Fees'],
            'CM2': ['CM2'],
            'Other Marketing Expenses': ['Other marekting expenses'],
            'Promotional Rebates': ['promotional rebates'],
            'Selling fees': ['selling fees'],
            'Total Ad Spend': ['total_ad_spend'],
            'Other Inventory Expenses': ['temp_cm3_manual'],
            'Final_CM3': ['Final_CM3'],

        };

        function sumByHeaders(rowsArr, keys) {
			let total = 0;
            for (const row of rowsArr) {
                let value;
                for (const k of keys) {
                    if (Object.prototype.hasOwnProperty.call(row, k)) { value = row[k]; break; }
                }
                const num = toNumber(value);
				if (Number.isFinite(num)) total += num;
			}
			return total;
		}

        const result = {};
        for (const [outKey, possible] of Object.entries(columns)) {
            result[outKey] = sumByHeaders(filtered, possible);
        }

        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

pnlController.getPnlTransactionFilters = async (req, res) => {
    try {
        const blobPath = pnlController.getPnlTransactionBlobPath();
        let rows = await azureClient.fecthDatafromBlog(blobPath);
        if (!Array.isArray(rows)) rows = [];

        const allDistinctValues = getDistinctColumnValues(rows);
        
        const result = {
            'Channel': allDistinctValues['Channel'] || allDistinctValues['channel'] || [],
            'Month-Year': []
        };
        
        const monthYearKeys = ['Month-Year', 'Year-Month', 'YearMonth', 'Year_Month', 'year-month', 'yearmonth'];
        for (const key of monthYearKeys) {
            if (allDistinctValues[key] && allDistinctValues[key].length > 0) {
                result['Month-Year'] = allDistinctValues[key];
                break;
            }
        }

        return res.status(200).json(result);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

export default pnlController;