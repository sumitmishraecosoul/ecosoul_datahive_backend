import azureClient from '../../Utils/azureBlobConnection.js';
import { BlobServiceClient } from '@azure/storage-blob';
import dotenv from 'dotenv';
import getDistinctColumnValues from '../../Utils/filterSelector.js';
dotenv.config();

const retailController = {};

// Filenames in the same blob/container
const KEHE_K_SOLVE = 'Ecosoul-Kehe-Solve_overall.csv';
// const QUICKCOMM_FILE = 'Ecosoul-quickcomm_invoice_SD.csv';

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
retailController.getKeheKSolveBlobPath = () => buildBlobPath(KEHE_K_SOLVE);

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

function applyQueryFilters(rows, query) {
	const hasFilters = query && Object.values(query).some(v => v !== undefined && v !== null && String(v).trim() !== '');
	if (!hasFilters) return rows;
	
	const skuFilter = query.sku ? String(query.sku).split(',').map(s => s.trim()) : undefined;
	const channelFilter = query.channel ? String(query.channel).split(',').map(s => s.trim()) : undefined;
	const invoiceNoFilter = query.Invoice_No ? String(query.Invoice_No).split(',').map(s => s.trim()) : undefined;
	const categoryTypeFilter = query.Category_Type ? String(query.Category_Type).split(',').map(s => s.trim()) : undefined;
	const typeFilter = query.Type ? String(query.Type).split(',').map(s => s.trim()) : undefined;
	const statusFilter = query.Status ? String(query.Status).split(',').map(s => s.trim()) : undefined;
	const poNoFilter = query.PO_No ? String(query.PO_No).split(',').map(s => s.trim()) : undefined;
	const dcNameFilter = query.DC_Name ? String(query.DC_Name).split(',').map(s => s.trim()) : undefined;
	const dateFilter = query.Date ? String(query.Date).split(',').map(s => s.trim()) : undefined;
	
	return rows.filter(r => {
		const flat = flattenObject(r);
		
		if (skuFilter) {
			const sku = String(getValueByPossibleKeys(flat, ['SKU', 'sku', 'Sku']) ?? '');
			if (!skuFilter.includes(sku)) return false;
		}
		
		if (channelFilter) {
			const channel = String(getValueByPossibleKeys(flat, ['Channel', 'channel']) ?? '');
			if (!channelFilter.includes(channel)) return false;
		}
		
		if (invoiceNoFilter) {
			const invoiceNo = String(getValueByPossibleKeys(flat, ['Invoice #', 'Invoice_No', 'invoice #', 'Invoice_#']) ?? '');
			if (!invoiceNoFilter.includes(invoiceNo)) return false;
		}
		
		if (categoryTypeFilter) {
			const categoryType = String(getValueByPossibleKeys(flat, ['Category Type', 'CategoryType', 'category_type', 'categoryType', 'Category_Type']) ?? '');
			if (!categoryTypeFilter.includes(categoryType)) return false;
		}
		
		if (typeFilter) {
			const type = String(getValueByPossibleKeys(flat, ['Type', 'type']) ?? '');
			if (!typeFilter.includes(type)) return false;
		}
		
		if (statusFilter) {
			const status = String(getValueByPossibleKeys(flat, ['Status', 'status']) ?? '');
			if (!statusFilter.includes(status)) return false;
		}
		
		if (poNoFilter) {
			const poNo = String(getValueByPossibleKeys(flat, ['PO #', 'PO_No', 'po #']) ?? '');
			if (!poNoFilter.includes(poNo)) return false;
		}
		
		if (dcNameFilter) {
			const dcName = String(getValueByPossibleKeys(flat, ['DC #', 'DC_Name', 'dc #']) ?? '');
			if (!dcNameFilter.includes(dcName)) return false;
		}
		
		if (dateFilter) {
			const date = String(getValueByPossibleKeys(flat, ['Date', 'date', 'Invoice_Date', 'Invoice Date']) ?? '');
			if (!dateFilter.includes(date)) return false;
		}
		
		return true;
	});
}


