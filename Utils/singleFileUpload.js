import { createDirectory } from "./directoryFunctions.js";
import path from "path";

export const singleFileUpload = async (req, res) => {
    const file = req.files?.file;
    const filePath = res.path;
    
    if (!file) {
        throw new Error("No file provided");
    }
    
    if (!filePath) {
        throw new Error("No path provided");
    }

    // Extract directory path from file path
    const directoryPath = path.dirname(filePath);

    // Wait for directory creation to complete
    await createDirectory(directoryPath);

    // Return a promise for file upload
    return new Promise((resolve, reject) => {
        file.mv(filePath, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(true);
            }
        });
    });
}