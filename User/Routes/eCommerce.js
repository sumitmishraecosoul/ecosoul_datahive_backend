import express from 'express';
import ecommerceController from '../Controllers/ecommerceController.js';

const router = express.Router();

/**
 * @swagger
 * /ecommerce/overview/data:
 *   get:
 *     tags:
 *       - Ecommerce
 *     summary: Get full Ecommerce Overview dataset (parsed)
 *     description: Returns the entire parsed contents of the Ecommerce Inventory CSV as an array of rows.
 *     parameters:
 *       - in: query
 *         name: sku
 *         schema:
 *           type: string
 *           example: "PLPB7&10SQ50,PP10PPL"
 *         required: false
 *         description: Comma-separated SKUs to include.
 *       - in: query
 *         name: material
 *         schema:
 *           type: string
 *           example: "Palm Leaf,Bagasse"
 *         required: false
 *         description: Comma-separated materials to include.
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *           example: "US,CA,UK"
 *         required: false
 *         description: Comma-separated countries to include.
 *       - in: query
 *         name: monthYear
 *         schema:
 *           type: string
 *           example: "2025-09"
 *         required: false
 *         description: Month filter in YYYY-MM; defaults to previous month when omitted.
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
router.get('/overview/data', ecommerceController.getEcommerceOverviewMetricTableData);

/**
 * @swagger
 * /ecommerce/inventory/data:
 *   get:
 *     tags:
 *       - Ecommerce
 *     summary: Get full Ecommerce Inventory dataset (parsed)
 *     description: Returns the entire parsed contents of the Ecommerce Inventory CSV as an array of rows.
 *     parameters:
 *       - in: query
 *         name: sku
 *         schema:
 *           type: string
 *           example: "PLPB7&10SQ50,PP10PPL"
 *         required: false
 *         description: Comma-separated SKUs to include.
 *       - in: query
 *         name: material
 *         schema:
 *           type: string
 *           example: "Palm Leaf,Bagasse"
 *         required: false
 *         description: Comma-separated materials to include.
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *           example: "US,CA,UK"
 *         required: false
 *         description: Comma-separated countries to include.
 *       - in: query
 *         name: monthYear
 *         schema:
 *           type: string
 *           example: "2025-09"
 *         required: false
 *         description: Month filter in YYYY-MM; defaults to previous month when omitted.
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
router.get('/inventory/data', ecommerceController.getEcommerceInventoryMetricTableData);


/**
 * @swagger
 * /ecommerce/overview/metric-card-data:
 *   get:
 *     tags:
 *       - Ecommerce
 *     summary: Get Ecommerce Overview metric card data
 *     description: Returns the metric card data for the Ecommerce Overview dataset.
 *     parameters:
 *       - in: query
 *         name: sku
 *         schema:
 *           type: string
 *           example: "PLPB7&10SQ50,PP10PPL"
 *         required: false
 *         description: Comma-separated SKUs to include.
 *       - in: query
 *         name: material
 *         schema:
 *           type: string
 *           example: "Palm Leaf,Bagasse"
 *         required: false
 *         description: Comma-separated materials to include.
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *           example: "US,CA,UK"
 *         required: false
 *         description: Comma-separated countries to include.
 *       - in: query
 *         name: monthYear
 *         schema:
 *           type: string
 *           example: "2025-09"
 *         required: false
 *         description: Month filter in YYYY-MM; defaults to previous month when omitted.
 *     responses:
 *       200:
 *         description: Metric card data fetched successfully
 *         content:
 *           application/json:
 *             examples:
 *               sample:
 *                 summary: Example metric card data
 *                 value:
 *                   - {
 *                     "SKU": "PLP8SQ10",
 *                     "Box/Case": "20.0",
 *                     "Location": "Unnamed: 9",
 *                     "Warehouse Qty": "0.0",
 *                     "Delivered": "0.0"
 *                     }
 *       500:
 *         description: Error fetching metric card data
 *         content:
 *           application/json:
 *             example:
 *               message: "Error fetching metric card data"
 *               error: "Error message"
 */