retailController.getKeheKSolveInvoiceDeduction = async(req,res) =>{
	try{
		const dId = req.departmentId;
		if (dId !== 1 && dId !== 2) {
			return res.status(403).json({ message: 'Forbidden: insufficient department access' });
		}

		const keheKSolvePath = retailController.getKeheKSolveBlobPath();
		console.log('KeheKSolve blobPath:', keheKSolvePath);
		let rows = await azureClient.fecthDatafromBlog(keheKSolvePath);
		if (!Array.isArray(rows)) rows = [];

		rows = applyQueryFilters(rows, req.query || {});

		// Helper to find column value with possible key variations
		const getColumnValue = (flatRow, possibleKeys) => {
			return getValueByPossibleKeys(flatRow, possibleKeys);
		};

		// Group by Category Type and sum Invoice Total
		const sumsByCategory = {};
		let totalSum = 0;
		
		for (const row of rows) {
			const flat = flattenObject(row);
			
			// Get Category Type with possible key variations
			const categoryType = getColumnValue(flat, [
				'Category Type',
				'CategoryType',
				'category_type',
				'categoryType',
				'Category_Type'
			]);
			
			// Get Invoice Total with possible key variations
			const invoiceTotal = getColumnValue(flat, [
				'Invoice Total',
				'InvoiceTotal',
				'invoice_total',
				'invoiceTotal',
				'Invoice_Total'
			]);
			
			// Parse invoice total amount
			const amount = toNumber(invoiceTotal);
			if (!Number.isFinite(amount)) {
				continue;
			}
			
			// Add to total sum
			totalSum += amount;
			
			// Skip if category type is missing
			if (!categoryType || categoryType === null || categoryType === undefined || String(categoryType).trim() === '') {
				continue;
			}
			
			const categoryKey = String(categoryType).trim();
			
			// Initialize category sum if not exists
			if (!sumsByCategory[categoryKey]) {
				sumsByCategory[categoryKey] = 0;
			}
			
			// Add to category sum
			sumsByCategory[categoryKey] += amount;
		}
		
		// Calculate proportions (divide each category sum by total sum)
		const proportionsByCategory = {};
		if (totalSum > 0) {
			for (const [category, sum] of Object.entries(sumsByCategory)) {
				proportionsByCategory[category] = (sum / totalSum)*100;
			}
		}
		
		return res.status(200).json(proportionsByCategory);
	}
	catch(error){
		return res.status(500).json({ message: 'Error fetching invoice deduction by category', error: error.message });
	}
}

retailController.getKeheKSolveNetPayableDeduction = async(req,res)=>{
	try{
		const dId = req.departmentId;
		if (dId !== 1 && dId !== 2) {
			return res.status(403).json({ message: 'Forbidden: insufficient department access' });
		}
		const keheKSolvePath = retailController.getKeheKSolveBlobPath();
		console.log('KeheKSolve blobPath:', keheKSolvePath);
		let rows = await azureClient.fecthDatafromBlog(keheKSolvePath);
		if (!Array.isArray(rows)) rows = [];

		rows = applyQueryFilters(rows, req.query || {});

		// Helper to find column value with possible key variations
		const getColumnValue = (flatRow, possibleKeys) => {
			return getValueByPossibleKeys(flatRow, possibleKeys);
		};

		// Group by Category Type and sum Invoice Total
		const sumsByCategory = {};
		let totalSum = 0;
		
		for (const row of rows) {
			const flat = flattenObject(row);
			
			// Get Category Type with possible key variations
			const categoryType = getColumnValue(flat, [
				'Category Type',
				'CategoryType',
				'category_type',
				'categoryType',
				'Category_Type'
			]);
			
			// Get Invoice Total with possible key variations
			const invoiceTotal = getColumnValue(flat, [
				'Net Payable',
				'net_payable',
			]);
			
			// Parse invoice total amount
			const amount = toNumber(invoiceTotal);
			if (!Number.isFinite(amount)) {
				continue;
			}
			
			// Add to total sum
			totalSum += amount;
			
			// Skip if category type is missing
			if (!categoryType || categoryType === null || categoryType === undefined || String(categoryType).trim() === '') {
				continue;
			}
			
			const categoryKey = String(categoryType).trim();
			
			// Initialize category sum if not exists
			if (!sumsByCategory[categoryKey]) {
				sumsByCategory[categoryKey] = 0;
			}
			
			// Add to category sum
			sumsByCategory[categoryKey] += amount;
		}
		
		// Calculate proportions (divide each category sum by total sum)
		const proportionsByCategory = {};
		if (totalSum > 0) {
			for (const [category, sum] of Object.entries(sumsByCategory)) {
				proportionsByCategory[category] = (sum / totalSum)*100;
			}
		}
		
		return res.status(200).json(proportionsByCategory);
	}
	catch(error){
		return res.status(500).json({ message: 'Error fetching invoice deduction by category', error: error.message });
	}
}

