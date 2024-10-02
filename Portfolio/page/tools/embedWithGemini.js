require('dotenv').config()
const axios = require('axios');

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Access your API key as an environment variable (see our Getting Started tutorial)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function embedWithGemini({ texts }) {
  // For embeddings, use the Text Embeddings model
  const model = genAI.getGenerativeModel({ model: "text-embedding-004"});

  function textToRequest(text) {
    return { content: { /* role: "user", */ parts: [{ text }] } };
  }

  const result = await model.batchEmbedContents({
    requests: texts.map((el) => textToRequest(el))
  });
  return result.embeddings
}

module.exports = embedWithGemini;
