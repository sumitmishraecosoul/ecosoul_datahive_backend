import azureClient from '../../Utils/azureBlobConnection.js';
import { BlobServiceClient } from '@azure/storage-blob';
import dotenv from 'dotenv';
dotenv.config();

const scQuickCommerce = {};

// Filenames in the same blob/container
const SUPPLY_CHAIN_FILE = 'Ecosoul-inventory_Supply_chain.csv';
const QUICKCOMM_FILE = 'Ecosoul-quickcomm_invoice_SD.csv';

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
scQuickCommerce.getSupplyChainBlobPath = () => buildBlobPath(SUPPLY_CHAIN_FILE);
scQuickCommerce.getQuickCommBlobPath = () => buildBlobPath(QUICKCOMM_FILE);

// Azure Storage connection for downloads
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_CONNECTION_STRING;
const containerName = process.env.AZURE_CONTAINER_NAME;

// Helper function to get blob stream for downloads
const getBlobStream = async (filename) => {
	const blobPath = buildBlobPath(filename);
	const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
	
	// Use the container name from environment variables and the full blob path
	const containerClient = blobServiceClient.getContainerClient(containerName);
	const blockBlobClient = containerClient.getBlockBlobClient(blobPath);
	
	return blockBlobClient.download(0);
};

// Hardcoded columns and groups expected by frontend
const METRIC_COLUMNS = [
	'3G', 'Updike', 'Shipcube-East', 'Shipcube-West',
	'Amazon-USA', 'Amazon-Canada', 'Amazon-Germany', 'Amazon-UAE', 'Amazon-UK', 'Amazon-India',
	'Easy Ecom', 'Flipkart', 'AWD-Units',
	'Shipcube-East_Instransit', 'Shipcube-West_Intransit',
	'RSVD_Canada', 'RSVD_Germany', 'RSVD_India', 'RSVD_UAE', 'RSVD_UK', 'RSVD_USA',
	'Inbound-Canada', 'Inbound-Germany', 'Inbound-India', 'Inbound-UAE', 'Inbound-UK', 'Inbound-USA'
];

