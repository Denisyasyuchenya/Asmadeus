const fs = require('fs');
const path = require('path');
const { emptyCheck, sameCheck, deleteCheck} = require(path.join(__dirname,'compare-domain-service.js'));
const outputCsvPath = path.join(__dirname,'..','..','output','brand-collector.csv');
const origFilePath = path.join(__dirname,'..','..','testfiles','orig','delete','brand-collector.csv');

let firstRun = true;

getCompare(outputCsvPath, origFilePath);
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
        } 
    } catch (error) {
        console.error(`Error during comparison: ${error.message}`);
    } finally {
        if (firstRun) {
            startTimer();
            firstRun = false;
        }
    }
}



function startTimer() {
    console.log('Timer started. Will run the code every 2 minutes.');
    const intervalId = setInterval(async () => {
        await getCompare(outputCsvPath, origFilePath);
    }, 2 * 60 * 1000); 

    const sixMinutes = 6 * 60 * 1000;
    setTimeout(() => {
        clearInterval(intervalId);
        console.log('Timer stopped after 6 minutes. Exiting...');
        process.exit(0);
    }, sixMinutes); 
}


// module.exports =  { getCompare };