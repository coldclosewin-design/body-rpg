/* 로그인 없이 화면을 확인하기 위한 로컬 저장 모드 개발 서버.
 * .env.local 을 읽지 않도록 envDir 을 이 폴더로 돌려 Supabase 설정 없이 띄운다 (포트 5174).
 * 5173 과 출처가 달라 브라우저 저장 데이터가 서로 섞이지 않는다. */
import path from 'node:path'
import { createServer } from 'vite'

const server = await createServer({
  envDir: path.resolve(import.meta.dirname),
  server: { port: 5174, strictPort: true },
})
await server.listen()
server.printUrls()
