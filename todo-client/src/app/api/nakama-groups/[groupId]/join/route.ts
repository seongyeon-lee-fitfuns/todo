import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const { groupId } = params;
    
    // 요청 헤더에서 인증 토큰 추출
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증 토큰이 필요합니다' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7); // 'Bearer ' 부분을 제거
    
    // Nakama API로 그룹 가입 요청
    const nakamaUrl = process.env.NAKAMA_URL;
    
    if (!nakamaUrl) {
      throw new Error('NAKAMA_URL 환경 변수가 설정되지 않았습니다');
    }
    
    const response = await fetch(`${nakamaUrl}/v2/group/${groupId}/join`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return NextResponse.json(
        { error: errorData?.message || '그룹 가입 요청에 실패했습니다' },
        { status: response.status }
      );
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Nakama 그룹 가입 요청 오류:', error);
    return NextResponse.json(
      { error: '그룹 가입 요청 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
} 