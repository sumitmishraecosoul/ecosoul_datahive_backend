import fs from "fs";
import path from "path";
import { parse as parseCsv } from "csv-parse/sync";

const csvParser = async (filePath) => {
        try {
            const fileBuffer = fs.readFileSync(filePath);
            const ext = path.extname(filePath).toLowerCase();

            if (ext === ".csv") {
                const text = fileBuffer.toString("utf8");
                const records = parseCsv(text, { columns: true, skip_empty_lines: true });
                return records;
            }

            throw new Error(`Unsupported file format: ${ext}. Only CSV files are supported.`);
        } catch (error) {
            throw new Error(`Error parsing CSV file: ${error.message}`);
        }
}

export default csvParser;

// Stub dataset loader for in-memory data used across services/controllers
export const loadData = () => {
        const filters = {
            skus: ["SKU-001", "SKU-002", "SKU-003"],
            categories: ["Bags", "Bottles"],
            materials: ["Plastic", "Steel"],
            platforms: ["Amazon", "D2C"],
            regions: ["US", "EU"],
            asins: ["ASIN001", "ASIN002", "ASIN003"]
        };

        const now = new Date("2025-01-01T00:00:00Z");
        const days = Array.from({ length: 30 }, (_, i) => new Date(now.getTime() - i * 24 * 3600 * 1000));

        const inventoryTimeseries = days.map((d, idx) => ({
            date: d.toISOString(),
            sku: idx % 2 === 0 ? "SKU-001" : "SKU-002",
            category: idx % 3 === 0 ? "Bags" : "Bottles",
            material: idx % 2 === 0 ? "Plastic" : "Steel",
            platform: idx % 2 === 0 ? "Amazon" : "D2C",
            region: idx % 2 === 0 ? "US" : "EU",
            asin: idx % 2 === 0 ? "ASIN001" : "ASIN002",
            on_hand: 100 - idx,
            inbound: 20 + (idx % 5),
            backorder: idx % 4,
            days_of_cover: 30 - (idx % 10)
        }));

        const inventoryItems = [
            { sku: "SKU-001", name: "Eco Bottle 1L", category: "Bottles", material: "Steel", platform: "Amazon", region: "US", asin: "ASIN001", on_hand: 120, inbound: 15, price: 19.99 },
            { sku: "SKU-002", name: "Eco Tote", category: "Bags", material: "Plastic", platform: "D2C", region: "EU", asin: "ASIN002", on_hand: 80, inbound: 30, price: 9.99 },
            { sku: "SKU-003", name: "Eco Bottle 750ml", category: "Bottles", material: "Steel", platform: "Amazon", region: "US", asin: "ASIN003", on_hand: 60, inbound: 10, price: 17.99 }
        ];

        return {
            filters,
            inventory: {
                timeseries: inventoryTimeseries,
                items: inventoryItems
            }
        };
};