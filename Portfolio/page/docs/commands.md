# crawlFolderRun
C:\Users\Nuts\Documents\studylibrary\Portfolio\page>node tools\crawlFolder.js --crawlFolder=..\..\Learn --saveJsonTo=./output.json

node tools\crawlFolder.js --crawlFolder=..\..\Learn --saveJsonTo=./output/output.json

# modifyJson
node ./modifyJson.js --path=/path/to/input.json --savePath=/path/to/output.json
node ./tools/modifyJson.js --path=./output/scan_results.json --savePath=./output/processed_scan_results.json

# prepForVectorList
node ./tools/prepForVectorList.js --path=./output/processed_scan_results.json --savePath=./output/targetVectorList.json