// getFileInfo(origFilePath)
//     .then(({ rowCount, columnCount }) => console.log(`File info: Rows - ${rowCount}, Columns - ${columnCount}`))
//     .catch(error => console.error(`Error: ${error.message}`));

// getFileInfo(filePath)
//     .then(({ rowCount, columnCount }) => console.log(`File info: Rows - ${rowCount}, Columns - ${columnCount}`))
//     .catch(error => console.error(`Error: ${error.message}`));



async function getFileInfo(filePath) {
    try {
        const readStream = fs.createReadStream(filePath);
        let rowCount = 0;
        let columnCount = 0;

        await new Promise((resolve, reject) => {
            readStream
                .pipe(csvParser())
                .on('data', () => {
                    rowCount += 1; 
                })
                .on('headers', (headers) => {
                    columnCount = headers.length; 
                })
                .on('end', () => {
                    resolve({ rowCount, columnCount });
                })
                .on('error', reject);
        });

        return { rowCount, columnCount };
    } catch (error) {
        throw new Error(`Error reading file: ${error.message}`);
    }
}