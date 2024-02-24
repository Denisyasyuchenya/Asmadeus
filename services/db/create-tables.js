function createFileLinkTable(db) {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS fileLink (
            ID INTEGER PRIMARY KEY AUTOINCREMENT,
            file TEXT,
            link TEXT
        );
    `;

    db.run(createTableQuery, (err) => {
        if (err) {
            console.error(`Error creating table fileLink: ${err.message}`);
        } else {
            console.log('Table fileLink created successfully.');
        }
    });
}

function createLogTable(db) {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS log (
            ID INTEGER PRIMARY KEY AUTOINCREMENT,
            fileID INTEGER,
            type TEXT,
            data TEXT,
            timestamp DATA,
            FOREIGN KEY (fileID) REFERENCES fileLink (ID)
        );
    `;

    db.run(createTableQuery, (err) => {
        if (err) {
            console.error(`Error creating table log: ${err.message}`);
        } else {
            console.log('Table log created successfully.');
        }
    });
}

module.exports = {
    createFileLinkTable,
    createLogTable,
};



