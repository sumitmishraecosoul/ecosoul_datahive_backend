import azureClient from '../../Utils/azureBlobConnection.js';

const scQuickCommerce = {};

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
			rows = await azureClient.fecthDatafromBlog();
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

export default scQuickCommerce;