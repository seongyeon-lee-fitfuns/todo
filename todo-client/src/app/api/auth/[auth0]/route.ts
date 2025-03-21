import { handleAuth } from "@auth0/nextjs-auth0";

/**
 * Auth0 인증 관련 라우트 핸들러를 생성합니다.
 * 
 * 다음 엔드포인트들을 생성합니다:
 * - /api/auth/login: Auth0를 통한 로그인 수행
 * - /api/auth/logout: 사용자 로그아웃 처리
 * - /api/auth/callback: 로그인 성공 후 Auth0 리다이렉트 처리
 * - /api/auth/me: 사용자 프로필 정보 조회
 * @see https://auth0.com/docs/quickstart/webapp/nextjs/01-login
 */

export const GET = handleAuth();