//This controller only has controllers for Kehe.

import azureClient from '../../Utils/azureBlobConnection.js';
import { BlobServiceClient } from '@azure/storage-blob';
import dotenv from 'dotenv';
import getDistinctColumnValues, { applyFiltersByMappings } from '../../Utils/filterSelector.js';
dotenv.config();

const retailController = {};

// Filenames in the same blob/container
const KEHE_K_SOLVE = 'Ecosoul-Kehe-Solve_overall.csv';
const KEHE_CS = 'Ecosoul-Kehe_Chain_Store.csv';

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
retailController.getKeheCSBlobPath = () => buildBlobPath(KEHE_CS);

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

// Generic wrapper: apply filters using a per-endpoint mapping (no hardcoding)
function applyQueryFilters(rows, query, mappings) {
	return applyFiltersByMappings(rows, query, mappings);
}

// Mappings for different datasets/APIs in this controller
const KSOLVE_FILTER_MAPPINGS = {
	Invoice_No: ['Invoice #', 'Invoice_#', 'invoice #'],
	Category_Type: ['Category Type', 'Category_Type', 'CategoryType', 'categoryType', 'category_type'],
	Type: ['Type', 'type'],
	Status: ['Status', 'status'],
	PO_No: ['PO #', 'PO_No', 'po #'],
	DC_Name: ['DC #', 'DC_Name', 'dc #'],
	Date: ['Date', 'date', 'Invoice_Date', 'Invoice Date'],
};

const CS_FILTER_MAPPINGS = {
	Month_Year: ['File_Month'],
	Retailer: ['Retailer', 'retailer'],
	Retail_Area:['Retailer Area'],
	SKU: ['SKU', 'sku', 'Sku'],
	UPC: ['UPC', 'upc'],
	Material: ['Material', 'material'],
};


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
		rows = applyQueryFilters(rows, req.query || {}, KSOLVE_FILTER_MAPPINGS);

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

		rows = applyQueryFilters(rows, req.query || {}, KSOLVE_FILTER_MAPPINGS);

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

		rows = applyQueryFilters(rows, req.query || {}, KSOLVE_FILTER_MAPPINGS);

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

		rows = applyQueryFilters(rows, req.query || {}, KSOLVE_FILTER_MAPPINGS);

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

        // Build distinct lists but only for the required 7 fields
        const allDistinct = getDistinctColumnValues(rows);
        const result = {
        	Invoice_No: allDistinct['Invoice #'] || allDistinct['invoice #'] || allDistinct['Invoice_#'] || [],
        	Category_Type: allDistinct['Category Type'] || allDistinct['category type'] || allDistinct['Category_Type'] || [],
        	Type: allDistinct['Type'] || allDistinct['type'] || [],
        	Status: allDistinct['Status'] || allDistinct['status'] || [],
        	PO_No: allDistinct['PO #'] || allDistinct['po #'] || allDistinct['PO_No'] || [],
        	DC_Name: allDistinct['DC #'] || allDistinct['dc #'] || allDistinct['DC_Name'] || [],
        	Date: allDistinct['Date'] || allDistinct['date'] || allDistinct['Invoice_Date'] || allDistinct['Invoice Date'] || [],
        };
        return res.status(200).json(result);
    }
    catch (error) {
        return res.status(500).json({ message: 'Error fetching data from Azure Blob', error: error.message });
    }
}

retailController.getKeheCSFilters = async(req,res) =>{
	try{
		const dId = req.departmentId;
		if (dId !== 1 && dId !== 2) {
			return res.status(403).json({ message: 'Forbidden: insufficient department access' });
		}
		const keheCSPath = retailController.getKeheCSBlobPath();
		console.log('KeheCS blobPath:', keheCSPath);
		const rows = await azureClient.fecthDatafromBlog(keheCSPath);
		if (!Array.isArray(rows)) rows = [];
		const allDistinct = getDistinctColumnValues(rows);
		const result = {
			Month_Year: allDistinct['File_Month'] || allDistinct['file_month'] || [],
			Retailer: allDistinct['Retailer'] || allDistinct['retailer'] || [],
			Retail_Area: allDistinct['Retailer Area'] || allDistinct['retailer area'] || [],
			SKU: allDistinct['SKU'] || allDistinct['sku'] || allDistinct['Sku'] || [],
			UPC: allDistinct['UPC'] || allDistinct['upc'] || [],
			Material: allDistinct['Material'] || allDistinct['material'] || allDistinct['Product'] || [],
		};
		return res.status(200).json(result);
	}
	catch(error){
		return res.status(500).json({ message: 'Error fetching data from Azure Blob', error: error.message });
	}
}