router.get('/overview/metric-card-data', ecommerceController.getEcommerceOverviewMetricCardData);

/**
 * @swagger
 * /ecommerce/overview/demand-instock-by-geography:
 *   get:
 *     tags:
 *       - Ecommerce
 *     summary: Get demand instock by geography data for the Ecommerce Overview dataset.
 *     description: Returns the demand instock by geography data for the Ecommerce Overview dataset.
 *     parameters:
 *       - in: query
 *         name: sku
 *         schema:
 *           type: string
 *           example: "PLPB7&10SQ50,PP10PPL"
 *         required: false
 *         description: Comma-separated SKUs to include.
 *       - in: query
 *         name: material
 *         schema:
 *           type: string
 *           example: "Palm Leaf,Bagasse"
 *         required: false
 *         description: Comma-separated materials to include.
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *           example: "US,CA,UK"
 *         required: false
 *         description: Comma-separated countries to include.
 *       - in: query
 *         name: monthYear
 *         schema:
 *           type: string
 *           example: "2025-09"
 *         required: false
 *         description: Month filter in YYYY-MM; defaults to previous month when omitted.
 *     responses:
 *       200:
 *         description: Demand instock by geography data fetched successfully
 *         content:
 *           application/json:
 *             examples:
 *               sample:
 *                 summary: Example demand instock by geography data
 *                 value:
 *                   - {
 *                     "Country": "USA",
 *                     "Instock_rate_base": "0.5"
 *                     }
 *       500:
 *         description: Error fetching demand instock by geography data
 *         content:
 *           application/json:
 *             example:
 *               message: "Error fetching demand instock by geography data"
 *               error: "Error message"
 */
router.get('/overview/demand-instock-by-geography', ecommerceController.getDemandInstockByGeographyData);

/**
 * @swagger
 * /ecommerce/overview/sku-count-by-geography:
 *   get:
 *     tags:
 *       - Ecommerce
 *     summary: Get SKU count by geography data for the Ecommerce Overview dataset.
 *     description: Returns the SKU count by geography data for the Ecommerce Overview dataset.
 *     parameters:
 *       - in: query
 *         name: sku
 *         schema:
 *           type: string
 *           example: "PLPB7&10SQ50,PP10PPL"
 *         required: false
 *         description: Comma-separated SKUs to include.
 *       - in: query
 *         name: material
 *         schema:
 *           type: string
 *           example: "Palm Leaf,Bagasse"
 *         required: false
 *         description: Comma-separated materials to include.
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *           example: "US,CA,UK"
 *         required: false
 *         description: Comma-separated countries to include.
 *       - in: query
 *         name: monthYear
 *         schema:
 *           type: string
 *           example: "2025-09"
 *         required: false
 *         description: Month filter in YYYY-MM; defaults to previous month when omitted.
 *     responses:
 *       200:
 *         description: SKU count by geography data fetched successfully
 *         content:
 *           application/json:
 *             examples:
 *               sample:
 *                 summary: Example SKU count by geography data
 *                 value:
 *                   - {
 *                     "Country": "USA",
 *                     "SKU Count": "10"
 *                     }
 *       500:
 *         description: Error fetching SKU count by geography data
 *         content:
 *           application/json:
 *             example:
 *               message: "Error fetching SKU count by geography data"
 *               error: "Error message"
 */
router.get('/overview/sku-count-by-geography', ecommerceController.getSKUCountByGeographyData);

/**
 * @swagger
 * /ecommerce/overview/alert-count-by-geography:
 *   get:
 *     tags:
 *       - Ecommerce
 *     summary: Get alert count by geography data for the Ecommerce Overview dataset.
 *     description: Returns the alert count by geography data for the Ecommerce Overview dataset.
 *     responses:
 *       200:
 *         description: Alert count by geography data fetched successfully
 *         content:
 *           application/json:
 *             examples:
 *               sample:
 *                 summary: Example alert count by geography data
 *                 value:
 *                   - {
 *                     "Country": "USA",
 *                     "Alert Count": "10"
 *                     }
 *       500:
 *         description: Error fetching alert count by geography data
 *         content:
 *           application/json:
 *             example:
 *               message: "Error fetching alert count by geography data"
 *               error: "Error message"
 */
