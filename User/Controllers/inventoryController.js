import { getInventoryMetrics, getInventoryTimeseries, getInventoryOptimizationBars, getInventoryItems } from '../../services/dataService.js';

const inventoryController = {};

inventoryController.getMetrics = async (req, res) => {
    try {
        const result = await Promise.resolve(getInventoryMetrics());
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching inventory metrics', error: error.message });
    }
};

inventoryController.getTimeseries = async (req, res) => {
    try {
        const result = await Promise.resolve(getInventoryTimeseries(req.query));
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching inventory timeseries', error: error.message });
    }
};

inventoryController.getOptimizationBars = async (req, res) => {
    try {
        const result = await Promise.resolve(getInventoryOptimizationBars(req.query));
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching inventory optimization bars', error: error.message });
    }
};

inventoryController.getItems = async (req, res) => {
    try {
        const { page, page_size } = req.query;
        if ((page && isNaN(parseInt(page, 10))) || (page_size && isNaN(parseInt(page_size, 10)))) {
            return res.status(400).json({ error: 'bad_request', message: 'page and page_size must be numbers' });
        }
        const result = await Promise.resolve(getInventoryItems(req.query));
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching inventory items', error: error.message });
    }
};

export default inventoryController;


