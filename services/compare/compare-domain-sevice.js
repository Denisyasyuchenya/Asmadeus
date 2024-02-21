// func сравнения разных кейсов из тестфайл:
// когда приходит пустой файл(empty) - перезаписываем файл
// когда удалили одну строку(delete) - остаётся строка, но меняются значения столбцов published, Status, Qty....
// когда такой же файл(same) - ничего не меняется
// когда большой файл (big) (добавились записи) - добавляем к нашим строкам те, что добавились
// когда данные позиций товаров те же но поменялись значения (свойства) (changes) - то мы подтягиваем эти изменения(заменяя нужные данные) с сохранением всех остальных данных.

const fs = require('fs');
const csvParser = require('csv-parser');

async function compareFiles(file, origFile) {
  const originalData = await parseCsvFile(origFile);
  const newData = await parseCsvFile(file);

  // Определить тип изменения
  const changeType = getChangeType(originalData, newData);

  // Обработать изменение
  switch (changeType) {
    case 'empty':
      // Перезаписать файл
      await fs.promises.writeFile(origFile, newData);
      break;
    case 'same':
      // Не делать ничего
      break;
    case 'delete':
      // Удалить строку
      const updatedData = originalData.filter(row => !newData.some(newRow => row.id === newRow.id));
      await fs.promises.writeFile(origFile, updatedData);
      break;
    case 'big':
      // Добавить новые записи
      const updatedData = [...originalData, ...newData.filter(row => !originalData.some(origRow => row.id === origRow.id))];
      await fs.promises.writeFile(origFile, updatedData);
      break;
    case 'changes':
      // Обновить значения
      const updatedData = originalData.map(row => {
        const newRow = newData.find(newRow => newRow.id === row.id);
        if (newRow) {
          return { ...row, ...newRow };
        }
        return row;
      });
      await fs.promises.writeFile(origFile, updatedData);
      break;
  }
}

async function parseCsvFile(file) {
  const parser = csvParser();
  const data = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(file)
      .pipe(parser)
      .on('data', row => data.push(row))
      .on('end', () => resolve())
      .on('error', reject);
  });
  return data;
}

function getChangeType(originalData, newData) {
  if (newData.length === 0) {
    return 'empty';
  } else if (originalData.length === newData.length && originalData.every((row, i) => JSON.stringify(row) === JSON.stringify(newData[i]))) {
    return 'same';
  } else if (originalData.length > newData.length) {
    return 'delete';
  } else if (originalData.length < newData.length) {
    return 'big';
  } else {
    return 'changes';
  }
}

// Пример использования
compareFiles('testfiles/file/brand-collector.csv', 'testfiles/orig/same/brand-collector.csv');
