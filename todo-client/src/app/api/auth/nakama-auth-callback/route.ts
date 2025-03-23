import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // 이 API는 Auth0 로그인 후 리다이렉트되는 지점
    // 인증이 완료되었으므로 클라이언트 측으로 리다이렉트하여 Nakama 로그인 시도
    return NextResponse.redirect(new URL('/login?authCompleted=true', req.url));
  } catch (error) {
    console.error('Auth 콜백 처리 중 오류:', error);
    return NextResponse.redirect(new URL('/login?error=auth_callback_failed', req.url));
  }
} 