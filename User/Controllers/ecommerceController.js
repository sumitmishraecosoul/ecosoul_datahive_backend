import azureClient from '../../Utils/azureBlobConnection.js';
import { BlobServiceClient } from '@azure/storage-blob';
import dotenv from 'dotenv';
dotenv.config();

const ecommerceController = {};

// Filenames in the same blob/container (same structure as Supply Chain/Quick Commerce)
const E_COMMERCE_FILE = 'Ecosoul-Ecom-Demand_Instock.csv';
const ECOMMERCE_INVENTORY_FILE = 'Ecosoul-Inventory_Retail.csv';

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
ecommerceController.getEcommerceBlobPath = () => buildBlobPath(E_COMMERCE_FILE);
ecommerceController.getEcommerceInventoryBlobPath = () => buildBlobPath(ECOMMERCE_INVENTORY_FILE);

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
	const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
	const month = prev.getMonth() + 1;
	const paddedMonth = month < 10 ? `0${month}` : `${month}`;
	return `${prev.getFullYear()}-${paddedMonth}`;
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

    const monthYearRaw = typeof query?.monthYear === 'string' ? query.monthYear.trim() : '';
    const hasAnyFilter = !!(skuSet || materialSet || countrySet || monthYearRaw);

    // If no filters provided at all, return all rows unchanged
    if (!hasAnyFilter) return rows;

    // Apply monthYear only if explicitly provided
    const monthYear = monthYearRaw || undefined;

    return rows.filter(row => {
        const flat = flattenObject(row);
        const sku = flat['SKU'] ?? flat['sku'] ?? flat['Sku'];
        const material = flat['Material'] ?? flat['material'];
        const country = flat['Country'] ?? flat['country'];
        const monthYearVal = flat['Month-Year'] ?? flat['month-year'] ?? flat['monthYear'];

        if (skuSet && (!sku || !skuSet.has(String(sku).trim()))) return false;
        if (materialSet && (!material || !materialSet.has(String(material).trim()))) return false;
        if (countrySet && (!country || !countrySet.has(String(country).trim()))) return false;
        if (monthYear && (!monthYearVal || String(monthYearVal).trim() !== monthYear)) return false;

        return true;
    });
}


ecommerceController.getEcommerceOverviewMetricTableData = async (req, res) => {
	try {
		const supplyPath = ecommerceController.getEcommerceBlobPath();
		console.log('Ecommerce blobPath (ecommerce):', supplyPath);
		let rows = await azureClient.fecthDatafromBlog(supplyPath);
		if (!Array.isArray(rows)) rows = [];

		// Apply common filters (sku, material, country, monthYear w/ default prev month)
		rows = applyCommonFilters(rows, req.query || {});

		const allowedFields = [
			'SKU',
			'Country',
			'Month-Year',
			'Demand',
			'ADS',
			'Exp_RoundUP_30_Days_Sales',
			'last_30_Sale_Quantity',
			'Total incoming',
			'Expected Date',
			'Net_Sellable',
			'Opening_Balance_with_inbound',
			'Demand_fulfillable',
			'Demand_fulfillable_with_inbound',
			'Instock_rate_base',
			'Alert',
			'Sale_Lost'
		];

		const filteredRows = rows.map(row => {
			const filtered = {};
			for (const key of allowedFields) {
				if (Object.prototype.hasOwnProperty.call(row, key)) {
					filtered[key] = row[key];
				}
			}
			return filtered;
		});

		return res.status(200).json(filteredRows);
	} catch (error) {
		return res.status(500).json({ message: 'Error fetching data from Azure Blob', error: error.message });
	}
};


ecommerceController.getEcommerceInventoryMetricTableData = async (req, res) => {
	try {
		const quickPath = ecommerceController.getEcommerceInventoryBlobPath();
		console.log('EcommerceInventory blobPath (ecommerce):', quickPath);
		let rows = await azureClient.fecthDatafromBlog(quickPath);
		if (!Array.isArray(rows)) rows = [];

		const allowedFields = [
			'SKU',
			'Country',
			'afn-fulfillable-quantity',
			'afn-inbound-working-quantity',
			'afn-inbound-shipped-quantity',
			'afn-inbound-receiving-quantity',
			'Customer_reserved',
			'FC_Transfer',
			'FC_Processing',
			'Material',
			'Product_Category',
			'Product_Sub_Category',
			'Product_Type'
		];

		const filteredRows = rows.map(row => {
			const filtered = {};
			for (const key of allowedFields) {
				if (Object.prototype.hasOwnProperty.call(row, key)) {
					filtered[key] = row[key];
				}
			}
			return filtered;
		});

		return res.status(200).json(filteredRows);
	} catch (error) {
		return res.status(500).json({ message: 'Error fetching data from Azure Blob', error: error.message });
	}
};

