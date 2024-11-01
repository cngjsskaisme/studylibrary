import { DefaultEmbeddingFunction, GoogleGenerativeAiEmbeddingFunction } from 'chromadb'
import { configDotenv } from 'dotenv'

configDotenv()

const embedder = {
  default: () => { return new DefaultEmbeddingFunction() },
  gemini: () => { return new GoogleGenerativeAiEmbeddingFunction({ googleApiKey: process.env.GEMINI_API_KEY }) },
}

export default embedder