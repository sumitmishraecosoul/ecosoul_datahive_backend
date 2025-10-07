import scQuickCommerce from '../Controllers/scQuickCommerce.js';
import express from 'express';

const router = express.Router();


/**
 * @swagger
 * /supply-chain/quick-commerce/metrics:
 *   get:
 *     tags:
 *       - Supply Chain
 *     summary: Get Quick Commerce metric table data
 *     description: >
 *       Returns either consolidated totals for all metrics (if no filters provided) 
 *       or filtered metric data for matching SKUs/channels.  
 *       Users may filter the dataset by passing **sku** and/or **channel** as query parameters.
 *     parameters:
 *       - in: query
 *         name: sku
 *         schema:
 *           type: string
 *           example: "SKU123,SKU456"
 *         description: Comma‑separated list of SKUs to filter by
 *       - in: query
 *         name: channel
 *         schema:
 *           type: string
 *           example: "Amazon-USA,Flipkart"
 *         description: Comma‑separated list of channels to filter by
 *     responses:
 *       200:
 *         description: Metrics fetched successfully
 *         content:
 *           application/json:
 *             examples:
 *               noFilters:
 *                 summary: Consolidated totals (no filters provided)
 *                 value:
 *                   sku: "ALL"
 *                   channel: "ALL"
 *                   metrics:
 *                     "3G": "120"
 *                     "Updike": "50"
 *                     "Amazon-USA": "300"
 *                   groups:
 *                     Sellable Stock: ["3G", "Updike", "Amazon-USA"]
 *                     Reserved: ["RSVD_USA"]
 *                     Inbound: ["Inbound-USA"]
 *                   metadata:
 *                     material: null
 *                     boxPerCase: null
 *                   consolidated_total: 470
 *               withFilters:
 *                 summary: Filtered rows (filters applied)
 *                 value:
 *                   - sku: "SKU123"
 *                     channel: "Amazon-USA"
 *                     metrics:
 *                       "3G": "50"
 *                       "Updike": "20"
 *                       "Amazon-USA": "100"
 *                     groups:
 *                       Sellable Stock: ["3G", "Updike", "Amazon-USA"]
 *                       Reserved: ["RSVD_USA"]
 *                       Inbound: ["Inbound-USA"]
 *                     metadata:
 *                       material: "Plastic"
 *                       boxPerCase: 12
 *       500:
 *         description: Error computing metric table data
 *         content:
 *           application/json:
 *             example:
 *               message: "Error computing metric table data"
 *               error: "Internal server error details"
 */
router.get('/quick-commerce/metrics', scQuickCommerce.getMetricTableData);

/**
 * @swagger
 * /supply-chain/quick-commerce/metric-card-data:
 *   get:
 *     tags:
 *       - Supply Chain
 *     summary: Compute quick commerce stock metrics
 *     description: >
 *       Fetches data from Azure Blob Storage, processes inventory-related metrics such as surplus, shortage, sellable stock, and various quantity totals.
 *       The response provides overall summaries including SKU count, location count, and aggregate quantities.
 *     parameters:
 *       - in: query
 *         name: sku
 *         schema:
 *           type: string
 *           example: "PLP8SQ10,PP10PPL,BCBXXL"
 *         required: false
 *         description: Comma-separated list of SKUs to filter by before aggregating metrics.
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *           example: "Amazon-USA,Flipkart,Shipcube-East"
 *         required: false
 *         description: Comma-separated list of Locations to include before aggregating metrics.
 *     responses:
 *       200:
 *         description: Quick commerce metrics computed successfully
 *         content:
 *           application/json:
 *             examples:
 *               success:
 *                 summary: All metrics summary
 *                 value:
 *                   sku: "ALL"
 *                   location: "ALL"
 *                   stockStatus: "ALL"
 *                   metrics:
 *                     totalSkuCount: 150
 *                     totalLocationCount: 10
 *                     surplusQty: 300
 *                     shortageQty: 20
 *                     totalSellable: 5000
 *                     totalInvoiceQty: 4500
 *                     totalIntransitQty: 600
 *                     totalWarehouseQty: 700
 *                     totalDeliveredQty: 4300
 *                   metadata:
 *                     asOf: "2025-10-06T00:00:00Z"
 *       500:
 *         description: Error in computing quick commerce metrics
 *         content:
 *           application/json:
 *             example:
 *               message: "Error computing quick commerce metrics"
 *               error: "Detailed error message"
 */
router.get('/quick-commerce/metric-card-data', scQuickCommerce.getQuickCommerceMetrics);