retailController.getKeheKSolveInvoiceAmount = async(req,res)=>{
	try {
		const dId = req.departmentId;
		if (dId !== 1 && dId !== 2) {
			return res.status(403).json({ message: 'Forbidden: insufficient department access' });
		}
		const keheKSolvePath = retailController.getKeheKSolveBlobPath();
		console.log('KeheKSolve blobPath:', keheKSolvePath);
		let rows = await azureClient.fecthDatafromBlog(keheKSolvePath);
		if (!Array.isArray(rows)) rows = [];

		rows = applyQueryFilters(rows, req.query || {});

		// Helper to find column value with possible key variations
		const getColumnValue = (flatRow, possibleKeys) => {
			return getValueByPossibleKeys(flatRow, possibleKeys);
		};

		// Group by Category Type and sum Invoice Amt
		const sumsByCategory = {};
		
		for (const row of rows) {
			const flat = flattenObject(row);
			
			// Get Category Type with possible key variations
			const categoryType = getColumnValue(flat, [
				'Category Type',
				'CategoryType',
				'category_type',
				'categoryType',
				'Category_Type'
			]);
			
			// Get Invoice Amt with possible key variations
			const invoiceAmt = getColumnValue(flat, [
				'Invoice Amt',
				'InvoiceAmt',
				'invoice_amt',
				'invoiceAmt',
				'Invoice_Amt',
				'Invoice Amount',
				'InvoiceAmount',
				'invoice_amount'
			]);
			
			// Skip if category type is missing
			if (!categoryType || categoryType === null || categoryType === undefined || String(categoryType).trim() === '') {
				continue;
			}
			
			const categoryKey = String(categoryType).trim();
			
			// Initialize category sum if not exists
			if (!sumsByCategory[categoryKey]) {
				sumsByCategory[categoryKey] = 0;
			}
			
			// Parse and add invoice amount
			const amount = toNumber(invoiceAmt);
			if (Number.isFinite(amount)) {
				sumsByCategory[categoryKey] += amount;
			}
		}
		
		return res.status(200).json(sumsByCategory);
	} catch (error) {
		return res.status(500).json({ message: 'Error fetching invoice amount by category', error: error.message });
	}
}

retailController.getKeheKSolveMetricTableData = async(req,res) =>{
	try {
		const dId = req.departmentId;
		if (dId !== 1 && dId !== 2) {
			return res.status(403).json({ message: 'Forbidden: insufficient department access' });
		}
		const keheKSolvePath = retailController.getKeheKSolveBlobPath();
		console.log('KeheKSolve blobPath:', keheKSolvePath);
		let rows = await azureClient.fecthDatafromBlog(keheKSolvePath);
		if (!Array.isArray(rows)) rows = [];

		rows = applyQueryFilters(rows, req.query || {});

		// Helper to find column value with possible key variations
		const getColumnValue = (flatRow, possibleKeys) => {
			return getValueByPossibleKeys(flatRow, possibleKeys);
		};

		// Define column mappings with possible key variations
		const columnMappings = {
			'Invoice': [
				'Invoice #',
			],
			'Invoice Date': [
				'Invoice_Date',
			],
			'Category Type': [
				'Category Type',
				'CategoryType'
			],
			'Invoice Amount': [
				'Invoice Amt',
				'InvoiceAmt',
			],
			'Invoice Total': [
				'Invoice Total',
				'InvoiceTotal',
				'Invoice_Total'
			],
			'Net Deduction': [
				'Net Deduction',
				'NetDeduction',
			],
			'Net Payable': [
				'Net Payable',
				'NetPayable',
			]
		};

		// Filter rows to only include specified columns
		const filteredRows = rows.map(row => {
			const flat = flattenObject(row);
			const filteredRow = {};
			
			// Extract only the specified columns
			for (const [outputKey, possibleKeys] of Object.entries(columnMappings)) {
				const value = getColumnValue(flat, possibleKeys);
				// Include the column even if value is null/undefined to maintain structure
				filteredRow[outputKey] = value !== undefined ? value : null;
			}
			
			return filteredRow;
		});

		return res.status(200).json(filteredRows);
	} catch (error) {
		return res.status(500).json({ message: 'Error fetching metric table data', error: error.message });
	}
}

retailController.getKeheKSolveFilters = async(req,res) =>{
	try {
		const dId = req.departmentId;
		if (dId !== 1 && dId !== 2) {
			return res.status(403).json({ message: 'Forbidden: insufficient department access' });
		}
        const keheKSolvePath = retailController.getKeheKSolveBlobPath();
        console.log('KeheKSolve blobPath:', keheKSolvePath);
        const rows = await azureClient.fecthDatafromBlog(keheKSolvePath);
        if (!Array.isArray(rows)) rows = [];

        const allDistinct = getDistinctColumnValues(rows);
        const result = {
            Invoice_No: allDistinct['Invoice #'] || allDistinct['invoice #'] || allDistinct['Invoice_#'] || [],
			Category_Type : allDistinct['Category Type'] || allDistinct['category type'] || allDistinct['Category_Type'] || [],
			Type: allDistinct['Type'] || allDistinct['type'] || allDistinct['Type'] || [],
			Status: allDistinct['Status'] || allDistinct['status'] || allDistinct['Status'] || [],
			PO_No: allDistinct['PO #'] || allDistinct['po #'] || allDistinct['PO_No'] || [],
			DC_Name : allDistinct['DC #'] || allDistinct['dc #'] || [],
			Date: allDistinct['Date'] || allDistinct['date'] || [],
        };

        return res.status(200).json(result);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error fetching data from Azure Blob', error: error.message });
    }
}

export default retailController;