const path = require('path');
const { getCurrentRomeTime } = require(path.join(__dirname,'..', 'get-time.js'));

async function addDeleteToDB(db, handle, deletedRow, origFilePath) {
    return new Promise((resolve, reject) => {
        const timestamp = getCurrentRomeTime();
        const type = 'delete';
        const insertFileLinkQuery = `INSERT INTO fileLink (file, link) VALUES (?, ?);`;

        // Выполняем SQL-запрос для добавления записи в таблицу fileLink
        const filePath = path.basename(origFilePath);
        const fileLink = path.relative(__dirname, origFilePath);
        db.run(insertFileLinkQuery, [filePath, fileLink], function (err) {
            if (err) {
                console.error(`Error adding file link: ${err.message}`);
                reject(err);
            } else {
                console.log(`File link added with ID: ${this.lastID}`);
                
                // Получаем ID добавленной записи в таблицу fileLink
                const fileLinkId = this.lastID;

                // Формируем объект с данными об удаленной записи
                const data = {
                    handle,
                    rowData: deletedRow,
                };

                // Форматируем данные для записи в log
                let logData = '';
                Object.keys(deletedRow).forEach(key => {
                    logData += `${key}: ${deletedRow[key]}\n`;
                });

                // Выполняем SQL-запрос для добавления записи в таблицу log
                const insertLogQuery = `
                    INSERT INTO log (fileID, type, timestamp, data) 
                    VALUES (?, ?, ?, ?);
                `;
                db.run(insertLogQuery, [fileLinkId, type, timestamp, logData], function (err) {
                    if (err) {
                        console.error(`Error adding delete log: ${err.message}`);
                        reject(err);
                    } else {
                        console.log(`Delete log added with ID: ${this.lastID}`);
                        resolve();
                    }
                });
            }
        });
    });
}

module.exports = {
    addDeleteToDB,
};