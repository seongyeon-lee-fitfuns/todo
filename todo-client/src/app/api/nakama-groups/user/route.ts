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
    
    // Nakama API에서 사용자 그룹 목록 가져오기
    const nakamaUrl = process.env.NAKAMA_URL;
    
    if (!nakamaUrl) {
      throw new Error('NAKAMA_URL 환경 변수가 설정되지 않았습니다');
    }
    const user = await fetch(`${nakamaUrl}/v2/account`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const userData = await user.json();
    const userId = userData.user.id;
    console.log('userId: in server', userId);
    
    // 올바른 엔드포인트 사용 (사용자 그룹 목록: /v2/account/groups)
    const response = await fetch(`${nakamaUrl}/v2/user/${userId}/group`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => '응답 텍스트를 읽을 수 없음');
      console.error('Nakama API 응답 오류:', {
        status: response.status,
        statusText: response.statusText,
        errorText
      });
      
      return NextResponse.json(
        { error: '사용자 그룹 목록을 가져오는데 실패했습니다', details: errorText },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log('사용자 그룹 데이터:', JSON.stringify(data));
    
    // Nakama API 응답 구조 확인
    if (!data.groups && Array.isArray(data.user_groups)) {
      // user_groups 형식으로 응답이 왔을 경우
      return NextResponse.json({
        groups: data.user_groups
      });
    }
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Nakama 사용자 그룹 목록 가져오기 오류:', error);
    return NextResponse.json(
      { error: '사용자 그룹 목록 처리 중 오류가 발생했습니다', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 