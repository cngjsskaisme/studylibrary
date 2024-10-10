import { ChromaClient, DefaultEmbeddingFunction } from 'chromadb'
import { configDotenv } from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai"
import embedder from './tools/embedders.js';
import chardet from 'chardet'

configDotenv()

import { createInterface } from 'node:readline';
import { stdin as input, stdout as output } from 'node:process';

function promiseWait (amountOfMillis) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(true)
    }, amountOfMillis)
  })
}

// Function to ask a question asynchronously
async function askQuestion(query) {
  const rl = createInterface({ input, output });

  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer);
      rl.close();
    });
  });
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

function stringToUint8Array(str) {
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    bytes[i] = str.charCodeAt(i);  // Extract the char code and store it in the array
  }
  return bytes;
}

const tempPrompt = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY; // Replace with your actual API key

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  
  const requestData = {
    contents: [{
      parts: [{ text: prompt }]
    }]
  };
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Accept': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Success:', data);
    return data;  // Return the data if you need to use it outside
  } catch (error) {
    console.error('Error:', error);
  }
 
}

const formatDBQueryPrompt = (targetPrompt, error = { isError: false, errorContext: ""}) => {
  if (error.isError) {
    return `
Let's say I'm going to ask this following question:
${targetPrompt}

then please write me a proper chroma query JSON object for this question. (No extra description but JSON strings only. Do not format nor indent, put it in a single line.)
! Please put queryTexts, not queryText.
${/*! Please let query text as empty, I'll do it myself.*/""}
! Please make each key as a camelcase, in order to use it in javascript.

Note: This chroma db has a metadata of:
modifiedTime (which means learnedTime),
path (which means a learnedTItle)

But this time, previously you just attempted to search, but It got a following error message:
${error.errorContext}

Please do it with fixed JSON object for this question.
(No extra description but JSON strings only. Do not format nor indent, put it in a single line.)
`
  }
  return `
Let's say I'm going to ask this following question:
${targetPrompt}

then please write me a proper chroma query JSON object for this question. (No extra description but JSON strings only. Do not format nor indent, put it in a single line.)
! Please put queryTexts, not queryText.
${/*! Please let query text as empty, I'll do it myself.*/""}
! Please make each key as a camelcase, in order to use it in javascript.

Note: This chroma db has a metadata of:
modifiedTime (which means learnedTime),
path (which means a learnedTItle)
`
}

