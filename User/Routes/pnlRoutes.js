import express from 'express';
import pnlController from '../Controllers/pnlController.js';

const router = express.Router();

/**
 * @swagger
 * /pnl/transaction/metric-data:
 *   get:
 *     tags:
 *       - PNL
 *     summary: Get PNL transaction metric data
 *     description: |
 *       Returns percentage metrics for a specific month as per the CSV headers.
 *       Each metric is computed as SUM(Numerator Header) / SUM(Total Sales) * 100 for the selected month.
 *
 *       Numerators:
 *       - cm1 => CM1
 *       - cm2 => CM2
 *       - cm3 => CM3
 *       - adSpend => total_ad_spend
 *       - storageFee => Storage Fee
 *       - sellingFee => selling fees
 *
 *       Denominator for all metrics: Total Sales.
 *
 *     parameters:
 *       - in: query
 *         name: monthYear
 *         schema:
 *           type: string
 *           example: "2025-10"
 *         description: |
 *           Optional month filter in format YYYY-MM. If omitted, no month filter is applied.
 *       - in: query
 *         name: channel
 *         schema:
 *           type: string
 *           example: "Amazon USA"
 *         description: |
 *           Optional channel filter (e.g., Amazon USA, Amazon Canada). If omitted, no channel filter is applied.
 *     responses:
 *       200:
 *         description: PNL transaction metric data fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cm1:
 *                   type: number
 *                   description: CM1 as % of Total Sales
 *                   example: 45.12
 *                 cm2:
 *                   type: number
 *                   description: CM2 as % of Total Sales
 *                   example: 56.03
 *                 cm3:
 *                   type: number
 *                   description: CM3 as % of Total Sales
 *                   example: 78.5
 *                 adSpend:
 *                   type: number
 *                   description: Total Ad Spend as % of Total Sales
 *                   example: 12.34
 *                 storageFee:
 *                   type: number
 *                   description: Storage Fee as % of Total Sales
 *                   example: 3.21
 *                 sellingFee:
 *                   type: number
 *                   description: Selling Fee as % of Total Sales
 *                   example: 8.9
 *       500: { description: Internal server error }
 */
router.get('/transaction/metric-data', pnlController.getPnlTransactionMetricData);

/**
 * @swagger
 * /pnl/transaction/metric-table-data:
 *   get:
 *     tags:
 *       - PNL
 *     summary: Get PNL transaction metric table sums
 *     description: |
 *       Returns sums of selected columns from the Business PNL CSV for the given month and channel.
 *
 *       Columns summed:
 *       - CM1
 *       - CM2
 *       - Final_CM3
 *       - selling fees
 *       - Storage Fee
 *       - total_ad_spend
 *       - Total Sales
 *
 *     parameters:
 *       - in: query
 *         name: monthYear
 *         schema:
 *           type: string
 *           example: "2025-10"
 *         description: Optional month filter in format YYYY-MM. If omitted, no month filter is applied.
 *       - in: query
 *         name: channel
 *         schema:
 *           type: string
 *           example: "Amazon-USA"
 *         description: Optional channel filter. If omitted, no channel filter is applied.
 *     responses:
 *       200:
 *         description: Metric table sums computed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 CM1: { type: number, example: 12345.67 }
 *                 CM2: { type: number, example: 23456.78 }
 *                 Final_CM3: { type: number, example: 34567.89 }
 *                 selling fees: { type: number, example: 4567.89 }
 *                 Storage Fee: { type: number, example: 789.01 }
 *                 total_ad_spend: { type: number, example: 2345.67 }
 *                 Total Sales: { type: number, example: 56789.01 }
 *       500: { description: Internal server error }
 */
router.get('/transaction/metric-table-data', pnlController.getPnlTransactionMetricTableData);

/**
 * @swagger
 * /pnl/business/metric-data:
 *   get:
 *     tags:
 *       - PNL
 *     summary: Get PNL business metric data
 *     description: Returns percentage metrics for a specific month as per the CSV headers.
 *     parameters:
 *       - in: query
 *         name: monthYear
 *         schema:
 *           type: string
 *           example: "2025-10"
 *         description: Optional month filter in format YYYY-MM. If omitted, no month filter is applied.
 *       - in: query
 *         name: channel
 *         schema:
 *           type: string
 *           example: "Amazon-USA"
 *         description: Optional channel filter. If omitted, no channel filter is applied.
 *     responses:
 *       200:
 *         description: Metric data fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cm1: { type: number, example: 45.12 }
 *                 cm2: { type: number, example: 56.03 }
 *                 cm3: { type: number, example: 78.5 }
 *                 adSpend: { type: number, example: 12.34 }
 *                 storageFee: { type: number, example: 3.21 }
 *                 sellingFee: { type: number, example: 8.9 }
 *       500: { description: Internal server error }
 */
router.get('/business/metric-data', pnlController.getPnlBusinessMetricData);

/**
 * @swagger
 * /pnl/business/metric-table-data:
 *   get:
 *     tags:
 *       - PNL
 *     summary: Get PNL business metric table sums
 *     description: Returns sums of selected columns from the Business PNL CSV for the given month and channel.
 *     parameters:
 *       - in: query
 *         name: monthYear
 *         schema:
 *           type: string
 *           example: "2025-10"
 *         description: Optional month filter in format YYYY-MM. If omitted, no month filter is applied.
 *       - in: query
 *         name: channel
 *         schema:
 *           type: string
 *           example: "Amazon-USA"
 *         description: Optional channel filter. If omitted, no channel filter is applied.
 *     responses:
 *       200:
 *         description: Metric table sums computed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 CM1: { type: number, example: 12345.67 }
 *                 CM2: { type: number, example: 23456.78 }
 *                 Final_CM3: { type: number, example: 34567.89 }
 *                 selling fees: { type: number, example: 4567.89 }
 *                 Storage Fee: { type: number, example: 789.01 }
 *                 total_ad_spend: { type: number, example: 2345.67 }
 *                 Total Sales: { type: number, example: 56789.01 }
 *       500: { description: Internal server error }
 */
router.get('/business/metric-table-data', pnlController.getPnlBusinessMetricTableData);

export default router;