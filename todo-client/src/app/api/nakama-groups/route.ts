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
    const searchParams = req.nextUrl.searchParams;
    const name = searchParams.get('name') || '';
    const limit = parseInt(searchParams.get('limit') || '10');
    const cursor = searchParams.get('cursor') || '';
    
    // Nakama API에서 그룹 목록 가져오기
    const nakamaUrl = process.env.NAKAMA_URL;
    
    if (!nakamaUrl) {
      throw new Error('NAKAMA_URL 환경 변수가 설정되지 않았습니다');
    }
    
    let url = `${nakamaUrl}/v2/group?limit=${limit}`;
    if (name) url += `&name=${encodeURIComponent(name)}`;
    if (cursor) url += `&cursor=${cursor}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { error: '그룹 목록을 가져오는데 실패했습니다' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Nakama 그룹 목록 가져오기 오류:', error);
    return NextResponse.json(
      { error: '그룹 목록 처리 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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
    const body = await req.json();
    
    // 필수 필드 검증
    if (!body.name) {
      return NextResponse.json(
        { error: '그룹 이름은 필수 항목입니다' },
        { status: 400 }
      );
    }
    
    // Nakama API로 그룹 생성 요청
    const nakamaUrl = process.env.NAKAMA_URL;
    
    if (!nakamaUrl) {
      throw new Error('NAKAMA_URL 환경 변수가 설정되지 않았습니다');
    }
    
    const response = await fetch(`${nakamaUrl}/v2/group`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: body.name,
        description: body.description || '',
        lang_tag: body.langTag || 'ko',
        open: body.open !== undefined ? body.open : true,
        max_count: body.maxCount || 100
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return NextResponse.json(
        { error: errorData?.message || '그룹 생성에 실패했습니다' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Nakama 그룹 생성 오류:', error);
    return NextResponse.json(
      { error: '그룹 생성 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
} 