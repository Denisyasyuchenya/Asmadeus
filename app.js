const path = require('path');
const apiKey = 'https://backoffice.thebrandcollector.com/api/v1/herage/csv/';
const { downloadFile } = require(path.join(__dirname,'services', 'download', 'download-file.js'));
const downloadPath = path.join(__dirname,'downloads');
const outputCsvPath = path.join(__dirname,'output','brand-collector.csv');
const { convertXlsxToCsv } = require(path.join(__dirname,'services','convert','converter-service.js'));
const origFilePath = path.join(__dirname, 'testfiles','orig','same','brand-collector.csv');
const { getCompare } = require(path.join(__dirname,'services','compare','compare-service.js'));



async function runApp(apiKey, downloadPath, outputCsvPath, origFilePath) {
    try {
        console.log('Downloading file...');
        const xlsxFilePath = await downloadFile(apiKey, downloadPath);
        
        console.log('Converting XLSX to CSV...');
        await convertXlsxToCsv(xlsxFilePath, outputCsvPath);

        console.log('Running comparison...');
        await getCompare(outputCsvPath, origFilePath);

        console.log('App execution completed successfully.');
    } catch (error) {
        console.error(`Error running the app: ${error.message}`);
    }
}

runApp(apiKey, downloadPath, outputCsvPath, origFilePath);