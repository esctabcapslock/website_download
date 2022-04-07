# 웹 사이트 다운로드하기 (2022.04.07 7+1시간)

- 웹 사이트를 통째로 다운로드하는 솔루션(?)을 구축한다.

## 설명

1. 큐에서 웹 주소를 꺼내서 그 페이지를 크롤링한뒤 저장한다.
2. html, css, js 문서라면 href, src 속성의 주소를을 읽어 큐에 넣는다
3. 1을 반복한다.

### 시작에
- start.json을 넣어야 한다. 다음처럼
```json
{
    "host":"github.com",
    "startpath":"/esctabcapslock",
    "ignore":[
        "/^(?!esctabcapslock)/"
    ]
}
```

- host에는 원하는 사이트명이 들어감. (다중 사이트 추후 지원...)
- startpath에는 시작을 원하는 사이트
- ignore은 원하지 않는 주소 필터 (정규표현식 문법 따름)이다.
- 로그인이 필요한 사이트의 경우, 쿠키 자동경신을 하기 위해 [./module/update_cookies.ts](./module/update_cookies.ts) 내부의 `update_cookies`함수를 호출한다. 적당히 수정하자
- DoS 공격의 우려가 있으니 트래픽이 적은 영세 사이트에는 적당히 하자
- `web/main.js`를 실행하고 localhost로 접속하면 사이트를 내 컴퓨터에서 실행할 수 있다.

## Typescript 설정

- `tsc --init` 통해 `tsconfig.json` 설정
- [이거](https://stackoverflow.com/questions/43048113/use-fs-in-typescript) 통해서 타입스크립트 초기 설정함