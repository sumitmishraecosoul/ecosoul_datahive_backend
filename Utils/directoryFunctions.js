import fs from "fs";
import path from "path";

const createDirectory = async(pathname) =>{
    return new Promise((resolve, reject) => {
    try{
        const __dirname = path.resolve();
        pathname = pathname.replace(/\\/g, "/");
        fs.mkdir(path.join(__dirname, pathname), { recursive: true }, (err) => {
            if(err){
                console.error(err);
                reject(err);
            }
            resolve(true);
        });
    }catch(error){
            console.error("Error creating directory:", error);
            reject(error);
        }
    });
};

const deleteDirectory = async(pathname) =>{
    return new Promise((resolve, reject) => {
        try{
            const __dirname = path.resolve();
            const dirPath = path.join(__dirname, pathname);

            fs.rm(dirPath), { recursive: true }, (err) => {
                if(err){
                    console.error(err);
                    reject(err);
                }
                resolve(true);
            }
        }
        catch(error){
            console.error(error);
            reject(error);
        }
    });
};

const deleteSingleFile = async(pathname) =>{
    return new Promise((resolve, reject) => {
        const __dirname = path.resolve();
        const filePath = path.join(__dirname,"upload", pathname);
        fs.rm(filePath, { recursive: true }, (err) => {
            if(err){
                console.error(err);
            }
            resolve(true);
        });
    });
};

export { createDirectory, deleteDirectory, deleteSingleFile};