const GROUPS = {
	'Sellable Stock': [
		'3G', 'Updike', 'Shipcube-East', 'Shipcube-West',
		'Amazon-USA', 'Amazon-Canada', 'Amazon-Germany', 'Amazon-UAE', 'Amazon-UK', 'Amazon-India',
		'Easy Ecom', 'Flipkart', 'AWD-Units'
	],
	'Reserved': ['RSVD_USA', 'RSVD_Canada', 'RSVD_Germany', 'RSVD_UAE', 'RSVD_UK', 'RSVD_India'],
	'Inbound': ['Inbound-USA', 'Inbound-Canada', 'Inbound-Germany', 'Inbound-UAE', 'Inbound-UK', 'Inbound-India']
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

// Helper: coerce to numeric string with original format preserved if not numeric
function toNumericString(value) {
	if (value === null || value === undefined) return '0.0';
	const n = parseFloat(String(value).toString().replace(/,/g, '').trim());
	return Number.isFinite(n) ? String(n) : String(value);
}

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

// Map a raw row to the frontend shape
function mapRowToFrontend(row) {
	const flat = flattenObject(row);
	const sku = getValueByPossibleKeys(flat, ['SKU', 'sku', 'Sku']);
	const channel = getValueByPossibleKeys(flat, ['Channel', 'channel']);
	const material = getValueByPossibleKeys(flat, ['Material', 'material']);
	const boxPerCase = getValueByPossibleKeys(flat, ['Box / Case', 'boxPerCase', 'box_per_case']);

	const metrics = {};
	for (const col of METRIC_COLUMNS) {
		// Support both exact key and common variants
		const candidates = [col, col.replace(/\s+/g, '_'), col.replace(/\s+/g, ''), col.toLowerCase()];
		metrics[col] = toNumericString(getValueByPossibleKeys(flat, candidates) ?? '0.0');
	}

	return {
		sku: sku !== undefined ? String(sku) : undefined,
		channel: channel !== undefined ? String(channel) : undefined,
		metrics,
		groups: GROUPS,
		metadata: {
			material: material !== undefined ? String(material) : undefined,
			boxPerCase: Number.isFinite(toNumber(boxPerCase)) ? parseFloat(toNumber(boxPerCase)) : undefined
		}
	};
}

function applyBasicFilters(rows, query) {
	const hasFilters = query && Object.values(query).some(v => v !== undefined && v !== null && String(v).trim() !== '');
	if (!hasFilters) return rows;
	const skuFilter = query.sku ? String(query.sku).split(',').map(s => s.trim()) : undefined;
	const channelFilter = query.channel ? String(query.channel).split(',').map(s => s.trim()) : undefined;
	return rows.filter(r => {
		const flat = flattenObject(r);
		const sku = String(getValueByPossibleKeys(flat, ['SKU', 'sku', 'Sku']) ?? '');
		const channel = String(getValueByPossibleKeys(flat, ['Channel', 'channel']) ?? '');
		if (skuFilter && !skuFilter.includes(sku)) return false;
		if (channelFilter && !channelFilter.includes(channel)) return false;
		return true;
	});
}

function aggregateTotals(rows) {
	const totals = {};
	for (const col of METRIC_COLUMNS) totals[col] = 0;
	for (const row of rows) {
		const mapped = mapRowToFrontend(row);
		for (const col of METRIC_COLUMNS) {
			const n = toNumber(mapped.metrics[col]);
			if (Number.isFinite(n)) totals[col] += n;
		}
	}
	let consolidated = 0;
	for (const col of METRIC_COLUMNS) consolidated += totals[col];
	// Convert totals back to strings as frontend expects strings in metrics
	const totalsAsStrings = Object.fromEntries(Object.entries(totals).map(([k, v]) => [k, String(v)]));
	return { totalsAsStrings, consolidated };
}

scQuickCommerce.getMetricTableData = async (req, res) => {
	try {
		// Acquire data strictly from Azure Blob CSV
		let rows;
		try {
			// Use Supply Chain file specifically for this API
			const supplyPath = scQuickCommerce.getSupplyChainBlobPath();
			console.log('SupplyChain blobPath:', supplyPath);
			rows = await azureClient.fecthDatafromBlog(supplyPath);
		} catch (e) {
			return res.status(500).json({ message: 'Error fetching data from Azure Blob', error: e.message });
		}
		if (!Array.isArray(rows)) rows = [];

		// Filter
		const filtered = applyBasicFilters(rows, req.query || {});
		const filtersProvided = req.query && Object.values(req.query).some(v => v !== undefined && v !== null && String(v).trim() !== '');

		if (!filtersProvided) {
			// No filters: return consolidated totals in the same shape
			const { totalsAsStrings, consolidated } = aggregateTotals(rows);
			return res.status(200).json({
				sku: 'ALL',
				channel: 'ALL',
				metrics: totalsAsStrings,
				groups: GROUPS,
				metadata: { material: undefined, boxPerCase: undefined },
				consolidated_total: consolidated
			});
		}

		// With filters: map each row to the expected shape
		const items = filtered.map(mapRowToFrontend);
		return res.status(200).json(items);
	} catch (error) {
		return res.status(500).json({ message: 'Error computing metric table data', error: error.message });
	}
};

scQuickCommerce.getSCOverviewMetricTableData = async (req, res) => {
	try {
		const supplyPath = scQuickCommerce.getSupplyChainBlobPath();
		console.log('SupplyChain blobPath:', supplyPath);
		const rows = await azureClient.fecthDatafromBlog(supplyPath);
		
		// Filter to only return specified fields
		const filteredRows = rows.map(row => {
			const filteredRow = {};
			
			// Always include these core fields
			if (row.SKU !== undefined) filteredRow.SKU = row.SKU;
			if (row.Channel !== undefined) filteredRow.Channel = row.Channel;
			if (row.Material !== undefined) filteredRow.Material = row.Material;
			if (row['Box / Case'] !== undefined) filteredRow['Box / Case'] = row['Box / Case'];
			
			// Include metric fields
			const metricFields = [
				'Amazon-USA', 'Shipcube-East', 'Updike', '3G', 'Walmart', 'Shipcube-West',
				'Easy Ecom', 'Flipkart', 'AWD-Units', 'Shipcube-East_Instransit', 'Shipcube-West_Intransit'
			];
			
			metricFields.forEach(field => {
				if (row[field] !== undefined) {
					filteredRow[field] = row[field];
				}
			});
			
			return filteredRow;
		});
		
		return res.status(200).json(filteredRows);
	} catch (error) {
		return res.status(500).json({ message: 'Error fetching data from Azure Blob', error: error.message });
	}
};

scQuickCommerce.getQuickCommMetricTableData = async (req, res) => {
	try {
		const quickPath = scQuickCommerce.getQuickCommBlobPath();
		console.log('QuickComm blobPath:', quickPath);
		const rows = await azureClient.fecthDatafromBlog(quickPath);
		return res.status(200).json(rows);
	} catch (error) {
		return res.status(500).json({ message: 'Error fetching data from Azure Blob', error: error.message });
	}
};

// Consolidated metric card data for Quick Commerce
scQuickCommerce.getQuickCommerceMetrics = async (req, res) => {
	try {
		const quickPath = scQuickCommerce.getQuickCommBlobPath();
		console.log('QuickComm metrics blobPath:', quickPath);
		let rows = await azureClient.fecthDatafromBlog(quickPath);
		if (!Array.isArray(rows)) rows = [];

		// Optional filter by comma-separated SKU list from query param
		const skuParam = req.query && typeof req.query.sku !== 'undefined' ? String(req.query.sku) : '';
		const hasSkuFilter = skuParam.trim() !== '';
		if (hasSkuFilter) {
			const allowedSkus = new Set(
				skuParam
					.split(',')
					.map(s => s.trim())
					.filter(Boolean)
			);
			rows = rows.filter(row => {
				const flat = flattenObject(row);
				const sku = flat['SKU'] ?? flat['sku'] ?? flat['Sku'];
				return sku !== undefined && allowedSkus.has(String(sku).trim());
			});
		}

		// Optional filter by comma-separated Location list from query param
		const locationParam = req.query && typeof req.query.location !== 'undefined' ? String(req.query.location) : '';
		const hasLocationFilter = locationParam.trim() !== '';
		if (hasLocationFilter) {
			const allowedLocations = new Set(
				locationParam
					.split(',')
					.map(s => s.trim())
					.filter(Boolean)
			);
			rows = rows.filter(row => {
				const flat = flattenObject(row);
				const loc = flat['Location'] ?? flat['location'] ?? flat['Loc'] ?? flat['loc'];
				return loc !== undefined && allowedLocations.has(String(loc).trim());
			});
		}

		const toNum = (v) => {
			if (v === null || v === undefined) return 0;
			const n = parseFloat(String(v).toString().replace(/,/g, '').trim());
			return Number.isFinite(n) ? n : 0;
		};

		// Exact column names to consolidate from the Quick Commerce CSV
		const NUMERIC_COLUMNS = [
			'Box/Case',
			'Warehouse Qty',
			'Delivered',
			'In-Transit',
			'Invoiced_Qty',
			'Sellable(In Hand)',
			'MTQ',
			'Active PO Qty',
			'SLA Days',
			'Inward Qty',
			'Required Qty',
			'Sellable after Required Qty'
		];

		const totalsByColumn = Object.fromEntries(NUMERIC_COLUMNS.map(c => [c, 0]));
		const skuSet = new Set();

		for (const row of rows) {
			const flat = flattenObject(row);
			const sku = flat['SKU'] ?? flat['sku'] ?? flat['Sku'];
			if (sku !== undefined && String(sku).trim() !== '') skuSet.add(String(sku).trim());
			for (const col of NUMERIC_COLUMNS) {
				let value = flat[col];
				// be tolerant to a few common header variants without changing output keys
				if (value === undefined) {
					const variants = [
						col.replace(/\s+/g, ' ').trim(),
						col.replace(/\s+/g, '_'),
						col.replace(/\s+/g, ''),
						col.toLowerCase()
					];
					for (const v of variants) {
						if (Object.prototype.hasOwnProperty.call(flat, v)) { value = flat[v]; break; }
					}
				}
				totalsByColumn[col] += toNum(value);
			}
		}

		return res.status(200).json({
			'Total SKU Count': skuSet.size,
			...totalsByColumn
		});
	} catch (error) {
		return res.status(500).json({ message: 'Error computing quick commerce metrics', error: error.message });
	}
};

// Download API endpoints
scQuickCommerce.downloadSCOverviewCSV = async (req, res) => {
	try {
		const blobDownload = await getBlobStream(SUPPLY_CHAIN_FILE);
		res.setHeader('Content-Disposition', `attachment; filename="${SUPPLY_CHAIN_FILE}"`);
		res.setHeader('Content-Type', 'text/csv');
		blobDownload.readableStreamBody.pipe(res);
	} catch (error) {
		console.error('Error downloading Supply Chain CSV:', error);
		res.status(404).send('File not found');
	}
};

scQuickCommerce.downloadSCQuickCommerceCSV = async (req, res) => {
	try {
		const blobDownload = await getBlobStream(QUICKCOMM_FILE);
		res.setHeader('Content-Disposition', `attachment; filename="${QUICKCOMM_FILE}"`);
		res.setHeader('Content-Type', 'text/csv');
		blobDownload.readableStreamBody.pipe(res);
	} catch (error) {
		console.error('Error downloading Quick Commerce CSV:', error);
		res.status(404).send('File not found');
	}
};

export default scQuickCommerce;