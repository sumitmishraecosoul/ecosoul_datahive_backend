import express from 'express';
import inventoryController from '../Controllers/inventoryController.js';
const router = express.Router();

/**
 * @swagger
 * /inventory/metrics:
 *   get:
 *     tags:
 *       - Inventory
 *     summary: Get inventory KPIs
 *     description: Returns total sums across the entire dataset for key metrics.
 *     responses:
 *       200:
 *         description: Metrics fetched successfully
 *       500:
 *         description: Internal server error
 */
router.get('/metrics', inventoryController.getMetrics);

/**
 * @swagger
 * /inventory/timeseries:
 *   get:
 *     tags:
 *       - Inventory
 *     summary: Get inventory timeseries
 *     description: Returns inventory metrics over time respecting filters and date window.
 *     parameters:
 *       - in: query
 *         name: sku
 *         schema: { type: string }
 *       - in: query
 *         name: start_date
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: end_date
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: sort_by
 *         schema: { type: string }
 *       - in: query
 *         name: sort_dir
 *         schema: { type: string, enum: [asc, desc] }
 *     responses:
 *       200:
 *         description: Timeseries fetched successfully
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Internal server error
 */
router.get('/timeseries', inventoryController.getTimeseries);

/**
 * @swagger
 * /inventory/optimization-bars:
 *   get:
 *     tags:
 *       - Inventory
 *     summary: Get inventory optimization bar data
 *     description: Returns overstock/understock counts per SKU.
 *     parameters:
 *       - in: query
 *         name: sku
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Optimization bars fetched successfully
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Internal server error
 */
router.get('/optimization-bars', inventoryController.getOptimizationBars);

/**
 * @swagger
 * /inventory/items:
 *   get:
 *     tags:
 *       - Inventory
 *     summary: List inventory items with pagination
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: page_size
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: sort_by
 *         schema: { type: string }
 *       - in: query
 *         name: sort_dir
 *         schema: { type: string, enum: [asc, desc] }
 *     responses:
 *       200:
 *         description: Items fetched successfully
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Internal server error
 */
router.get('/items', inventoryController.getItems);

export default router;


