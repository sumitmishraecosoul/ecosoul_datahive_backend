import azureClient from '../../Utils/azureBlobConnection.js';
import { BlobServiceClient } from '@azure/storage-blob';
import dotenv from 'dotenv';
import getDistinctColumnValues from '../../Utils/filterSelector.js';
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

retailController.getRetailOverviewInvoiceTotalData = async (req, res) => {
	try {
		const supplyPath = retailController.getSupplyChainBlobPath();
		console.log('SupplyChain blobPath:', supplyPath);
		let rows = await azureClient.fecthDatafromBlog(supplyPath);
		if (!Array.isArray(rows)) rows = [];
	}
	catch (error) {
		return res.status(500).json({ message: 'Error fetching data from Azure Blob', error: error.message });
	}
};