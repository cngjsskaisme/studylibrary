import { ChromaClient, DefaultEmbeddingFunction } from 'chromadb'
import fs from 'fs'

async function chromaExample() {
  const client = new ChromaClient();

  // await client.deleteCollection({ name: "Nuts_Portfolio" })
  // return

  // Check if collection 'Nuts_Portfolio' exists, create if not
  let collection;
  const embedder = new DefaultEmbeddingFunction()
  try {
    collection = await client.getCollection({
      name: 'Nuts_Portfolio',
      embeddingFunction: embedder
    });
  } catch (error) {
    collection = await client.createCollection({
      name: 'Nuts_Portfolio',
      embeddingFunction: embedder
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

  // console.log(uniqueEntries)

  // Put data into chroma with "path", "modifiedTime", "content", "vector"
  if (targetUniqueEntries.length > 0) {
    // await collection.add({
    //   documents: uniqueEntries.map(entry => entry.content),
    //   metadatas: uniqueEntries.map(entry => entry.metadata),
    //   ids: uniqueEntries.map(entry => entry.id.toString()),
    //   embeddings: uniqueEntries.map(entry => entry.vector)
    // });

    for (let i = 0; i < targetUniqueEntries.length; i++) {
      const el = targetUniqueEntries[i]
      await collection.add({
        documents: [el.content],
        metadatas: [el.metadata],
        ids: [(el.id + 1).toString()],
        // embeddings: [el.vector]
      })
      console.log("|| Vectors added done for index : " + i)
    }
    // uniqueEntries.forEach(async (el, index) => {
    //   await collection.add({
    //     documents: [el.content],
    //     metadatas: [el.metadata],
    //     ids: [(el.id + 1).toString()],
    //     // embeddings: [el.vector]
    //   })
    //   console.log("|| Vectors added done for index : " + index)
    // })
  }
}

chromaExample();