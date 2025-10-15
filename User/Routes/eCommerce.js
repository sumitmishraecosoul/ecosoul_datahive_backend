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

export default router;