retailController.getKeheCSMetricCardData = async(req,res) =>{
	try{
		const dId = req.departmentId;
		if (dId !== 1 && dId !== 2) {
			return res.status(403).json({ message: 'Forbidden: insufficient department access' });
		}

		const keheCSPath = retailController.getKeheCSBlobPath();
		console.log('KeheCS blobPath:', keheCSPath);

		let rows = await azureClient.fecthDatafromBlog(keheCSPath);
		if (!Array.isArray(rows)) rows = [];

		// Apply filters if provided in query
		rows = applyQueryFilters(rows, req.query || {}, CS_FILTER_MAPPINGS);

		// Prepare aggregations
		let sumOrderedVendorCost = 0;
		let sumShippedVendorCost = 0;

		let sumFillRateQty = 0;
		let countFillRateQty = 0;

		let sumMarkup = 0;
		let countMarkup = 0;

		for (const row of rows) {
			const flat = flattenObject(row);

			// Handle possible key variants
			const orderedVendorCost = getValueByPossibleKeys(flat, [
				'Ordered (Vendor Cost)',
				'Ordered(Vendor Cost)',
				'Ordered_Vendor_Cost',
				'ordered_vendor_cost',
				'ordered (vendor cost)'
			]);
			const shippedVendorCost = getValueByPossibleKeys(flat, [
				'Shipped (Vendor Cost)',
				'Shipped(Vendor Cost)',
				'Shipped_Vendor_Cost',
				'shipped_vendor_cost',
				'shipped (vendor cost)'
			]);
			const fillRateQty = getValueByPossibleKeys(flat, [
				'Fill Rate (Quantity)',
				'FillRate(Quantity)',
				'Fill_Rate_Quantity',
				'fill_rate_quantity',
				'fill rate (quantity)'
			]);
			const markup = getValueByPossibleKeys(flat, [
				'Markup',
				'markup'
			]);

			const orderedNum = toNumber(orderedVendorCost);
			if (Number.isFinite(orderedNum)) {
				sumOrderedVendorCost += orderedNum;
			}

			const shippedNum = toNumber(shippedVendorCost);
			if (Number.isFinite(shippedNum)) {
				sumShippedVendorCost += shippedNum;
			}

			const fillRateNum = toNumber(fillRateQty);
			if (Number.isFinite(fillRateNum)) {
				sumFillRateQty += fillRateNum;
				countFillRateQty += 1;
			}

			const markupNum = toNumber(markup);
			if (Number.isFinite(markupNum)) {
				sumMarkup += markupNum;
				countMarkup += 1;
			}
		}

		// Distinct counts using helper
		const allDistinct = getDistinctColumnValues(rows);
		const retailerValues =
			allDistinct['Retailer'] ||
			allDistinct['retailer'] ||
			[];
		const skuValues =
			allDistinct['SKU'] ||
			allDistinct['sku'] ||
			allDistinct['Sku'] ||
			[];

		const result = {
			'Ordered (Vendor Cost)': sumOrderedVendorCost,
			'Shipped (Vendor Cost)': sumShippedVendorCost,
			'Fill Rate (Quantity)':( countFillRateQty > 0 ? (sumFillRateQty / countFillRateQty) : 0)*100,
			'Markup':( countMarkup > 0 ? (sumMarkup / countMarkup) : 0)*100,
			'Retailer': Array.isArray(retailerValues) ? retailerValues.length : 0,
			'SKU': Array.isArray(skuValues) ? skuValues.length : 0
		};

		return res.status(200).json(result);
	}
	catch(error){
		return res.status(500).json({ message: 'Error fetching data from Azure Blob', error: error.message });
	}
}

