import { getSession } from '@auth0/nextjs-auth0';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    
    // 세션이 없는 경우 Auth0 로그인 페이지로 리다이렉트
    if (!session || !session.user) {
      // 현재 경로를 쿼리 파라미터로 전달하여 로그인 후 돌아올 수 있도록 함
      const returnTo = encodeURIComponent('/api/auth/nakama-auth-callback');
      return NextResponse.json(
        { error: '인증이 필요합니다', redirectUrl: `/api/auth/login?returnTo=${returnTo}` },
        { status: 401 }
      );
    }
    
    const username = session.user.name;
    const userEmail = session.user.email;

    const auth = Buffer.from(`${process.env.NAKAMA_SERVER_KEY}:`).toString('base64');
    
    const response = await fetch(`${process.env.NAKAMA_URL}/v2/account/authenticate/custom?create=true&username=${username}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({
        id: userEmail // unique한 email 사용, 이름은 겹칠 수도
      })
    });

    if (!response.ok) {
      throw new Error('인증 실패');
    }
    
    const data = await response.json();
    
    // 클라이언트에 토큰 정보 반환
    return NextResponse.json({
      success: true,
      token: data.token,
      refresh_token: data.refresh_token,
      user_id: data.user_id,
      username: data.username
    });

  } catch (error) {
    console.error('로그인 에러:', error);
    return NextResponse.json(
      { error: '인증 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}