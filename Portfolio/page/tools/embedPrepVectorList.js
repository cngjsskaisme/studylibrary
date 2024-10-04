const embedWithGemini = require("./embedWithGemini");
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
const batchSize = args.batchSize || 10

async function main () {
  fs.readFile(inputFilePath, 'utf8', async (err, data) => {
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
      const returnArrays = [];
      console.log("|| Starting vector with batch size of : " + batchSize)

      const targetRounds = Math.ceil(jsonArray.length / batchSize)

      console.log("|| targetRounds : " + targetRounds)
      
      for (let i = 0; i < targetRounds; i++) {
        console.log(`|| running gemini embedding (Round: ${i})`)
        const geminiEmbedResult = await embedWithGemini({ texts: jsonArray.slice(i * batchSize, (i + 1) * batchSize)})
        geminiEmbedResult.forEach(vector => {
          returnArrays.push(vector.values)
        })
      }
  
      // Write the modified JSON array to the output file
      fs.writeFile(outputFilePath, JSON.stringify(returnArrays), 'utf8', err => {
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
}

main()