retailController.getKeheCSRetailerVendorByShipped = async(req,res) =>{
	try{
		const dId = req.departmentId;
		if (dId !== 1 && dId !== 2) {
			return res.status(403).json({ message: 'Forbidden: insufficient department access' });
		}
		const keheCSPath = retailController.getKeheCSBlobPath();
		console.log('KeheCSRetailerVendorByShipped blobPath:', keheCSPath);
		let rows = await azureClient.fecthDatafromBlog(keheCSPath);
		if (!Array.isArray(rows)) rows = [];

		// Apply filters if provided
		rows = applyQueryFilters(rows, req.query || {}, CS_FILTER_MAPPINGS);

		// Group by Retailer and aggregate metrics
		const retailerGroups = {};

		for (const row of rows) {
			const flat = flattenObject(row);

			// Get Retailer with possible key variations
			const retailer = getValueByPossibleKeys(flat, [
				'Retailer',
				'retailer'
			]);

			// Skip if retailer is missing
			if (!retailer || retailer === null || retailer === undefined || String(retailer).trim() === '') {
				continue;
			}

			const retailerKey = String(retailer).trim();

			// Initialize retailer group if not exists
			if (!retailerGroups[retailerKey]) {
				retailerGroups[retailerKey] = {
					Retailer: retailerKey,
					Retailer_Area_Count: new Set(),
					SKU_Count: new Set(),
					'Ordered (Vendor Cost)': 0,
					'Shipped (Vendor Cost)': 0
				};
			}

			// Get Retailer Area with possible key variations
			const retailerArea = getValueByPossibleKeys(flat, [
				'Retailer Area',
			]);
			if (retailerArea !== null && retailerArea !== undefined && String(retailerArea).trim() !== '') {
				retailerGroups[retailerKey].Retailer_Area_Count.add(String(retailerArea).trim());
			}

			// Get SKU with possible key variations
			const sku = getValueByPossibleKeys(flat, [
				'SKU',
				'sku'
			]);
			if (sku !== null && sku !== undefined && String(sku).trim() !== '') {
				retailerGroups[retailerKey].SKU_Count.add(String(sku).trim());
			}

			// Get Ordered (Vendor Cost) with possible key variations
			const orderedVendorCost = getValueByPossibleKeys(flat, [
				'Ordered (Vendor Cost)',
			]);
			const orderedNum = toNumber(orderedVendorCost);
			if (Number.isFinite(orderedNum)) {
				retailerGroups[retailerKey]['Ordered (Vendor Cost)'] += orderedNum;
			}

			// Get Shipped (Vendor Cost) with possible key variations
			const shippedVendorCost = getValueByPossibleKeys(flat, [
				'Shipped (Vendor Cost)',
			]);
			const shippedNum = toNumber(shippedVendorCost);
			if (Number.isFinite(shippedNum)) {
				retailerGroups[retailerKey]['Shipped (Vendor Cost)'] += shippedNum;
			}
		}

		// Convert Sets to counts and format result
		const result = Object.values(retailerGroups).map(group => ({
			Retailer: group.Retailer,
			Retailer_Area_Count: group.Retailer_Area_Count.size,
			SKU_Count: group.SKU_Count.size,
			'Ordered (Vendor Cost)': group['Ordered (Vendor Cost)'],
			'Shipped (Vendor Cost)': group['Shipped (Vendor Cost)'],
			'Difference in Cost': group['Shipped (Vendor Cost)'] - group['Ordered (Vendor Cost)']
		}));

		return res.status(200).json(result);
	}
	catch(error){
		return res.status(500).json({ message: 'Error fetching data from Azure Blob', error: error.message });
	}
}

