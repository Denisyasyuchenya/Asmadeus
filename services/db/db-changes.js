const path = require('path');
const { getCurrentRomeTime } = require(path.join(__dirname,'..', 'get-time.js'));

async function addDeleteToLog(db, handle, deletedRow) {
    return new Promise((resolve, reject) => {
        const timestamp = getCurrentRomeTime();
        const type = 'delete';

        // Формируем объект с данными об удаленной записи
        const data = {
            handle,
            rowData: deletedRow,
        };

        // Выполняем SQL-запрос для добавления записи в таблицу лога
        const insertQuery = `INSERT INTO log (type, data, timestamp) VALUES (?, ?, ?);`;
        db.run(insertQuery, [type, JSON.stringify(data), timestamp], function (err) {
            if (err) {
                console.error(`Error adding delete log: ${err.message}`);
                reject(err);
            } else {
                console.log(`Delete log added with ID: ${this.lastID}`);
                resolve(db);
            }
        });
    });
}

module.exports = {
    addDeleteToLog,
};