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

export default router;

