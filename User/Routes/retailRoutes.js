//This route only has routes for Kehe

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

/**
 * @swagger
 * /retail/kehe-cs/filters:
 *   get:
 *     tags:
 *       - Retail
 *     summary: Get Kehe CS filters
 *     responses:
 *       200:
 *         description: Filters fetched successfully
 *       500:
 *         description: Internal server error
 */
router.get('/kehe-cs/filters', retailController.getKeheCSFilters);

/**
 * @swagger
 * /retail/kehe-cs/metric-card-data:
 *   get:
 *     tags:
 *       - Retail
 *     summary: Get Kehe CS metric card data
 *     responses:
 *       200:
 *         description: Metric card data fetched successfully
 *       500:
 *         description: Internal server error
 */
router.get('/kehe-cs/metric-card-data', retailController.getKeheCSMetricCardData);

/**
 * @swagger
 * /retail/kehe-cs/retailer-vendor-by-shipped:
 *   get:
 *     tags:
 *       - Retail
 *     summary: Get Kehe CS retailer vendor by shipped
 *     responses:
 *       200:
 *         description: Retailer vendor by shipped fetched successfully
 *       500:
 *         description: Internal server error
 */
router.get('/kehe-cs/retailer-vendor-by-shipped', retailController.getKeheCSRetailerVendorByShipped);

/**
 * @swagger
 * /retail/kehe-cs/quantity-ordered:
 *   get:
 *     tags:
 *       - Retail
 *     summary: Get Kehe CS quantity ordered
 *     responses:
 *       200:
 *         description: Quantity ordered fetched successfully
 *       500:
 *         description: Internal server error
 */
router.get('/kehe-cs/quantity-ordered', retailController.getKeheCSQuantityOrdered);

/**
 * @swagger
 * /retail/kehe-cs/metric-table-data:
 *   get:
 *     tags:
 *       - Retail
 *     summary: Get Kehe CS metric table data
 *     responses:
 *       200:
 *         description: Metric table data fetched successfully
 *       500:
 *         description: Internal server error
 */
router.get('/kehe-cs/metric-table-data', retailController.getKeheCSMetricTableData);

export default router;