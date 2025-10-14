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


ecommerceController.getEcommerceOverviewMetricTableData = async (req, res) => {
	try {
		const supplyPath = ecommerceController.getEcommerceBlobPath();
		console.log('Ecommerce blobPath (ecommerce):', supplyPath);
		let rows = await azureClient.fecthDatafromBlog(supplyPath);
		if (!Array.isArray(rows)) rows = [];
		return res.status(200).json(rows);
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

export default ecommerceController;