const formatAskPrompt = ({ DBQueryResult, queryText }) => {
return `
You're 추헌남, who is explaining yourself to interviewers.
From this informations, please answer the question in Korean.
If needed, please input markdown for proper language.

[Resume Markdown]
# 자기소개
추헌남
1995년 7월 15일생
3년차 프론트엔드 개발자
한양대학교 정보시스템학과
cngjsskaisme@gmail.com
전 회사 케이스마텍
현재 LG CNS 재직중
정보처리기사, 정보기기운용기능사 취득
TOEIC 960점

# 경험 정리
## AI 스마트 스피커 연동 일기장 앱 개발
### 사용 Stack
- Frontend: **React Native**
- Backend: MongoDB, Flask, Tensorflow, KoNLP
- 기타
    - Documentation: **Latex**
### 프로젝트 범위
1. 프로젝트 설계서 작성 (김창희)
    - Overleaf로 latex 스타일 프로젝트 설계서 작성
    - 기능 요구사항 정의
    - 화면설계서 정의 (추헌남)
    - 개발 환경 정의
    - 인터페이스 설계서 정의 (추헌남)
2. 감성 문장 데이터 수집 / 정제 / 학습 (김택준, 전현국)
    - 수집
        - 네이버 영화 리뷰글을 긍정 / 부정 (0 / 1)로 분류한 20만개의 데이터셋을 수집함
    - 정제
        - konlpy 형태소 분석 및 tokenizing 하여 데이터를 저장하고, 벡터화를 위해 기준이 되는 단어 list를 만들어낸다. (빈도수 기준) 이후 학습 목표 대상인 문장들을 벡터화 한다.
        - ex. 학습 데이터에서,
        selected_word = ['좋다', '나쁘다'] 이고,
        train_target = [[['연기', '좋다'], 0], [['연기', '나쁘다'], 1]]이면,
        train_x= [[1, 0], [0, 1]]이게 되고,
        (train_x에서 각 항목에서 첫번째 요소는 selected_word에 있는 index, 두번째는 긍정 / 부정 값)
        train_y= [1, 0]이다.
    - 학습 - Sequential로 모델을 만들고, output layer인 마지막층에는 활성화 함수 중 이진 분류에 사용하는 sigmoid 함수, 나머지 층인 hidden layer (학습 계층 / 블랙박스)에서는 주로 사용되는 활성화 함수인 relu 함수를 사용하였다.
3. DB 설계 및 구현 (김창희)
    - MongoDB로 사용자별 일기 데이터 Collection 생성
    - 각 사용자별로 일기 Document를 Batch로 특정 시간에 AI 분석하도록 구현
4. SKT NUGU 음성 명령 분석 결과 기반 제공 서비스 설계 구현 (김창희)
    - SKT NUGU 서비스에 NUGUMate Intent를 정의하고, 해당 Intent에 대한 예상 발화 입력
    - SKT NUGU 서비스를 통해 분석한 Intent 값을 바탕으로 해당 서비스 호출하도록 구현
5. NUGUMate 어플리케이션 설계 / 구현 (추헌남)
    - React Native로 프론트엔드 구현
    - 잠금 화면 설계
    - 달력 컴포넌트 설계
    - 일기 입력화면 설계
    - 일기 수정화면 설계
    - 설정 화면 설계
6. 구축 보고 (추헌남, 김창희)
    - 서비스 소개 
    - 시연
    - 발생될 수 있는 문제와 해결 방안 설명

### 실제 수행한 Part. Task
- 브레인스토밍으로 프로젝트 방향 제시
- 업무 분장 및 일정 계획 수립
- 프로젝트 설계서 中 인터페이스 설계서 작성
    - 프론트 - 백엔드 - DB 간 API 설계 (일기 저장, 일기 삭제, 사용자 등록 등)
    - AI 학습 서버 - DB 간 API 설계 (개인 사용자별 일기 취합 및 sentiment 값 전달)
- 화면 설계 (React-Native)
    - 범용성 고려 cross-platform 언어로 구현
    - React Class 방식을 활용하는 버전으로 구현
- 구축 완료 보고(발표 자료 제작 및 앱 시연)
### 결과물
https://github.com/cngjsskaisme/NUGUMate



## 한양대학교 교환학생용 커뮤니티앱 HYC (HANYANG EXCHANGE)
### 사용 Stack
- Frontend: **React Native**
- Backend: NodeJS, MongoDB, AWS
### 프로젝트 범위 (2019-08-21 ~ 2019-12-04)
- 역할 분배
- 화면 설계서 정의
- 필요 기능 정의
- 게시판, DB 구조 설계
- 학사 일정 및 학교 게시판 Crawler 설계
- Frontend 개발
- Backend 개발
- 작업 결과 보고
### 프로젝트 진행표 (2019-09-01 ~ 2019-12-19)
### 실제 수행한 Part. Task
- 화면 설계서 정의
- 필요 기능 정의
- Frontend 개발
    - 게시판, 강의평가, 메인화면
- Backend API 연동 테스팅
- 작업 결과 보고 (3등 했다던가?)
    - PPT 작성, 포스터 작성, 보고서 작성

### 결과물
https://github.com/cngjsskaisme/exchange-react-native




## 블록체인 기반 공증 서비스 (NotaChain)
### 사용 Stack
- Frontend: Flutter, Dart
- Backend: Solidity
### 프로젝트 범위 (2020-10-01~ 2020-12-02)
- 역할 분배
- 화면 설계서 정의
- 필요 기능 정의
- Solidity SmartContract 함수 설계
- 작업 결과 보고
### 프로젝트 진행표
### 실제 수행한 Part. Task
- 전반적인 PM
- 화면 설계서 정의
- 필요 기능 정의
- Solidity SmartContract 함수 설계
    - writeRecord, getRecord, checkExistence 함수 구현
- 작업 결과 보고 (PPT, 보고서)
### 결과물
https://github.com/punreachrany/DApp-Notorization




## 유머 AI 자동 분류 사이트 SOLA
### 사용 Stack
- Frontend: **Javascript**
- Backend: **Django**, **Flask**, **Tensorflow**, **Keras**, **KoNLP**, **BeautifulSoup4**
### 프로젝트 범위 (2020-10-01 ~ 2022-01-20<임시 개발 중단>)
- 사이트 화면 디자인 정의
- 커뮤니티 데이터 수집
- DB 모델 설계 및 학습
  - BeautifulSoup4로 커뮤니티 사이트 제목 약 20만건 수집, 미리 분류된 게시판 성격 정보는 제목에 포함, 정답 종류는 사전 정의한 약 80건의 키워드로 구분
  - 전처리    
    - konlpy 형태소 분석 및 tokenizing 하여 데이터를 저장하고, 벡터화를 위해 기준이 되는 단어 list를 만들어낸다. (빈도수 기준) 이후 학습 목표 대상인 문장들을 벡터화 한다.
    - 관련 코드 https://github.com/cngjsskaisme/sola_crawlserver/blob/main/devel/SleepyCat.py
  - 학습
- Django ORM DB 구조 설계
- Frontend 설계
- VPS 내부에서 Cronjob 활용하여 각 커뮤니티 게시글 주기적 Crawling, AI 자동 분류 설계 및 구현
- 사이트 유지보수
### 실제 수행한 Part. Task
상동
### 결과물
코드 / 사이트 소실되었으나 인터넷 타임머신에서 일부 복구, 디자인 가다듬어서 첨부 예정




## 케이스마텍 휴가체계 'K-Connect'
### 사용 Stack
- Frontend: **Javascript**, **JQuery**, **HTML**, **CSS**
### 프로젝트 범위
- 개발기획 회의
- 프론트엔드 / 백엔드 개발
- 인수인계용 Documentation 문서 작성
### 프로젝트 진행표 (2021-03-22 ~ 2021-08-05)
### 실제 수행한 Part. Task
- 개발기획 회의
    - 주기능 / 부기능 정의 및 분류
    - 필요 API 및 Specification 협의 및 설계
- 프론트엔드 개발
    - 로그인 / 사원 관리 / 조직 관리 / 연차 관리 기능 기본 기능 개발
    - 모바일 버전 개발
- 인수인계용 Documentation 문서 작성
    - 프로젝트 공통 구조 및 함수 Documentation 작성
### 결과물
https://kconnect.ksmartech.com/




## Whitebox Cryptography 기반 Trusted App (Blockchain Wallet) 연구 프로젝트
### 사용 Stack
- Language: **C**
- API: **Trustonic C API**, **Trezor Wallet API**
### 프로젝트 범위
- JAVA Web3 코드 분석
- Mnemonic 코드 생성 규격 (BIP39) C로 변환
- Trezor 코드 기반으로 TAP에서 제공하는 API를 활용하여 TA 전환
    - 전환 대상
        - BIP39 (Mnemonic Code Generation) - Trezor-crypto 모듈을 활용한 생성
        - base32
        - bignum 및 연산
        - Elliptic Curve
        - 서명 관련 코드
        - hdWallet 지갑 구조체 내부 필요 함수
### 프로젝트 진행표 (2021-11-15 ~ 2021-12-29)
### 실제 수행한 Part. Task
- JAVA Web3 코드 분석
- Mnemonic 코드 생성 규격 (BIP39) C로 변환
- Trezor 코드 기반으로 TAP에서 제공하는 API를 활용하여 TA 전환
    - 전환 대상
        - BIP39 (Mnemonic Code Generation)
        - base32
        - bignum 및 연산
        - Elliptic Curve
        - 서명 관련 코드
        - hdWallet 지갑 구조체 내부 필요 함수
### 결과물




## KIA MyKia 앱 개발
### 사용 Stack
- Frontend: **URACLE Morpheus**, **JQuery**
- 기타:
    - 지도: **현대 Routo Map API**
### 프로젝트 범위
1. 개발기획 회의
2. AS-IS 코드 구조 분석
3. 현대 Routo 지도 API 기능 분석 및 성능 테스트
4. 화면 및 기능 구현
5. 인수인계용 Documentation 문서 작성
### 프로젝트 진행표 (2021.12.24 ~ 2022.6.10)
### 실제 수행한 Part. Task
1. AS-IS 코드 구조 분석
2. 현대 Routo 지도 API 기능 분석 및 성능 테스트
    - 사용자 정의 마커 및 100개 이상의 마커 동시 출력 시 성능 테스트
    - 장소 API 정상 동작 테스트
    - 마커 클러스터러 정상 동작 테스트
    - 길찾기 API 정상 동작 테스트
3. 화면 및 기능 구현
    - 공통 기능 구현
        - Bottom Navigation 객체 구현
            - 메뉴 버튼 클릭 시 화면 전환 기능 구현
            - 메뉴 버튼 클릭 과정에서 발생하는 작업들에 대한 라이프사이클 정의
            - 해당 프로세스에 대한 Documentation 작성 및 공유로 협업 원활화
        - Morpheus API 활용하여 GPS 조회 공통 함수 구현
        - Routo API 활용하여 Reverse Geocoding 함수 구현
        - 정비 검색 공통 인터페이스 함수 구현
            - 공통 Routo 지도 API (내 위치 조회, 마커 클러스터링, 거리 계산, 정비소 마커 생성, 커스텀 마커 설정)
            - 정비소 상세 공통 API
            - 정비소 예약 공통 API
        - 정비 예약 공통 인터페이스 함수 구현
        - Morpheus http Wrapping API 공통 함수 구현
            - MyKia Backend 요청용 Promise 함수
            - 로컬 개발용 Mockup API 객체 및 Wrapping API 에서 mock 옵션 구현
        - 성능 최적화를 위한 일부 외부 API 요청에 대해서 Memoize 작업
    - Morpheus http Wrapping API 활용, 구현 페이지의 MyKia 내부 - 외부 Kia API 서버 연동
    - 페이지 구현
        - 리뉴얼 불필요 AS-IS 페이지 유지 (100%)
            - 공지사항 페이지, 고객센터 페이지
        - 전체메뉴, 미로그인 홈, 마이페이지, 설정, 내 차 관리, 인사이트 메뉴
        - 정비 메뉴
        - 정비 예약 메뉴
4. 인수인계용 Documentation 문서 작성
    - 공통 함수 Documentation
    - Bottom Navigation Documentation
### 결과물
- 스크린샷 있음
- 앱 링크 걸기
    - https://apps.apple.com/kr/app/mykia/id1439546962
    - https://play.google.com/store/apps/details?id=com.kia.red
    - https://www.hyundai.co.kr/news/CONT0000000000033514





## KSmartech CloudKey 개발
### 사용 Stack
- Frontend: **Vue.js**, **Vuex**, **Chart.js**
- Backend: **Nuxt.js**, **Express.js**, **gRPC**
- 기타
    - 하위호환: **Babel**, **Polyfill.js**
    - Query: **ElasticSearch Query DSL**
    - 암호화: **HSM gRPC**, **bcrypt.js**
### 프로젝트 범위
1. 프로젝트 설계서 작성 (김기영 이사님, 송혜은 과장님)
2. PKCS#11 표준을 기반으로 하는 HSM gRPC 인터페이스 서버 개발 (김기영 이사님)
3. KMS gRPC 인터페이스 서버 개발 (안준철 팀장님)
4. 인증서 발급 서버 개발 (조희찬 대리님)
5. 웹페이지 퍼블리싱 (외주)
6. 기관 / 사용자 / 프로젝트 / 시스템 관리자 DB 설계 (문지원, 추헌남)
7. gRPC 중개 WEB Backend 서버 개발 (추헌남)
8. 기관 / 사용자 / 프로젝트 / 통계 관리 Backend 서버 개발 (추헌남)
9. HSM / KMS Web Console Frontend SSR 서버 개발 (추헌남)
10. 시스템 관리자 WEB Backend 서버 개발 (추헌남)
11. 시스템 관리자 WEB Console Frontend SSR 서버 개발 (추헌남)
12. CSAP 인증 작업 (프론트 쪽 작업 - 문지원, 유주현, 추헌남)
13. CSAP 인증 후 HSM / KMS 멀티 토큰 기능 추가 리뉴얼

### 프로젝트 진행표 (2022.06.09 ~ 2023.03.27 <진행중>)

### 실제 수행한 Part. Task
- 기관 / 사용자 / 프로젝트 / 시스템 관리자 DB 설계
- gRPC 중개 WEB Backend 서버 개발
    - HSM / KMS
        - HSM / KMS 토큰 관리 중개 API 개발
        - HSM / KMS 키 관리 중개 API 개발
- 기관 / 사용자 / 프로젝트 / 통계 관리 Backend 서버 개발 
    - 기관 관리 / 사용자 관리 / 프로젝트 관리 API 개발
    - 통계 관리: HSM / KMS 사용량 통계 API 개발
- HSM / KMS Web Console Frontend SSR 개발
- 시스템 관리자 WEB Backend 서버 개발
    - 관리자용 기관 API 개발
- 시스템 관리자 Frontend SSR 개발
- CSAP 인증 작업
  - 외부 소스코드 점검 도구를 통한 CVE 대응 (Sparrow 社 SAST)
  - JWT 토큰 발급 체계 및 검증 체계 Express Middleware 작성
  - 각 테이블별 민감 개인정보 DB 암호화 작업 (API 방식 암호화)
  - NodeJS 및 MySQL DB 버전으로 인한 변경 API 대응 작업
  - CSAP 인증 후 HSM / KMS 멀티 토큰 기능 추가 리뉴얼
### 결과물
조만간 스크린샷 찍을 예정 (MultiToken 버전으로)

[DB Query Result (In case you need to find, use it if it is needed.)]
${JSON.stringify(DBQueryResult, null, 2)}

[Additional Conditions]
1. If the user asks me about career, then print it in this way:
이력(회사, 프로젝트) / 기술스택(분야  언어별)를 표로 작성
2. And please, NEVER TALK ABOUT NEGATIVE, OR CRITICAL WAY.
3. And also Please don't answer that the user didn't ask. ONLY ANSWER what user did ask.

[Question]
${queryText}
`
}