/**
 * @swagger
 * /supply-chain/quick-commerce/data:
 *   get:
 *     tags:
 *       - Supply Chain
 *     summary: Get full Quick Commerce dataset (parsed)
 *     description: Returns the entire parsed contents of the Quick Commerce CSV as an array of rows.
 *     responses:
 *       200:
 *         description: Parsed rows fetched successfully
 *         content:
 *           application/json:
 *             examples:
 *               sample:
 *                 summary: Example parsed rows
 *                 value:
 *                   - {
 *                       "SKU": "PLP8SQ10",
 *                       "Box/Case": "20.0",
 *                       "Location": "Unnamed: 9",
 *                       "Warehouse Qty": "0.0",
 *                       "Delivered": "0.0"
 *                     }
 *                   - {
 *                       "SKU": "PLP8SQ11",
 *                       "Box/Case": "12.0",
 *                       "Location": "Amazon-USA",
 *                       "Warehouse Qty": "15.0",
 *                       "Delivered": "3.0"
 *                     }
 *       500:
 *         description: Error fetching parsed dataset
 */
router.get('/quick-commerce/data', scQuickCommerce.getQuickCommMetricTableData);

/**
 * @swagger
 * /supply-chain/overview/data:
 *   get:
 *     tags:
 *       - Supply Chain
 *     summary: Get full Supply Chain Overview dataset (parsed)
 *     description: Returns the entire parsed contents of the Supply Chain Overview CSV as an array of rows.
 *     responses:
 *       200:
 *         description: Parsed rows fetched successfully
 *         content:
 *           application/json:
 *             examples:
 *               sample:
 *                 summary: Example parsed rows
 *                 value:
 *                   - {
 *                       "SKU": "PLP8SQ10",
 *                       "Box/Case": "20.0",
 *                       "Location": "Unnamed: 9",
 *                       "Warehouse Qty": "0.0",
 *                       "Delivered": "0.0"
 *                     }
 *                   - {
 *                       "SKU": "PLP8SQ11",
 *                       "Box/Case": "12.0",
 *                       "Location": "Amazon-USA",
 *                       "Warehouse Qty": "15.0",
 *                       "Delivered": "3.0"
 *                     }
 *       500:
 *         description: Error fetching parsed dataset
 */
router.get('/overview/data', scQuickCommerce.getSCOverviewMetricTableData);

/**
 * @swagger
 * /supply-chain/download/sc-overview-csv:
 *   get:
 *     tags:
 *       - Supply Chain
 *     summary: Download Supply Chain Overview CSV
 *     description: >
 *       Downloads the complete Supply Chain Overview CSV file from Azure Blob Storage.
 *       This file contains inventory and supply chain data across all channels and locations.
 *       The file will be downloaded with the original filename "Ecosoul-inventory_Supply_chain.csv".
 *     responses:
 *       200:
 *         description: CSV file downloaded successfully
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *             example: |
 *               SKU,Channel,Material,Box / Case,3G,Updike,Shipcube-East,Shipcube-West,Amazon-USA,Amazon-Canada
 *               PLP8SQ10,Amazon-USA,Plastic,20.0,0.0,0.0,0.0,0.0,15.0,0.0
 *               PLP8SQ11,Flipkart,Glass,12.0,5.0,0.0,0.0,0.0,0.0,0.0
 *         headers:
 *           Content-Disposition:
 *             description: Attachment header with filename
 *             schema:
 *               type: string
 *               example: "attachment; filename=\"Ecosoul-inventory_Supply_chain.csv\""
 *           Content-Type:
 *             description: MIME type for CSV file
 *             schema:
 *               type: string
 *               example: "text/csv"
 *       404:
 *         description: File not found in Azure Blob Storage
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "File not found"
 *       500:
 *         description: Internal server error during file download
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Internal server error"
 */
router.get('/download/sc-overview-csv', scQuickCommerce.downloadSCOverviewCSV);

/**
 * @swagger
 * /supply-chain/download/sc-quick-commerce-csv:
 *   get:
 *     tags:
 *       - Supply Chain
 *     summary: Download Quick Commerce CSV
 *     description: >
 *       Downloads the complete Quick Commerce CSV file from Azure Blob Storage.
 *       This file contains quick commerce invoice and sales data with detailed metrics
 *       including warehouse quantities, delivered amounts, in-transit items, and invoiced quantities.
 *       The file will be downloaded with the original filename "Ecosoul-quickcomm_invoice_SD.csv".
 *     responses:
 *       200:
 *         description: CSV file downloaded successfully
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *             example: |
 *               SKU,Box/Case,Location,Warehouse Qty,Delivered,In-Transit,Invoiced_Qty,Sellable(In Hand),MTQ,Active PO Qty
 *               PLP8SQ10,20.0,Amazon-USA,15.0,3.0,2.0,18.0,12.0,5.0,10.0
 *               PLP8SQ11,12.0,Flipkart,8.0,1.0,0.0,9.0,7.0,2.0,5.0
 *         headers:
 *           Content-Disposition:
 *             description: Attachment header with filename
 *             schema:
 *               type: string
 *               example: "attachment; filename=\"Ecosoul-quickcomm_invoice_SD.csv\""
 *           Content-Type:
 *             description: MIME type for CSV file
 *             schema:
 *               type: string
 *               example: "text/csv"
 *       404:
 *         description: File not found in Azure Blob Storage
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "File not found"
 *       500:
 *         description: Internal server error during file download
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Internal server error"
 */
router.get('/download/sc-quick-commerce-csv', scQuickCommerce.downloadSCQuickCommerceCSV);

export default router;