import { ChromaClient, DefaultEmbeddingFunction } from 'chromadb';

async function chromaExample() {
  const client = new ChromaClient();
  const embedder = new DefaultEmbeddingFunction()
  const collection = await client.getCollection({
    name: 'Nuts_Portfolio',
    embeddingFunction: embedder
  });

  let results = await collection.query({
    queryTexts: ["지금까지 배운 것들을 총정리"],
    nResults: 10,
  });

  delete results.documents

  console.log(JSON.stringify(results, null, 4))
}
chromaExample();