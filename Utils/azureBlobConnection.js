import { BlobServiceClient } from "@azure/storage-blob";
import csv from "csv-parser";
import dotenv from "dotenv";
 

dotenv.config();  

const containerName = process.env.AZURE_CONTAINER_NAME;
const conn = process.env.AZURE_CONNECTION_STRING;
const defaultBlobPath = process.env.AZURE_BLOB_PATH;

const fecthDatafromBlog = async(blobPath) =>{
    const effectiveBlobPath = blobPath || defaultBlobPath;
    if (!effectiveBlobPath) {
        throw new Error("Blob path not provided. Pass blobPath or set AZURE_BLOB_PATH.");
    }
    console.log('Starting to fetch data from Azure Blob...', { blobPath: effectiveBlobPath });

    const blobServiceClient = BlobServiceClient.fromConnectionString(conn);
    console.log('Blob service client created successfully');

    const containerClient = blobServiceClient.getContainerClient(containerName);
    console.log('Container client created');

    const blobClient = containerClient.getBlobClient(effectiveBlobPath);
    console.log('Blob client created');
    try {
        console.log('Fetching blob file from Azure:', blobClient.name || effectiveBlobPath);
    } catch {
        console.log('Fetching blob file from Azure:', effectiveBlobPath);
    }

    const downloadFile = await blobClient.download();
    console.log('Blob download initiated successfully');

    // CSV parsing only
	return new Promise((resolve, reject) => {
		const result = [];
		console.log('Starting CSV parsing...');
		
        downloadFile.readableStreamBody.pipe(csv())
		.on("data", (data) => {
			result.push(data);
			// console.log('CSV row processed, total rows:', result.length);
		})
		.on("end", () => {
			// console.log('CSV parsing completed successfully. Total rows:', result.length);
			if (result.length > 0) {
				console.log('Last parsed row:', result[result.length - 1]);
			} else {
				console.log('No rows parsed.');
			}
			resolve(result);
		})
		.on("error", (err) => {
			console.error('Error during CSV parsing:', err);
			reject(err);
		});
	});

}

export default { fecthDatafromBlog };