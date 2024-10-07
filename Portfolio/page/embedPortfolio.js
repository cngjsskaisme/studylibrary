import { ChromaClient, DefaultEmbeddingFunction, GoogleGenerativeAiEmbeddingFunction } from 'chromadb'
import fs from 'fs'
import embedder from './tools/embedders.js'
import { configDotenv } from 'dotenv'
import minimist from 'minimist'

configDotenv()

function promiseWait (amountOfMillis) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(true)
    }, amountOfMillis)
  })
}

const getCustomFormattedText = (inputDocumentObject) => {
return `
1. This document's type : What I have learned
2. I learned at : ${inputDocumentObject.metadata.modifiedTime}
3. I scrapped this file at : ${inputDocumentObject.metadata.path}
4. What I have learned :
${inputDocumentObject.content}
`
}

function splitIntoChunks(text, sentencesPerChunk = 10) {
  // Split the text by sentences (e.g., period, exclamation mark, or question mark)
  let sentences = text.match(/[^.!?]+[.!?]+/g);

  // Check if we got sentences; if not, return an empty array
  if (!sentences) return [];

  let chunks = [];
  for (let i = 0; i < sentences.length; i += sentencesPerChunk) {
      // Get a chunk of 5 sentences at a time
      let chunk = sentences.slice(i, i + sentencesPerChunk).join(' ');
      chunks.push(chunk);
  }

  return chunks;
}

const args = minimist(process.argv.slice(2));

async function chromaExample() {

  const client = new ChromaClient();

  if (args.op === 'delete') {
    await client.deleteCollection({ name: process.env.TARGET_COLLECTION_NAME })
    return
  }

  // Check if collection 'Nuts_Portfolio' exists, create if not
  let collection;

  try {
    collection = await client.getCollection({
      name: process.env.TARGET_COLLECTION_NAME,
      embeddingFunction: embedder.gemini()
    });
  } catch (error) {
    collection = await client.createCollection({
      name: process.env.TARGET_COLLECTION_NAME,
      embeddingFunction: embedder.gemini()
    });
  }


  // Get JSON data from given path
  function getJsonData(path) {
    return new Promise(resolve => {
      try {
        const data = fs.readFile(path, 'utf-8', function (err, data) {
          resolve(JSON.parse(data))
        });
      } catch (error) {
        console.error(`Error reading JSON data from ${path}:`, error);
        return null;
      }
    })
  }

  // Example usage of getJsonData
  const jsonData = await getJsonData('./output/finalPortfolioEmbeds.json');

  // Check for duplicate path before adding data
  const existingDocuments = await collection.get();
  const existingPaths = existingDocuments.metadatas?.map(meta => meta.path) || [];

  // console.log(existingDocuments)

  const newUniqueEntries = jsonData.filter(entry => !existingPaths.includes(entry.metadata.path));
  // let nextId = existingDocuments.ids?.length ? Math.max(...existingDocuments.ids.map(id => parseInt(id, 10))) + 1 : 1;

  // console.log(uniqueMetadatas);
  const targetUniqueEntries = newUniqueEntries.map((el, index) => {
    return {
      content: el.content || "",
      metadata: el.metadata,
      // id: nextId++,
      id: index + 1,
      // vector: el.vector || []
    };
  });

  // Put data into chroma with "path", "modifiedTime", "content", "vector"
  if (targetUniqueEntries.length > 0) {

    let currentId = 1

    for (let i = 0; i < targetUniqueEntries.length; i++) {
      const el = targetUniqueEntries[i]
      if (args.mode === "split") {
        const splittedTextArray = splitIntoChunks(el.content)
        // console.log(splittedTextArray)
        console.log(`|| Vectors adding for index : ${i} | textArray length : ${splittedTextArray.length}`)
        if (splittedTextArray.length === 0) {
          console.log(`|| Got empty splitted Text array for index : ${i}, skipping...`)
          continue
        }
        await promiseWait(Math.random() * 200)
        await collection.add({
          documents: [...splittedTextArray],
          metadatas: [...splittedTextArray.map(_ => { return el.metadata })],
          ids: [...splittedTextArray.map(_ => {
            return (currentId++).toString()
          })], // (el.id + 1).toString()
        })
        continue
      }

      const splittedTextArray = splitIntoChunks(el.content)
      // console.log(splittedTextArray)
      console.log(`|| Vectors adding for index : ${i} | textArray length : ${splittedTextArray.length}`)
      if (splittedTextArray.length === 0) {
        console.log(`|| Got empty splitted Text array for index : ${i}, skipping...`)
        continue
      }
      await promiseWait(Math.random() * 200)

      await collection.add({
        documents: [getCustomFormattedText(el)], // el.content
        metadatas: [el.metadata],
        ids: [(currentId++).toString()],
      })
    }
  }
}

chromaExample();