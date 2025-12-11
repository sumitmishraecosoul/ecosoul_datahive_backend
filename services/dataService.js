import { loadData } from '../Utils/csvParser.js';
import azureClient from '../Utils/azureBlobConnection.js';

// Generic helpers
function parseCsvParamToArray(value) {
    if (!value) return undefined;
    if (Array.isArray(value)) return value;
    return String(value)
        .split(',')
        .map(v => v.trim())
        .filter(v => v.length > 0);
}

function applyFilters(data, filters) {
    const { sku, category, material, platform, region, asin } = filters || {};
    const skuArr = parseCsvParamToArray(sku);
    const categoryArr = parseCsvParamToArray(category);
    const materialArr = parseCsvParamToArray(material);
    const platformArr = parseCsvParamToArray(platform);
    const regionArr = parseCsvParamToArray(region);
    const asinArr = parseCsvParamToArray(asin);

    return data.filter(row => {
        if (skuArr && !skuArr.includes(row.sku)) return false;
        if (categoryArr && !categoryArr.includes(row.category)) return false;
        if (materialArr && !materialArr.includes(row.material)) return false;
        if (platformArr && !platformArr.includes(row.platform)) return false;
        if (regionArr && !regionArr.includes(row.region)) return false;
        if (asinArr && !asinArr.includes(row.asin)) return false;
        return true;
    });
}

function applyDateWindow(data, { start_date, end_date }) {
    if (!start_date && !end_date) return data;
    const startTs = start_date ? new Date(start_date).getTime() : undefined;
    const endTs = end_date ? new Date(end_date).getTime() : undefined;
    return data.filter(r => {
        const ts = new Date(r.date).getTime();
        if (Number.isFinite(startTs) && ts < startTs) return false;
        if (Number.isFinite(endTs) && ts > endTs) return false;
        return true;
    });
}

function paginate(data, { page = 1, page_size = 20 } = {}) {
    const p = Math.max(1, parseInt(page, 10) || 1);
    const ps = Math.max(1, Math.min(1000, parseInt(page_size, 10) || 20));
    const start = (p - 1) * ps;
    const end = start + ps;
    return {
        page: p,
        page_size: ps,
        total: data.length,
        total_pages: Math.ceil(data.length / ps),
        items: data.slice(start, end)
    };
}

function sort(data, { sort_by, sort_dir = 'asc' } = {}) {
    if (!sort_by) return data;
    const dir = String(sort_dir).toLowerCase() === 'desc' ? -1 : 1;
    return [...data].sort((a, b) => {
        const av = a[sort_by];
        const bv = b[sort_by];
        if (av === bv) return 0;
        return av > bv ? dir : -dir;
    });
}

// Demand helpers
function parseMonthYearToDate(value) {
    // Expects formats like "Jan-2025" or "2025-01"; fallback to Date parse
    if (!value) return undefined;
    const mmYy = String(value).trim();
    const known = Date.parse(mmYy);
    if (!Number.isNaN(known)) return new Date(known);
    return undefined;
}

function applyDemandFilters(data, filters) {
    const { sku, country, month_year } = filters || {};
    const skuArr = parseCsvParamToArray(sku);
    const countryArr = parseCsvParamToArray(country);
    const monthYearArr = parseCsvParamToArray(month_year);

    return data.filter(row => {
        const rowSku = row.SKU || row.sku;
        const rowCountry = row.Country || row.country;
        const rowMonthYear = row['Month-Year'] || row.month_year;
        if (skuArr && !skuArr.includes(rowSku)) return false;
        if (countryArr && !countryArr.includes(rowCountry)) return false;
        if (monthYearArr && !monthYearArr.includes(rowMonthYear)) return false;
        return true;
    });
}

// Demand: data getters (operate on loadData().demand if present, otherwise empty)
function getDemandDataset() {
    const data = loadData();
    return Array.isArray(data?.demand) ? data.demand : [];
}

