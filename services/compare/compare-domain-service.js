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
        } else {
            console.log(`File ${outputCsvPath} is not empty.`);
        }
    } catch (error) {
        console.error(`Error checking file: ${error.message}`);
    }
}

const fs = require('fs');
const csvParser = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');
const outputCsvPath = path.join(__dirname,'..','..','output','brand-collector.csv');
const origFilePath = path.join(__dirname,'..','..','testfiles','orig','delete','brand-collector.csv');
const dataBasePath = path.join(__dirname,'..', 'db', 'changes.db');
const { connectToDB, disconnectFromDB } = require(path.join(__dirname,'..','db','db-service.js'));
const { createFileLinkTable, createLogTable} = require(path.join(__dirname,'..','db','create-tables.js'));
const { addDeleteToDB } = require(path.join(__dirname,'..','db','db-changes.js'));

deleteCheck(outputCsvPath, origFilePath);

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
                console.log(`Adding delete log for handle: ${missingHandle}`);
                await addDeleteToDB(db, missingHandle, origFilePathData[rowIndex], origFilePath);
            }

            console.log('CSV files compared and updated successfully.');
        } else {
            console.log('No missing handles in the original file.');
        }
    } catch (error) {
        console.error(`Error comparing files: ${error.message}`);
    } finally {
        // Отключаемся от базы данных
        console.log('Disconnecting from the database.');
        disconnectFromDB(dbConnection);
    }
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

//Проверка файлов на Equal. Фиксация различий (все функции ниже взаимодействуют между собой).
// const outputCsvPath = path.join(__dirname,'..','..','output','brand-collector.csv');
// const origFilePath = path.join(__dirname, '..','..','testfiles','orig','same','brand-collector.csv');
// sameCheck(outputCsvPath, origFilePath);

async function sameCheck(outputCsvPath, origFilePath) {
    try {
        const differingCells = await compareIfEqual(outputCsvPath, origFilePath);

        if (!differingCells) {
            console.log('Equal data');
        } else {
            console.log('Different data');
            console.log('Differing cells:', differingCells);
        }
    } catch (error) {
        console.error(`Error comparing files: ${error.message}`);
    }
}

async function compareIfEqual(outputCsvPath, origFilePath) {
    const fileData = await readCSVFile(outputCsvPath);
    const origFileData = await readCSVFile(origFilePath);

    if (fileData.length !== origFileData.length) {
        return [{ message: 'Files have different number of rows' }];
    }

    const differingCells = [];

    for (let rowIndex = 0; rowIndex < fileData.length; rowIndex++) {
        const fileRow = sortRowColumns(fileData[rowIndex]);
        const origFileRow = sortRowColumns(origFileData[rowIndex]);

        if (!areRowsEqual(fileRow, origFileRow)) {
            differingCells.push({
                row: rowIndex,
                differingCells: findDifferingCells(fileRow, origFileRow),
            });
        }
    }

    return differingCells.length > 0 ? differingCells : null;
}

function sortRowColumns(row) {
    const sortedRow = {};
    Object.keys(row).sort().forEach((key) => {
        sortedRow[key] = row[key];
    });
    return sortedRow;
}

function areRowsEqual(row1, row2) {
    const keys1 = Object.keys(row1).sort();
    const keys2 = Object.keys(row2).sort();

    if (keys1.length !== keys2.length) {
        return false;
    }

    return keys1.every((key, index) => {
        const value1 = row1[key];
        const value2 = row2[key];
        return value1 === value2;
    });
}

function findDifferingCells(row1, row2) {
    const differingCells = [];

    Object.keys(row1).forEach((key) => {
        if (row1[key] !== row2[key]) {
            differingCells.push({
                column: key,
                fileValue: row1[key],
                origFileValue: row2[key],
            });
        }
    });

    return differingCells;
}



module.exports = {
    emptyCheck,
    sameCheck,
    deleteCheck,
    bigCheck,
  };





// async function changesCheck(file, origFolderPath) {
//     try {
//         const newData = await readCSVFile(file);

//         const origFiles = await fs.readdir(origFolderPath);
//         for (const origFile of origFiles) {
//             const origFilePath = `${origFolderPath}/${origFile}`;
//             const originalData = await readCSVFile(origFilePath);

//             const changedRows = originalData.map(row => {
//                 const newRow = newData.find(newRow => newRow.id === row.id);
//                 return newRow ? { ...row, ...newRow } : row;
//             });

//             if (JSON.stringify(changedRows) !== JSON.stringify(originalData)) {
//                 console.log(`Rows changed in ${file} compared to ${origFilePath}. Updated rows:`, changedRows);
//             } else {
//                 console.log(`No rows changed in ${file} compared to ${origFilePath}.`);
//             }
//         }
//     } catch (error) {
//         console.error(`Error comparing files: ${error.message}`);
//     }
// }









