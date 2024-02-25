const sqlite3 = require('sqlite3').verbose();

function connectToDB(databasePath) {
    const db = new sqlite3.Database(databasePath, (err) => {
        if (err) {
            console.error(`Error connecting to the database: ${err.message}`);
        } else {
            console.log(`Connected to the database at ${databasePath}`);
        }
    });

    if (!db) {
        console.error('Error creating database connection.');
    }

    return db;
}

function disconnectFromDB(dbConnection) {
    if (dbConnection) {
        dbConnection.close((err) => {
            if (err) {
                console.error(`Error disconnecting from the database: ${err.message}`);
            } else {
                console.log('Disconnected from the database.');
            }
        });
    }
}

module.exports = {
    connectToDB,
    disconnectFromDB,
};

