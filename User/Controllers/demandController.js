import { getDemandForecastSummary, getDemandForecastTimeseries, getDemandRevenueDistribution, getDemandProjections } from '../../services/dataService.js';

const demandController = {};

demandController.getForecastSummary = async (req, res) => {
    try {
        const result = await Promise.resolve(getDemandForecastSummary(req.query));
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching demand forecast summary', error: error.message });
    }
};

demandController.getForecastTimeseries = async (req, res) => {
    try {
        const result = await Promise.resolve(getDemandForecastTimeseries(req.query));
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching demand forecast timeseries', error: error.message });
    }
};

demandController.getRevenueDistribution = async (req, res) => {
    try {
        const result = await Promise.resolve(getDemandRevenueDistribution(req.query));
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching demand revenue distribution', error: error.message });
    }
};

demandController.getProjections = async (req, res) => {
    try {
        const result = await Promise.resolve(getDemandProjections(req.query));
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching demand projections', error: error.message });
    }
};

export default demandController;