async function getRelevantPassage(query, db, nResults, options) {
  let results = null
  if (options) {
    results = await db.query(options);
  } else {
    results = await db.query({ queryTexts: [query], nResults: nResults });
  }

  const resultObjects = []

  results.ids[0].forEach((element, i) => {
    if (!resultObjects[i]) { resultObjects[i] = {} }
    resultObjects[i].id = element
  })
  results.distances[0].forEach((element, i) => {
    if (!resultObjects[i]) { resultObjects[i] = {} }
    resultObjects[i].distance = element
  })
  results.metadatas[0].forEach((element, i) => {
    if (!resultObjects[i]) { resultObjects[i] = {} }
    resultObjects[i].metadata = element
  })
  results.documents[0].forEach((element, i) => {
    if (!resultObjects[i]) { resultObjects[i] = {} }
    resultObjects[i].document = element
  })
  // Extract the first element of each document
  return resultObjects;
}

async function chromaExample() {
  const client = new ChromaClient();

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

  const targetPrompt = await askQuestion("> ");

  let gptAnswer = await model.generateContent([formatDBQueryPrompt(targetPrompt)]);

  let searchOptions = null
  let result = null
  let stackedErrorMessages = []
  let errorCount = 0

  while (true) {
    try {
      searchOptions = JSON.parse(gptAnswer.response.text().replace('```json', '').replace('```', ''))
      searchOptions.queryEmbeddings && delete searchOptions.queryEmbeddings
      result = await getRelevantPassage(targetPrompt, collection, 5, searchOptions)
      console.log(searchOptions, result)
      break;
    } catch (e) {
      errorCount++
      if (errorCount > 2) {
        console.log(`Error limit exceeded. Falling back to default query...`)
        result = await getRelevantPassage(targetPrompt, collection, 5)
        break;
      }
      await promiseWait(2000)
      stackedErrorMessages.unshift(e.toString())
      // console.log(formatPrompt(targetPrompt, { isError: true, errorContext: stackedErrorMessages.join("\n")}))
      gptAnswer = await model.generateContent([formatDBQueryPrompt(targetPrompt, { isError: true, errorContext: stackedErrorMessages.join("\n")})]);
      // console.log("GOT ERROR ON PARSING OPTIONS!!! Info: " + e.toString())
      // console.log("retrying...")
    }
  }

  result = result.map((el) => {
    delete el.id
    delete el.distance
    return el
  })

  console.log(JSON.stringify(result, null, 2))

  // console.log(formatAskPrompt({ DBQueryResult: result, queryText: targetPrompt }))
  const finalAnswerQuestion = await model.generateContent([formatAskPrompt({ DBQueryResult: result, queryText: targetPrompt })])
  console.log(finalAnswerQuestion.response.text())
}

while (true) {
  try {
    await chromaExample();
  } catch (e) {
    console.error(e)
  }
}