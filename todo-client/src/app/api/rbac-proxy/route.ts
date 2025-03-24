import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';

export async function POST(req: NextRequest) {
  try {
    // 사용자 세션 확인
    const session = await getSession();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }
    
    // 요청 본문 및 엔드포인트 추출
    const data = await req.json();
    const endpoint = req.nextUrl.searchParams.get('endpoint');
    
    if (!endpoint) {
      return NextResponse.json(
        { error: 'endpoint 쿼리 파라미터가 필요합니다' },
        { status: 400 }
      );
    }

    // 인증 토큰 가져오기
    const authHeader = req.headers.get('authorization');
    let token;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // 'Bearer ' 제거
    } else {
      // 토큰이 헤더에 없는 경우 쿠키에서 시도
      // (실제 구현 시 세션/쿠키 관리 방식에 따라 수정 필요)
      token = session.accessToken;
    }
    
    if (!token) {
      return NextResponse.json(
        { error: '유효한 인증 토큰이 필요합니다' },
        { status: 401 }
      );
    }
    
    // Nakama RPC 엔드포인트 호출
    const nakamaUrl = process.env.NAKAMA_URL || process.env.NEXT_PUBLIC_NAKAMA_URL;
    if (!nakamaUrl) {
      throw new Error('NAKAMA_URL 환경 변수가 설정되지 않았습니다');
    }
    
    const response = await fetch(`${nakamaUrl}/v2/rpc/${endpoint}?unwrap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMessage = errorData?.message || `Nakama 서버 요청 실패: ${response.status}`;
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }
    
    const result = await response.json();
    
    // RPC 응답 처리
    if (!result || result.error) {
      return NextResponse.json(
        { error: result?.error || '서버 응답 오류' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('RBAC 프록시 처리 중 오류:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다' },
      { status: 500 }
    );
  }
} 