ecommerceController.getEcommerceOverviewMetricCardData = async (req, res) => {
	try {
		const supplyPath = ecommerceController.getEcommerceBlobPath();
		console.log('Ecommerce blobPath (ecommerce):', supplyPath);
		let rows = await azureClient.fecthDatafromBlog(supplyPath);
		if (!Array.isArray(rows)) rows = [];

		// Apply common filters (sku, material, country, monthYear w/ default prev month)
		rows = applyCommonFilters(rows, req.query || {});

		// Columns to sum up
		const NUMERIC_COLUMNS = [
			'Demand',
			'afn-fulfillable-quantity',
			'Sale_Quantity',
			'Total incoming',
			'Sale_Lost'
		];

		// Map CSV column names to output keys
		const columnMapping = {
			'Demand': 'Demand',
			'afn-fulfillable-quantity': 'afn-fulfillable-quantity',
			'Sale_Quantity': 'Sale Quantity',
			'Total incoming': 'Total Incoming',
			'Sale_Lost': 'Sale Lost'
		};

		const totalsByColumn = Object.fromEntries(Object.values(columnMapping).map(key => [key, 0]));

		for (const row of rows) {
			const flat = flattenObject(row);
			for (const [csvCol, outputKey] of Object.entries(columnMapping)) {
				let value = flat[csvCol];
				// be tolerant to a few common header variants without changing output keys
				if (value === undefined) {
					const variants = [
						csvCol.replace(/\s+/g, ' ').trim(),
						csvCol.replace(/\s+/g, '_'),
						csvCol.replace(/\s+/g, ''),
						csvCol.toLowerCase()
					];
					for (const v of variants) {
						if (Object.prototype.hasOwnProperty.call(flat, v)) { 
							value = flat[v]; 
							break; 
						}
					}
				}
				const numValue = toNumber(value);
				if (Number.isFinite(numValue)) {
					totalsByColumn[outputKey] += numValue;
				}
			}
		}

		const monthYearApplied = (req.query && typeof req.query.monthYear === 'string' && req.query.monthYear.trim())
			? req.query.monthYear.trim()
			: computeDefaultPrevMonthYear();

		return res.status(200).json({ monthYear_applied: monthYearApplied, ...totalsByColumn });
	} catch (error) {
		return res.status(500).json({ message: 'Error computing ecommerce overview metrics', error: error.message });
	}
};

ecommerceController.getDemandInstockByGeographyData = async (req, res) => {
	try {
		const supplyPath = ecommerceController.getEcommerceBlobPath();
		console.log('Ecommerce blobPath (ecommerce):', supplyPath);
		let rows = await azureClient.fecthDatafromBlog(supplyPath);
		if (!Array.isArray(rows)) rows = [];

		// Apply common filters (ensures Month-Year defaults to previous month if not provided)
		rows = applyCommonFilters(rows, req.query || {});

		// Helper to parse common Month-Year formats to comparable Date (first day of month)
		function parseMonthYear(value) {
			if (!value) return null;
			const str = String(value).trim();
			// Try native Date first
			let d = new Date(str);
			if (!isNaN(d)) {
				return new Date(d.getFullYear(), d.getMonth(), 1);
			}
			// Try formats like "MMM-YYYY" or "MMM YYYY"
			const m1 = str.match(/^([A-Za-z]{3,})[-\s](\d{4})$/);
			if (m1) {
				const monthNames = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
				const idx = monthNames.indexOf(m1[1].toLowerCase().slice(0,3));
				const year = parseInt(m1[2], 10);
				if (idx >= 0 && Number.isFinite(year)) return new Date(year, idx, 1);
			}
			// Try numeric M/Y or M-YYYY
			const m2 = str.match(/^(\d{1,2})[\/\-](\d{4})$/);
			if (m2) {
				const month = parseInt(m2[1], 10) - 1;
				const year = parseInt(m2[2], 10);
				if (month >= 0 && month <= 11 && Number.isFinite(year)) return new Date(year, month, 1);
			}
			return null;
		}

		// Group rows by Country
		const rowsByCountry = new Map();
		for (const row of rows) {
			const flat = flattenObject(row);
			const country = flat['Country'];
			if (!country) continue;
			if (!rowsByCountry.has(country)) rowsByCountry.set(country, []);
			rowsByCountry.get(country).push(flat);
		}

		const results = [];
		for (const [country, crow] of rowsByCountry.entries()) {
			// Determine earliest Month-Year for this country
			let earliest = null;
			let earliestStr = null;
			for (const r of crow) {
				const myStr = r['Month-Year'];
				const dt = parseMonthYear(myStr);
				if (!dt) continue;
				if (earliest === null || dt < earliest) {
					earliest = dt;
					earliestStr = myStr;
				}
			}

			if (!earliest) {
				results.push({ Country: country, Instock_rate_base: '-' });
				continue;
			}

			// Compute weighted average at earliest month
			let numerator = 0;
			let denominator = 0;
			for (const r of crow) {
				if (String(r['Month-Year']).trim() !== String(earliestStr).trim()) continue;
				const instockRate = toNumber(r['Instock_rate_base']);
				const demand = toNumber(r['Demand']);
				if (!Number.isFinite(instockRate) || !Number.isFinite(demand)) continue;
				numerator += (instockRate * demand) / 100;
				denominator += demand;
			}

			if (!denominator || !Number.isFinite(numerator)) {
				results.push({ Country: country, Instock_rate_base: '-' });
				continue;
			}

			const value =( numerator / denominator ) * 100;  // weighted instock rate at earliest month
			results.push({ Country: country, Instock_rate_base: value });
		}

		return res.status(200).json(results);
	} catch (error) {
		return res.status(500).json({ message: 'Error fetching data from Azure Blob', error: error.message });
	}
};

