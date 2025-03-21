import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // 요청 헤더에서 인증 토큰 추출
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증 토큰이 필요합니다' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7); // 'Bearer ' 부분을 제거
    
    // Nakama API에서 사용자 정보 가져오기
    const nakamaUrl = process.env.NAKAMA_URL;
    
    if (!nakamaUrl) {
      throw new Error('NAKAMA_URL 환경 변수가 설정되지 않았습니다');
    }
    
    const response = await fetch(`${nakamaUrl}/v2/account`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      // Nakama API 오류 처리
      return NextResponse.json(
        { error: '사용자 정보를 가져오는데 실패했습니다' },
        { status: response.status }
      );
    }
    
    const userData = await response.json();
    
    // 클라이언트에 필요한 형태로 데이터 변환
    return NextResponse.json({
      id: userData.user?.id,
      username: userData.user?.username,
      displayName: userData.user?.display_name,
      avatarUrl: userData.user?.avatar_url,
      createdAt: userData.user?.create_time,
      updatedAt: userData.user?.update_time,
      // 필요한 경우 다른 필드들도 추가
    });
    
  } catch (error) {
    console.error('Nakama 사용자 정보 가져오기 오류:', error);
    return NextResponse.json(
      { error: '사용자 정보 처리 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
} 