function getDemandForecastSummary(query = {}) {
    const rows = applyDemandFilters(getDemandDataset(), query);
    const totals = rows.reduce((acc, r) => {
        const demand = Number(r.Demand) || 0;
        const expected30 = Number(r.Expected_30_Days_Sales || r['Expected_30_Days_Sales']) || 0;
        const instock = Number(r.Current_InStock_Rate || r['Current_InStock_Rate']) || 0;
        acc.totalDemand += demand;
        acc.totalExpected30Days += expected30;
        acc.instockSum += instock;
        acc.count += 1;
        return acc;
    }, { totalDemand: 0, totalExpected30Days: 0, instockSum: 0, count: 0 });
    const avgInStockRate = totals.count ? Number((totals.instockSum / totals.count).toFixed(2)) : 0;
    return {
        total_demand: totals.totalDemand,
        total_expected_30_days_sales: totals.totalExpected30Days,
        average_instock_rate: avgInStockRate
    };
}

function getDemandForecastTimeseries(query = {}) {
    const rows = applyDemandFilters(getDemandDataset(), query);
    const mapped = rows.map(r => ({
        month_year: r['Month-Year'] || r.month_year,
        sku: r.SKU || r.sku,
        country: r.Country || r.country,
        demand: Number(r.Demand) || 0,
        sale_quantity: Number(r.Sale_Quantity || r['Sale_Quantity']) || 0,
        ads: Number(r.ADS) || 0
    }));
    return mapped.sort((a, b) => {
        const ad = parseMonthYearToDate(a.month_year)?.getTime() || 0;
        const bd = parseMonthYearToDate(b.month_year)?.getTime() || 0;
        return ad - bd;
    });
}

function getDemandRevenueDistribution(query = {}) {
    const rows = applyDemandFilters(getDemandDataset(), query);
    // Use Sale_Quantity as proxy for revenue distribution if price unknown
    const byCountry = rows.reduce((acc, r) => {
        const key = r.Country || r.country || 'Unknown';
        const value = Number(r.Sale_Quantity || r['Sale_Quantity'] || r.Demand || 0);
        acc[key] = (acc[key] || 0) + value;
        return acc;
    }, {});
    return Object.entries(byCountry).map(([country, value]) => ({ country, value }));
}

function getDemandProjections(query = {}) {
    const rows = applyDemandFilters(getDemandDataset(), query);
    return rows.map(r => ({
        sku: r.SKU || r.sku,
        country: r.Country || r.country,
        month_year: r['Month-Year'] || r.month_year,
        expected_30_days_sales: Number(r.Expected_30_Days_Sales || r['Expected_30_Days_Sales']) || 0,
        expected_30_days_sales_roundup: Number(r.Exp_RoundUP_30_Days_Sales || r['Exp_RoundUP_30_Days_Sales']) || 0,
        demand_fulfillable: Number(r.Demand_fulfillable || r['Demand_fulfillable']) || 0,
        current_instock_rate: Number(r.Current_InStock_Rate || r['Current_InStock_Rate']) || 0
    }));
}

// Inventory
async function getInventoryMetrics() {
    // Prefer live data from Azure blob if available
    try {
        const rows = await azureClient.fecthDatafromBlog();
        const availableInventory = rows.reduce((sum, r) => sum + (Number(r['afn-fulfillable-quantity']) || 0), 0);
        const totalStockValue = rows.reduce((sum, r) => sum + (Number(r['FC_Transfer']) || 0), 0);
        const lowStockItems = rows.reduce((sum, r) => sum + (Number(r['FC_Processing']) || 0), 0);
        const reorderPoints = rows.reduce((sum, r) => sum + (Number(r['Customer_reserved']) || 0), 0);
        return {
            availableInventory,
            totalStockValue,
            lowStockItems,
            reorderPoints
        };
    } catch (err) {
        // Fallback to in-memory stub if Azure unavailable
        const data = loadData();
        const ts = data.inventory.timeseries || [];
        const availableInventory = ts.reduce((sum, r) => sum + (Number(r['afn-fulfillable-quantity']) || 0), 0);
        const totalStockValue = ts.reduce((sum, r) => sum + (Number(r['FC_Transfer']) || 0), 0);
        const lowStockItems = ts.reduce((sum, r) => sum + (Number(r['FC_Processing']) || 0), 0);
        const reorderPoints = ts.reduce((sum, r) => sum + (Number(r['Customer_reserved']) || 0), 0);
        return {
            availableInventory,
            totalStockValue,
            lowStockItems,
            reorderPoints,
            source: 'fallback'
        };
    }
}

