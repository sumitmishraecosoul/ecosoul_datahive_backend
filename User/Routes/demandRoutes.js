import express from 'express';
import demandController from '../Controllers/demandController.js';
const router = express.Router();

/**
 * @swagger
 * /demand/forecast/summary:
 *   get:
 *     tags:
 *       - Demand
 *     summary: Get demand forecast summary
 *     parameters:
 *       - in: query
 *         name: sku
 *         schema: { type: string }
 *       - in: query
 *         name: country
 *         schema: { type: string }
 *       - in: query
 *         name: month_year
 *         schema: { type: string }
 *     responses:
 *       200: { description: Summary fetched successfully }
 *       500: { description: Internal server error }
 */
router.get('/forecast/summary', demandController.getForecastSummary);

/**
 * @swagger
 * /demand/forecast/timeseries:
 *   get:
 *     tags:
 *       - Demand
 *     summary: Get demand forecast timeseries
 *     parameters:
 *       - in: query
 *         name: sku
 *         schema: { type: string }
 *       - in: query
 *         name: country
 *         schema: { type: string }
 *       - in: query
 *         name: month_year
 *         schema: { type: string }
 *     responses:
 *       200: { description: Timeseries fetched successfully }
 *       500: { description: Internal server error }
 */
router.get('/forecast/timeseries', demandController.getForecastTimeseries);

/**
 * @swagger
 * /demand/revenue-distribution:
 *   get:
 *     tags:
 *       - Demand
 *     summary: Get demand revenue distribution by country
 *     parameters:
 *       - in: query
 *         name: sku
 *         schema: { type: string }
 *       - in: query
 *         name: country
 *         schema: { type: string }
 *       - in: query
 *         name: month_year
 *         schema: { type: string }
 *     responses:
 *       200: { description: Distribution fetched successfully }
 *       500: { description: Internal server error }
 */
router.get('/revenue-distribution', demandController.getRevenueDistribution);

/**
 * @swagger
 * /demand/projections:
 *   get:
 *     tags:
 *       - Demand
 *     summary: Get demand projections
 *     parameters:
 *       - in: query
 *         name: sku
 *         schema: { type: string }
 *       - in: query
 *         name: country
 *         schema: { type: string }
 *       - in: query
 *         name: month_year
 *         schema: { type: string }
 *     responses:
 *       200: { description: Projections fetched successfully }
 *       500: { description: Internal server error }
 */
router.get('/projections', demandController.getProjections);

export default router;



