`@vitejs/plugin-legacy`는 Vite 프로젝트에서 **구형 브라우저**에 대한 호환성을 제공하는 공식 플러그인입니다. 이 플러그인은 최신 JavaScript 기능을 지원하지 않는 오래된 브라우저(예: Internet Explorer 11)에서도 Vite로 작성된 애플리케이션을 사용할 수 있도록 **폴리필(polyfills)**과 **트랜스파일링(transpiling)** 작업을 추가로 수행해 줍니다.

Vite는 기본적으로 최신 브라우저를 목표로 빌드되며, 이러한 최신 브라우저는 대부분의 최신 JavaScript 기능을 기본적으로 지원합니다. 하지만, 오래된 브라우저는 이러한 기능을 지원하지 않기 때문에 추가적인 변환이 필요합니다. `@vitejs/plugin-legacy`는 이러한 요구를 충족시키기 위해 설계되었습니다.

### 동작 방식

1. **ESM(모듈) 및 구형 브라우저 스크립트 분리**:
   - Vite는 최신 브라우저에서는 `ESM(ES Modules)`을 사용하고, 구형 브라우저에서는 일반 스크립트를 사용할 수 있도록 **이중 빌드**를 생성합니다.
   - 구형 브라우저는 ESM을 지원하지 않기 때문에, ESM을 지원하지 않는 브라우저를 위해 추가적으로 번들된 스크립트를 생성하고, `<script nomodule>` 태그를 통해 구형 브라우저에서 로드할 수 있도록 설정합니다.

2. **폴리필 추가**:
   - Vite는 기본적으로 최신 기능을 사용하지만, `@vitejs/plugin-legacy`는 구형 브라우저에서 지원되지 않는 기능에 대해 **필요한 폴리필**을 자동으로 추가합니다.
   - 예를 들어, `Promise`, `Object.assign`, `Array.prototype.includes`와 같은 기능들이 구형 브라우저에서 지원되지 않는다면, 그에 맞는 폴리필이 포함됩니다.

3. **트랜스파일링(바벨 사용)**:
   - 이 플러그인은 Babel을 사용하여 최신 JavaScript 문법을 구형 브라우저가 이해할 수 있는 버전으로 변환합니다.
   - 예를 들어, ES6의 `arrow function`, `class`, `let/const` 같은 구문을 ES5 스타일의 코드로 변환하여 Internet Explorer와 같은 브라우저에서도 실행될 수 있게 만듭니다.

4. **자동으로 필요한 변환 적용**:
   - 플러그인은 `targets` 설정에 따라 특정 브라우저들에 맞춰 어떤 폴리필과 트랜스파일링을 적용할지 자동으로 결정합니다. 브라우저 타겟은 Vite 설정 파일에서 사용자 정의할 수 있습니다.

### 설정 방법

`@vitejs/plugin-legacy`를 사용하려면 Vite 설정 파일(`vite.config.js`)에 플러그인을 추가하면 됩니다.

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import legacy from '@vitejs/plugin-legacy'

export default defineConfig({
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11']
    })
  ]
})
```

위 예제에서는 `defaults`와 `not IE 11`이라는 브라우저 타겟을 설정했습니다. 이 설정은 다음과 같은 방식으로 동작합니다:

- **defaults**: 일반적으로 사용되는 최신 브라우저들을 타겟으로 설정합니다. 이는 Babel의 기본 설정을 따릅니다.
- **not IE 11**: Internet Explorer 11을 제외합니다. 필요하다면 이 설정을 변경하여 IE 11과 같은 구형 브라우저도 지원할 수 있습니다.

### 주요 설정 옵션

- `targets`: 폴리필과 트랜스파일링을 적용할 브라우저 타겟을 지정합니다. 예: `['> 1%', 'last 2 versions', 'not dead']`. 이는 **Browserslist** 형식을 따릅니다.
- `polyfills`: 기본적으로는 필요한 폴리필을 자동으로 추가하지만, 특정 폴리필을 명시적으로 추가하거나 제외할 수 있습니다.
- `modernPolyfills`: 최신 브라우저에도 폴리필이 필요할 경우, 이를 적용할지 설정합니다. 기본값은 `false`입니다.

### 사용 예시

만약 여러분의 프로젝트가 최신 브라우저만을 대상으로 하지 않고, 여전히 **구형 브라우저**(예: Internet Explorer 11)를 지원해야 한다면, `@vitejs/plugin-legacy`는 Vite 프로젝트에 필수적인 플러그인입니다. 이를 통해 최신 자바스크립트 기능을 사용하면서도 구형 브라우저와의 호환성을 유지할 수 있습니다.

### 요약
`@vitejs/plugin-legacy`는 Vite를 통해 빌드된 웹 애플리케이션이 구형 브라우저에서 호환되도록 폴리필과 트랜스파일링을 추가하여, 최신 JavaScript 기능을 지원하지 않는 브라우저에서도 애플리케이션이 원활하게 동작할 수 있도록 돕는 플러그인입니다. 이를 통해 최신 브라우저와 구형 브라우저 모두에서 안정적인 웹 애플리케이션을 제공할 수 있습니다.