function getInventoryTimeseries(query = {}) {
    const data = loadData();
    let ts = data.inventory.timeseries;
    ts = applyFilters(ts, query);
    ts = applyDateWindow(ts, query);
    ts = sort(ts, query);
    return ts;
}

async function getInventoryOptimizationBars(query = {}) {
    // Repurpose this endpoint to return "Inventory Stock By Material"
    // It fetches the latest CSV from Azure Blob and groups the
    // afn-fulfillable-quantity by a fixed set of materials.
    const targetMaterials = ['bamboo', 'birchwood', 'baggase', 'pla', 'palmLeaf', 'paper'];

    // Initialize result object with all materials present as keys
    const result = targetMaterials.reduce((acc, key) => {
        acc[key] = 0;
        return acc;
    }, {});

    try {
        const rows = await azureClient.fecthDatafromBlog();

        for (const row of rows) {
            const qty = Number(row['afn-fulfillable-quantity']) || 0;
            const rawMaterial = (row.material || row.Material || '').toString().trim().toLowerCase();

            // Normalize common material spellings
            let materialKey = undefined;
            if (rawMaterial === 'bamboo') materialKey = 'bamboo';
            else if (rawMaterial === 'birchwood' || rawMaterial === 'birch wood' || rawMaterial === 'birch-wood') materialKey = 'birchwood';
            else if (rawMaterial === 'baggase' || rawMaterial === 'bagasse') materialKey = 'baggase';
            else if (rawMaterial === 'pla') materialKey = 'pla';
            else if (rawMaterial === 'palmleaf' || rawMaterial === 'palm leaf' || rawMaterial === 'palm-leaf') materialKey = 'palmLeaf';
            else if (rawMaterial === 'paper') materialKey = 'paper';

            if (materialKey && Object.prototype.hasOwnProperty.call(result, materialKey)) {
                result[materialKey] += qty;
            }
        }

        return result;
    } catch (err) {
        // Fallback to local data if Azure is unavailable
        const data = loadData();
        const items = Array.isArray(data?.inventory?.items) ? data.inventory.items : [];

        for (const row of items) {
            const qty = Number(row['afn-fulfillable-quantity'] || row.afn_fulfillable_quantity) || 0;
            const rawMaterial = (row.material || row.Material || '').toString().trim().toLowerCase();

            let materialKey = undefined;
            if (rawMaterial === 'bamboo') materialKey = 'bamboo';
            else if (rawMaterial === 'birchwood' || rawMaterial === 'birch wood' || rawMaterial === 'birch-wood') materialKey = 'birchwood';
            else if (rawMaterial === 'baggase' || rawMaterial === 'bagasse') materialKey = 'baggase';
            else if (rawMaterial === 'pla') materialKey = 'pla';
            else if (rawMaterial === 'palmleaf' || rawMaterial === 'palm leaf' || rawMaterial === 'palm-leaf') materialKey = 'palmLeaf';
            else if (rawMaterial === 'paper') materialKey = 'paper';

            if (materialKey && Object.prototype.hasOwnProperty.call(result, materialKey)) {
                result[materialKey] += qty;
            }
        }

        return { ...result, source: 'fallback' };
    }
}

function getInventoryItems(query = {}) {
    const data = loadData();
    let items = data.inventory.items;
    items = applyFilters(items, query);
    items = sort(items, query);
    const page = paginate(items, query);
    return page;
}

export {
    // generic helpers
    applyFilters,
    applyDateWindow,
    paginate,
    sort,
    parseCsvParamToArray,
    // inventory
    getInventoryMetrics,
    getInventoryTimeseries,
    getInventoryOptimizationBars,
    getInventoryItems,
    // demand
    getDemandForecastSummary,
    getDemandForecastTimeseries,
    getDemandRevenueDistribution,
    getDemandProjections
};


