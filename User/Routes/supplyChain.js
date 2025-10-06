import scQuickCommerce from '../Controllers/scQuickCommerce.js';
import express from 'express';

const router = express.Router();


/**
 * @swagger
 * /supply-chain/quick-commerce/metrics:
 *   get:
 *     tags:
 *       - Quick Commerce
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

export default router;