const fs = require('fs');
const path = require('path');

// Get CLI arguments
const args = require('minimist')(process.argv.slice(2));

// Check if both --path and --savePath are provided
if (!args.path || !args.savePath) {
  console.error("Error: Both --path and --savePath parameters are required.");
  process.exit(1);
}

const inputFilePath = path.resolve(args.path);
const outputFilePath = path.resolve(args.savePath);

// Function to replace multiple spaces with a single space in the "content" key
function prepForVectorList(jsonArray) {
  const returnObject = []
  jsonArray.forEach(json => {
    returnObject.push(`
Title of what I have learned: ${json.path}
I learned this at: ${json.modifiedTime}
What I have learned: ${json.content}
`)
    return json;
  })
  return returnObject
}

// Read JSON file, modify it, and save the result
fs.readFile(inputFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error("Error reading the JSON file:", err);
    return;
  }

  try {
    // Parse the JSON file
    const jsonArray = JSON.parse(data);

    // Ensure it's an array
    if (!Array.isArray(jsonArray)) {
      throw new Error("The JSON file must contain an array of JSON objects.");
    }

    // Replace multiple spaces in the "content" key of each JSON object
    const modifiedJsonArray = prepForVectorList(jsonArray);

    // Write the modified JSON array to the output file
    fs.writeFile(outputFilePath, JSON.stringify(modifiedJsonArray, null, 2), 'utf8', err => {
      if (err) {
        console.error("Error saving the modified JSON file:", err);
        return;
      }

      console.log(`Modified JSON has been saved to ${outputFilePath}`);
    });
  } catch (parseError) {
    console.error("Error parsing JSON file:", parseError);
  }
});
