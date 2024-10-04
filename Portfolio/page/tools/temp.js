const fs = require('fs');
const path = require('path');

function asyncFsReadFile (filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', async (err, data) => {
      if (err) {
        reject(err)
        return;
      }
      resolve(data)
    });
  })
}

function asyncFsWriteFile (filePath, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, data, 'utf8', err => {
      if (err) {
        reject(err)
        return;
      }

      resolve(true)
    });
  })
}

async function main () {
  const resultVectorList = JSON.parse(await asyncFsReadFile('./output/resultVectorListFixed.json'))
  const processedScanResults = JSON.parse(await asyncFsReadFile('./output/processed_scan_results.json'))
  const resultArray = []

  processedScanResults.forEach((el, index) => {
    resultArray.push({
      content: el.content,
      metadata: { path: el.path, modifiedTime: el.modifiedTime},
      // id: ,
      vector: resultVectorList[index],
    })
  })

  await asyncFsWriteFile("./output/finalPortfolioEmbeds.json", JSON.stringify(resultArray, null, 2))
}

main()