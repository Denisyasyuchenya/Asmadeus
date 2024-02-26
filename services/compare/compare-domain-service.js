const fs = require('fs');
const csvParser = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');
const dataBasePath = path.join(__dirname,'..', 'db', 'changes.db');
const { connectToDB, disconnectFromDB } = require(path.join(__dirname,'..','db','db-service.js'));
const { createFileLinkTable, createLogTable} = require(path.join(__dirname,'..','db','create-tables.js'));
const { addDeleteToDB } = require(path.join(__dirname,'..','db','db-changes.js'));

async function readCSVFile(filePath) {
    return new Promise((resolve, reject) => {
        const data = [];

        fs.createReadStream(filePath)
            .pipe(csvParser())
            .on('data', (row) => {
                data.push(row);
            })
            .on('end', () => {
                resolve(data);
            })
            .on('error', (error) => {
                reject(error);
            });
    });
}

async function emptyCheck(outputCsvPath) {
    try {
        const emptyFileData = await readCSVFile(outputCsvPath);

        if (emptyFileData.length === 0) {
            console.log(`File ${outputCsvPath} is empty.`);
            return true;
        } else {
            console.log(`File ${outputCsvPath} is not empty.`);
            return false;
        }
    } catch (error) {
        console.error(`Error checking file: ${error.message}`);
    }
}

async function deleteCheck(outputCsvPath, origFilePath) {
    const dbConnection = connectToDB(dataBasePath);
    try {
        const db = await dbConnection;
        createFileLinkTable(db);
        createLogTable(db);

        
        const outputPathData = await readCSVFile(outputCsvPath);
        const origFilePathData = await readCSVFile(origFilePath);

        // Находим наименования в origFilePathData, которых нет в outputPathData
        const missingHandles = origFilePathData
            .map((row) => row['Handle'])
            .filter((handle) => !outputPathData.some((outputRow) => outputRow['Handle'] === handle));

        console.log('Missing handles identified:', missingHandles);

        // Если есть отсутствующие наименования
        if (missingHandles.length > 0) {
            console.log('Missing handles found in the origFile:');

            // Обрабатываем каждое отсутствующее наименование
            for (const missingHandle of missingHandles) {
                console.log(`Processing handle: ${missingHandle}`);

                // Находим индекс соответствующей строки в файле origFilePath
                const rowIndex = origFilePathData.findIndex((origRow) => origRow['Handle'] === missingHandle);

                // Изменяем значения в указанных столбцах
                if (origFilePathData[rowIndex].published !== undefined) {
                    origFilePathData[rowIndex].published = origFilePathData[rowIndex].published.trim().toUpperCase() === 'TRUE' ? 'FALSE' : 'TRUE';
                }

                if (origFilePathData[rowIndex].Status !== undefined) {
                    origFilePathData[rowIndex].Status = origFilePathData[rowIndex].Status === 'Active' ? 'Draft' : 'Active';
                }

                if (origFilePathData[rowIndex]['Variant Inventory Qty'] !== undefined) {
                    origFilePathData[rowIndex]['Variant Inventory Qty'] = origFilePathData[rowIndex]['Variant Inventory Qty'] === '1' ? '0' : '1';
                }

                // Добавляем зафиксированные различия в таблицу лога базы данных
                console.log(`Adding missing data to the log table`);
                await addDeleteToDB(db, missingHandle, origFilePathData[rowIndex], origFilePath);
            }

            console.log('CSV files compared and updated successfully.');
        } else {
            console.log('No missing handles in the original file.');
        }
    } catch (error) {
        console.error(`Error comparing files: ${error.message}`);
    } finally {
        disconnectFromDB(dbConnection);
    }
}

async function sameCheck(outputCsvPath, origFilePath) {
    try {
        const areEqual = await compareIfEqual(outputCsvPath, origFilePath);

        if (areEqual) {
            console.log('Equal data');
        } 
    } catch (error) {
        console.error(`Error comparing files: ${error.message}`);
    }
}

async function compareIfEqual(outputCsvPath, origFilePath) {
    const fileData = await readCSVFile(outputCsvPath);
    const origFileData = await readCSVFile(origFilePath);

    if (fileData.length !== origFileData.length) {
        return false;
    }

    for (let rowIndex = 0; rowIndex < fileData.length; rowIndex++) {
        const fileRow = fileData[rowIndex];
        const origFileRow = origFileData[rowIndex];

        for (let column in fileRow) {
            if (fileRow[column] !== origFileRow[column]) {
                return false;
            }
        }
    }

    return true;
}


// const outputCsvPath = path.join(__dirname,'..','..','output','brand-collector.csv');
// const origFilePath = path.join(__dirname, '..','..','testfiles','orig','big','brand-collector.csv');
// bigCheck(outputCsvPath, origFilePath);
async function bigCheck(outputCsvPath, origFilePath) {
    try {
        // Читаем данные из файла filePath
        const outputCsvData = await readCSVFile(outputCsvPath);

        // Читаем данные из файла origFilePath
        const origFileData = await readCSVFile(origFilePath);

        // Находим записи в origFileData, которых нет outputCvPath
        const newRows = origFileData.filter((origRow) => {
            return !outputCsvData.some((fileRow) => fileRow['Handle'] === origRow['Handle']);
        });

        // Если есть новые записи
        if (newRows.length > 0) {
            console.log('New rows found in the original file.');
            
            // Добавляем новые записи в outputCsvData
            outputCsvData.push(...newRows);

            // Записываем обновленные данные обратно в файл outputCsvPath
            const csvWriterInstance = createCsvWriter({
                path: outputCsvPath,
                header: Object.keys(outputCsvData[0]).map((header) => ({ id: header, title: header })),
            });
            await csvWriterInstance.writeRecords(outputCsvData);

            console.log('CSV files compared and updated successfully.');
        } else {
            console.log('No new rows in the original file.');
        }
    } catch (error) {
        console.error(`Error comparing files: ${error.message}`);
    }
}






module.exports = {
    emptyCheck,
    sameCheck,
    deleteCheck,
    bigCheck,
  };