retailController.getKeheCSQuantityOrdered= async(req,res) =>{
	try{
		const dId = req.departmentId;
		if (dId !== 1 && dId !== 2) {
			return res.status(403).json({ message: 'Forbidden: insufficient department access' });
		}
		const keheCSPath = retailController.getKeheCSBlobPath();
		console.log('KeheCSRetailerVendorByShipped blobPath:', keheCSPath);
		let rows = await azureClient.fecthDatafromBlog(keheCSPath);
		if (!Array.isArray(rows)) rows = [];

		// Apply filters if provided
		rows = applyQueryFilters(rows, req.query || {}, CS_FILTER_MAPPINGS);

		// Group by Retailer and aggregate metrics
		const retailerGroups = {};

		for (const row of rows) {
			const flat = flattenObject(row);

			// Get Retailer with possible key variations
			const retailer = getValueByPossibleKeys(flat, [
				'Retailer',
				'retailer'
			]);

			// Skip if retailer is missing
			if (!retailer || retailer === null || retailer === undefined || String(retailer).trim() === '') {
				continue;
			}

			const retailerKey = String(retailer).trim();

			// Initialize retailer group if not exists
			if (!retailerGroups[retailerKey]) {
				retailerGroups[retailerKey] = {
					Retailer: retailerKey,
					Retailer_Area_Count: new Set(),
					SKU_Count: new Set(),
					'Ordered (Quantity)': 0,
					'Shipped (Quantity)': 0
				};
			}

			// Get Retailer Area with possible key variations
			const retailerArea = getValueByPossibleKeys(flat, [
				'Retailer Area',
			]);
			if (retailerArea !== null && retailerArea !== undefined && String(retailerArea).trim() !== '') {
				retailerGroups[retailerKey].Retailer_Area_Count.add(String(retailerArea).trim());
			}

			// Get SKU with possible key variations
			const sku = getValueByPossibleKeys(flat, [
				'SKU',
				'sku'
			]);
			if (sku !== null && sku !== undefined && String(sku).trim() !== '') {
				retailerGroups[retailerKey].SKU_Count.add(String(sku).trim());
			}

			// Get Ordered (Vendor Cost) with possible key variations
			const orderedVendorCost = getValueByPossibleKeys(flat, [
				'Ordered (Quantity)',
			]);
			const orderedNum = toNumber(orderedVendorCost);
			if (Number.isFinite(orderedNum)) {
				retailerGroups[retailerKey]['Ordered (Quantity)'] += orderedNum;
			}

			// Get Shipped (Vendor Cost) with possible key variations
			const shippedVendorCost = getValueByPossibleKeys(flat, [
				'Shipped (Quantity)',
			]);
			const shippedNum = toNumber(shippedVendorCost);
			if (Number.isFinite(shippedNum)) {
				retailerGroups[retailerKey]['Shipped (Quantity)'] += shippedNum;
			}
		}

		// Convert Sets to counts and format result
		const result = Object.values(retailerGroups).map(group => ({
			Retailer: group.Retailer,
			Retailer_Area_Count: group.Retailer_Area_Count.size,
			SKU_Count: group.SKU_Count.size,
			'Ordered (Quantity)': group['Ordered (Quantity)'],
			'Shipped (Quantity)': group['Shipped (Quantity)'],
			'Difference in Cost': group['Shipped (Quantity)'] - group['Ordered (Quantity)']
		}));

		return res.status(200).json(result);
	}
	catch(error){
		return res.status(500).json({ message: 'Error fetching data from Azure Blob', error: error.message });
	}
}

retailController.getKeheCSMetricTableData = async(req,res) =>{
	try {
		const dId = req.departmentId;
		if (dId !== 1 && dId !== 2) {
			return res.status(403).json({ message: 'Forbidden: insufficient department access' });
		}
		const keheCSPath = retailController.getKeheCSBlobPath();
		console.log('KeheCSMetricTableData blobPath:', keheCSPath);
		let rows = await azureClient.fecthDatafromBlog(keheCSPath);
		if (!Array.isArray(rows)) rows = [];
		return res.status(200).json(rows);
	} catch (error) {
		return res.status(500).json({ message: 'Error fetching data from Azure Blob', error: error.message });
	}
}

export default retailController;