ecommerceController.getAlertCountByGeographyData = async (req, res) => {
	try {
		const supplyPath = ecommerceController.getEcommerceBlobPath();
		console.log('Ecommerce blobPath (ecommerce):', supplyPath);
		let rows = await azureClient.fecthDatafromBlog(supplyPath);
		if (!Array.isArray(rows)) rows = [];

		// Apply common filters (none => return all rows unchanged)
		rows = applyCommonFilters(rows, req.query || {});

		// Collect distinct countries (ordered)
		const countrySet = new Set();
		const flattened = rows.map(r => flattenObject(r));
		for (const r of flattened) {
			if (r['Country']) countrySet.add(String(r['Country']).trim());
		}
		const countries = Array.from(countrySet);
		countries.sort((a, b) => a.localeCompare(b));

		// Collect distinct alerts (ordered, case-insensitive stable)
		const alertSet = new Set();
		for (const r of flattened) {
			if (r['Alert']) alertSet.add(String(r['Alert']).trim());
		}
		const alerts = Array.from(alertSet);
		alerts.sort((a, b) => a.localeCompare(b));

		// Initialize data object for each alert label: alert -> { country: count }
		const seriesMap = new Map();
		for (const alert of alerts) {
			const obj = {};
			for (const c of countries) obj[c] = 0;
			seriesMap.set(alert, obj);
		}

		// Count DISTINCT SKUs per (country, alert)
		const seenSkuKeys = new Set();
		for (const r of flattened) {
			const country = r['Country'] ? String(r['Country']).trim() : undefined;
			const alert = r['Alert'] ? String(r['Alert']).trim() : undefined;
			const sku = r['SKU'] ? String(r['SKU']).trim() : undefined;
			if (!country || !alert || !sku) continue;
			if (!countries.includes(country)) continue;
			if (!seriesMap.has(alert)) continue;
			const key = `${alert}||${country}||${sku}`;
			if (seenSkuKeys.has(key)) continue;
			seenSkuKeys.add(key);
			const obj = seriesMap.get(alert);
			obj[country] = (obj[country] || 0) + 1;
		}

		const series = alerts.map(alert => ({ Alert: alert, data: seriesMap.get(alert) || {} }));

		return res.status(200).json({ series });
	} catch (error) {
		return res.status(500).json({ message: 'Error fetching data from Azure Blob', error: error.message });
	}
};

ecommerceController.getSKUTypebyGeographyData = async (req, res) => {
	try {
		const supplyPath = ecommerceController.getEcommerceBlobPath();
		console.log('Ecommerce blobPath (ecommerce):', supplyPath);
		let rows = await azureClient.fecthDatafromBlog(supplyPath);
		if (!Array.isArray(rows)) rows = [];

		// Apply common filters (none => return all rows unchanged)
		rows = applyCommonFilters(rows, req.query || {});

		// Collect distinct countries (ordered)
		const countrySet = new Set();
		const flattened = rows.map(r => flattenObject(r));
		for (const r of flattened) {
			if (r['Country']) countrySet.add(String(r['Country']).trim());
		}
		const countries = Array.from(countrySet);
		countries.sort((a, b) => a.localeCompare(b));

		// Collect distinct SKU Types (ordered)
		const typeSet = new Set();
		for (const r of flattened) {
			if (r['SKU Type']) typeSet.add(String(r['SKU Type']).trim());
		}
		const skuTypes = Array.from(typeSet);
		skuTypes.sort((a, b) => a.localeCompare(b));

		// Initialize data object for each SKU Type label: type -> { country: count }
		const seriesMap = new Map();
		for (const t of skuTypes) {
			const obj = {};
			for (const c of countries) obj[c] = 0;
			seriesMap.set(t, obj);
		}

		// Count DISTINCT SKUs per (country, SKU Type)
		const seenSkuKeys = new Set();
		for (const r of flattened) {
			const country = r['Country'] ? String(r['Country']).trim() : undefined;
			const type = r['SKU Type'] ? String(r['SKU Type']).trim() : undefined;
			const sku = r['SKU'] ? String(r['SKU']).trim() : undefined;
			if (!country || !type || !sku) continue;
			if (!countries.includes(country)) continue;
			if (!seriesMap.has(type)) continue;
			const key = `${type}||${country}||${sku}`;
			if (seenSkuKeys.has(key)) continue;
			seenSkuKeys.add(key);
			const obj = seriesMap.get(type);
			obj[country] = (obj[country] || 0) + 1;
		}

		// Build series: use key name "Alert" as requested, value is the SKU Type
		const series = skuTypes.map(t => ({ Alert: t, data: seriesMap.get(t) || {} }));

		return res.status(200).json({ series });
	} catch (error) {
		return res.status(500).json({ message: 'Error fetching data from Azure Blob', error: error.message });
	}
}

export default ecommerceController;

