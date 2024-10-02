const { ChromaClient } = require('chromadb');
const { ChatPromptTemplate } = require('langchain/prompts');
const { RetrievalQAChain } = require('langchain/chains');
const { GoogleGenAI } = require('langchain/google-genai');
const { GoogleGeminiEmbeddings } = require('langchain/embeddings/google-gemini'); // Hypothetical Import

const geminiEmbeddings = new GoogleGeminiEmbeddings({
  apiKey: 'your_google_gen_ai_key',
  model: 'gemini-pro',
});

const client = new ChromaClient();
await client.connect();

const collection = await client.createCollection('my_collection');

// Example documents to be embedded and stored
const docs = [
  "오늘은 정말 바쁜 하루였다. 아침에 일찍 일어나서 친구와 만나기로 한 약속을 지켰다.",
  "최근 인공지능 기술의 발전으로 많은 산업 분야에서 혁신이 일어나고 있다. 특히 자연어 처리 기술의 진보가 눈부시다.",
  "제주도는 한국에서 가장 인기 있는 관광지 중 하나다. 아름다운 해변과 푸른 자연이 매력적인 곳이다.",
  "한국의 김치는 세계적으로 유명한 발효 음식이다. 매콤하고 시원한 맛이 특징이며 다양한 요리에 활용된다.",
  "정기적인 운동과 균형 잡힌 식단은 건강을 유지하는 데 필수적이다. 매일 조금씩이라도 몸을 움직이는 습관을 들이자.",
  "온라인 학습 플랫폼의 발전으로 어디서나 다양한 지식을 접할 수 있게 되었다. 평생교육의 중요성이 점점 더 커지고 있다.",
  "지속 가능한 생활을 위해서는 일회용품 사용을 줄이고 재활용을 적극적으로 실천해야 한다.",
  "축구는 전 세계적으로 사랑받는 스포츠 중 하나다. 팀워크와 개인 기술이 조화를 이루어야 승리할 수 있다.",
  "한국의 전통 문화 중 하나인 한복은 그 아름다움으로 많은 사람들에게 사랑받고 있다. 특별한 날에 한복을 입는 것은 큰 의미가 있다.",
  "최근 글로벌 경제는 여러 도전에 직면해 있다. 변동성이 큰 시장에서 기업과 개인은 더욱 신중한 결정을 내려야 한다."
];

const embeddings = await geminiEmbeddings.embedTexts(docs);
await collection.add(docs, embeddings);

const template = `Answer the question based only on the following context:
{context}

Question: {question}
`;

const prompt = new ChatPromptTemplate({
  template,
  variables: ['context', 'question'],
});

const googleModel = new GoogleGenAI({
  apiKey: 'your_google_gen_ai_key',
  model: 'gemini-pro',
});

const chain = new RetrievalQAChain({
  retriever: async (query) => {
    const results = await collection.query(query, 5);  // Fetch 5 relevant documents
    return results;
  },
  prompt,
  model: googleModel,
});

chain.invoke({
  question: "건강을 유지하려면 어떻게 해야하나요?"
}).then(response => {
  console.log(response);  // The generated answer will be logged here
});
