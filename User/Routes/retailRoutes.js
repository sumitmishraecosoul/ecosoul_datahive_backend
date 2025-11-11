import express from 'express';
import retailController from '../Controllers/retailController.js';
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Retail
 *   description: Retail endpoints
 */

/**
 * @swagger
 * /retail/kehe-ksolve/invoice-deduction:
 *   get:
 *     tags:
 *       - Retail
 *     summary: Get Kehe KSolve invoice deduction
 *     parameters:
 *       - in: query
 *         name: Invoice_No
 *         schema: { type: string }
 *         description: Filter by invoice number
 *       - in: query
 *         name: Category_Type
 *         schema: { type: string }
 *         description: Filter by category type
 *       - in: query
 *         name: Type
 *         schema: { type: string }
 *         description: Filter by type
 *       - in: query
 *         name: Status
 *         schema: { type: string }
 *         description: Filter by status
 *       - in: query
 *         name: PO_No
 *         schema: { type: string }
 *         description: Filter by PO number
 *       - in: query
 *         name: DC_Name
 *         schema: { type: string }
 *         description: Filter by DC name
 *       - in: query
 *         name: Date
 *         schema: { type: string }
 *         description: Filter by date
 *     responses:
 *       200:
 *         description: Invoice deduction fetched successfully
 *       500:
 *         description: Internal server error
 */
router.get('/kehe-ksolve/invoice-deduction', retailController.getKeheKSolveInvoiceDeduction);

/**
 * @swagger
 * /retail/kehe-ksolve/net-payable-deduction:
 *   get:
 *     tags:
 *       - Retail
 *     summary: Get Kehe KSolve net payable deduction
 *     parameters:
 *       - in: query
 *         name: Invoice_No
 *         schema: { type: string }
 *         description: Filter by invoice number
 *       - in: query
 *         name: Category_Type
 *         schema: { type: string }
 *         description: Filter by category type
 *       - in: query
 *         name: Type
 *         schema: { type: string }
 *         description: Filter by type
 *       - in: query
 *         name: Status
 *         schema: { type: string }
 *         description: Filter by status
 *       - in: query
 *         name: PO_No
 *         schema: { type: string }
 *         description: Filter by PO number
 *       - in: query
 *         name: DC_Name
 *         schema: { type: string }
 *         description: Filter by DC name
 *       - in: query
 *         name: Date
 *         schema: { type: string }
 *         description: Filter by date
 *     responses:
 *       200:
 *         description: Net payable deduction fetched successfully
 *       500:
 *         description: Internal server error
 */
router.get('/kehe-ksolve/net-payable-deduction', retailController.getKeheKSolveNetPayableDeduction);

/**
 * @swagger
 * /retail/kehe-ksolve/invoice-amount:
 *   get:
 *     tags:
 *       - Retail
 *     summary: Get Kehe KSolve invoice amount
 *     parameters:
 *       - in: query
 *         name: Invoice_No
 *         schema: { type: string }
 *         description: Filter by invoice number
 *       - in: query
 *         name: Category_Type
 *         schema: { type: string }
 *         description: Filter by category type
 *       - in: query
 *         name: Type
 *         schema: { type: string }
 *         description: Filter by type
 *       - in: query
 *         name: Status
 *         schema: { type: string }
 *         description: Filter by status
 *       - in: query
 *         name: PO_No
 *         schema: { type: string }
 *         description: Filter by PO number
 *       - in: query
 *         name: DC_Name
 *         schema: { type: string }
 *         description: Filter by DC name
 *       - in: query
 *         name: Date
 *         schema: { type: string }
 *         description: Filter by date
 *     responses:
 *       200:
 *         description: Invoice amount fetched successfully
 *       500:
 *         description: Internal server error
 */
router.get('/kehe-ksolve/invoice-amount', retailController.getKeheKSolveInvoiceAmount);

/**
 * @swagger
 * /retail/kehe-ksolve/metric-table-data:
 *   get:
 *     tags:
 *       - Retail
 *     summary: Get Kehe KSolve metric table data
 *     parameters:
 *       - in: query
 *         name: Invoice_No
 *         schema: { type: string }
 *         description: Filter by invoice number
 *       - in: query
 *         name: Category_Type
 *         schema: { type: string }
 *         description: Filter by category type
 *       - in: query
 *         name: Type
 *         schema: { type: string }
 *         description: Filter by type
 *       - in: query
 *         name: Status
 *         schema: { type: string }
 *         description: Filter by status
 *       - in: query
 *         name: PO_No
 *         schema: { type: string }
 *         description: Filter by PO number
 *       - in: query
 *         name: DC_Name
 *         schema: { type: string }
 *         description: Filter by DC name
 *       - in: query
 *         name: Date
 *         schema: { type: string }
 *         description: Filter by date
 *     responses:
 *       200:
 *         description: Metric table data fetched successfully
 *       500:
 *         description: Internal server error
 */
router.get('/kehe-ksolve/metric-table-data', retailController.getKeheKSolveMetricTableData);

/**
 * @swagger
 * /retail/kehe-ksolve/filters:
 *   get:
 *     tags:
 *       - Retail
 *     summary: Get Kehe KSolve filters
 *     responses:
 *       200:
 *         description: Filters fetched successfully
 *       500:
 *         description: Internal server error
 */
router.get('/kehe-ksolve/filters', retailController.getKeheKSolveFilters);

export default router;