import express from 'express';
import dotenv from 'dotenv';
import { BlobServiceClient } from '@azure/storage-blob';
import { swaggerUi, swaggerSpec } from './swagger.js';
import inventoryRoutes from './User/Routes/inventoryRoutes.js';
import demandRoutes from './User/Routes/demandRoutes.js';
import supplyChainRoutes from './User/Routes/supplyChain.js';
import cors from 'cors';
import ecommerceRoutes from './User/Routes/eCommerce.js';
import pnlRoutes from './User/Routes/pnlRoutes.js';
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors(
    {
        origin: 'https://datahive.vectoraistudio.com',
		// origin: 'http://localhost:7600',	
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true
    }
));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/inventory', inventoryRoutes);
app.use('/demand', demandRoutes);
app.use('/supply-chain', supplyChainRoutes);
app.use('/ecommerce', ecommerceRoutes);
app.use('/pnl', pnlRoutes);

app.get('/', (req, res) => {
    res.send(`<h1 style="color: #000; font-size: 24px; font-weight: bold; text-align: center;">Thrive Dashboard Backend API</h1>`);
});

async function verifyAzureConnection() {
	try {
		const conn = process.env.AZURE_CONNECTION_STRING;
		const containerName = process.env.AZURE_CONTAINER_NAME;
		if (!conn || !containerName) {
			console.warn('AZURE_CONNECTION_STRING or AZURE_CONTAINER_NAME missing');
			return;
		}
		const blobServiceClient = BlobServiceClient.fromConnectionString(conn);
		const containerClient = blobServiceClient.getContainerClient(containerName);
		const exists = await containerClient.exists();
		if (exists) {
			console.log(`Azure connected. Container '${containerName}' is accessible.`);
		} else {
			console.error(`Azure reachable, but container '${containerName}' does not exist or is not accessible.`);
		}
	} catch (err) {
		console.error('Azure connection check failed:', err.message);
	}
}

const PORT = process.env.PORT || 5020;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    verifyAzureConnection();
});