const fs = require('fs');
const csvParser = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');
const { emptyCheck, sameCheck, deleteCheck, bigCheck } = require(path.join(__dirname,'compare-domain-service.js'));

async function getCompare(outputCsvPath, origFilePath) {
    try {
        console.log('Checking for empty data...');
        const isEmpty = await emptyCheck(outputCsvPath);

        if (isEmpty) {
            console.log('File is empty. Exiting comparison.');
            return;
        }

        console.log('Checking for same data...');
        const areSame = await sameCheck(outputCsvPath, origFilePath);

        if (!areSame) {
            console.log('Files have different data. Running deleteCheck...');
            await deleteCheck(outputCsvPath, origFilePath);
        } else {
            console.log('Files have identical data. Running bigCheck...');
            await bigCheck(outputCsvPath, origFilePath);
        }
    } catch (error) {
        console.error(`Error during comparison: ${error.message}`);
    }
}

module.exports =  { getCompare };