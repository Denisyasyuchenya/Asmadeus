const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function downloadFile(apiKey, downloadPath) {
    try {
        const response = await axios.get(apiKey, { responseType: 'arraybuffer' }); 
        const filePath = path.join(downloadPath, 'brand-collector.xlsx'); 
        fs.writeFileSync(filePath, response.data); 
        console.log(`File downloaded successfully. Path: ${filePath}`);
        return filePath; 
    } catch (error) {
        throw new Error(`Error downloading file: ${error.message}`);
    }
}



module.exports = { downloadFile };