router.get('/overview/alert-count-by-geography', ecommerceController.getAlertCountByGeographyData);

/**
 * @swagger
 * /ecommerce/overview/sku-type-by-geography:
 *   get:
 *     tags:
 *       - Ecommerce
 *     summary: Get SKU type by geography data for the Ecommerce Overview dataset.
 *     description: Returns the SKU type by geography data for the Ecommerce Overview dataset.
 *     responses:
 *       200:
 *         description: SKU type by geography data fetched successfully
 *         content:
 *           application/json:
 *             examples:
 *               sample:
 *                 summary: Example SKU type by geography data
 *                 value:
 *                   - {
 *                     "Country": "USA",
 *                     "SKU Type": "Plastic"
 *                     }
 *       500:
 *         description: Error fetching SKU type by geography data
 *         content:
 *           application/json:
 *             example:
 *               message: "Error fetching SKU type by geography data"
 *               error: "Error message"
 */
router.get('/overview/sku-type-by-geography', ecommerceController.getSKUTypebyGeographyData);

/**
 * @swagger
 * /ecommerce/overview/filters:
 *   get:
 *     tags:
 *       - Ecommerce
 *     summary: Get filters for the Ecommerce Overview dataset
 *     description: Returns distinct values for filterable columns from the Ecommerce Overview dataset.
 *     responses:
 *       200:
 *         description: Filters fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 SKU:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ['PLP8SQ10', 'PLP8SQ11']
 *                 Material:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ['Palm Leaf', 'Bagasse']
 *                 Country:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ['USA', 'CA']
 *                 Alert:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ['Out of Stock', 'In Stock']
 *                 SKU_Type:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ['Plastic', 'Glass']
 *                 Status:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ['In Stock', 'Out of Stock']
 *                 Month_Year:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ['2025-09', '2025-10']
 *       500:
 *         description: Error fetching filters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error fetching filters"
 *                 error:
 *                   type: string
 *                   example: "Error message"
 */
router.get('/overview/filters', ecommerceController.getEcommerceOverviewFilters);


/**
 * @swagger
 * /ecommerce/download/overview:
 *   get:
 *     tags:
 *       - Ecommerce
 *     summary: Download Ecommerce Overview CSV
 *     description: Downloads the Ecommerce Overview CSV file from Azure Blob Storage.
 *     responses:
 *       200:
 *         description: CSV file downloaded successfully
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *             example: |
 *               SKU,Country,Month-Year,Demand,afn-fulfillable-quantity,Sale_Quantity,Total incoming,Sale_Lost,AWD,AWD-Intransit
 *               PLP8SQ10,USA,2025-09,100,100,100,100,100,100,100
 *               PLP8SQ11,CA,2025-09,100,100,100,100,100,100,100
 *       500:
 *         description: Error downloading Ecommerce Overview CSV
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Error downloading Ecommerce Overview CSV"
 */
router.get('/download/overview', ecommerceController.downloadEcommerceOverviewCSV);


/**
 * @swagger
 * /ecommerce/download/inventory:
 *   get:
 *     tags:
 *       - Ecommerce
 *     summary: Download Ecommerce Inventory CSV
 *     description: Downloads the Ecommerce Inventory CSV file from Azure Blob Storage.
 *     responses:
 *       200:
 *         description: CSV file downloaded successfully
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *             example: |
 *               SKU,Country,Month-Year,Demand,afn-fulfillable-quantity,Sale_Quantity,Total incoming,Sale_Lost,AWD,AWD-Intransit
 *               PLP8SQ10,USA,2025-09,100,100,100,100,100,100,100
 *               PLP8SQ11,CA,2025-09,100,100,100,100,100,100,100
 *       500:
 *         description: Error downloading Ecommerce Inventory CSV
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Error downloading Ecommerce Inventory CSV"
 */
router.get('/download/inventory', ecommerceController.downloadEcommerceInventoryCSV);

export default router;

