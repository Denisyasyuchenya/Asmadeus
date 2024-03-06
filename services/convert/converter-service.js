const fs = require('fs');
const XLSX = require('xlsx');
function convertXlsxToCsv(xlsxFilePath, outputCsvPath) {
    try {
        const workbook = XLSX.read(fs.readFileSync(xlsxFilePath), { type: 'buffer' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const csvData = XLSX.utils.sheet_to_csv(worksheet);

        fs.writeFileSync(outputCsvPath, csvData);
        console.log(`Conversion complete. CSV file saved to: ${outputCsvPath}`);
    } catch (error) {
        console.error(`Error during conversion: ${error.message}`);
    }
}
module.exports = { convertXlsxToCsv };
