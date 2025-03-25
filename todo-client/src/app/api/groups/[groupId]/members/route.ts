import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const { groupId } = params;
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증 토큰이 필요합니다' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7);
    
    // 쿼리 파라미터 처리
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const state = searchParams.get('state'); // 특정 상태의 멤버만 가져오기 위한 필터
    const cursor = searchParams.get('cursor');
    
    // Nakama API를 통해 그룹 멤버 목록 가져오기
    try {
      const nakamaUrl = process.env.NAKAMA_URL;

      // API 엔드포인트 구성
      let apiUrl = `${nakamaUrl}/v2/group/${groupId}/user?limit=${limit}`;
      if (state) apiUrl += `&state=${state}`;
      if (cursor) apiUrl += `&cursor=${encodeURIComponent(cursor)}`;
      
      // 실제 Nakama API 호출
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        console.warn(`Nakama API 응답 오류: ${response.status}`);
        // API 호출 실패 시 목업 데이터 반환
        return NextResponse.json({
          group_users: createMockMembers(groupId)
        });
      }
      
      const data = await response.json();
      return NextResponse.json(data);
      
    } catch (err) {
      console.error('Nakama API 호출 오류:', err);
      // 오류 발생 시 목업 데이터 반환
      return NextResponse.json({
        group_users: createMockMembers(groupId)
      });
    }
    
  } catch (error) {
    console.error('그룹 멤버 목록 처리 오류:', error);
    return NextResponse.json(
      { error: '그룹 멤버 목록을 처리하는 중 오류가 발생했습니다', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// 목업 그룹 멤버 생성 함수
function createMockMembers(groupId: string) {
  const now = new Date().toISOString();
  const lastWeek = new Date(Date.now() - 7 * 86400000).toISOString();
  const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString();
  
  return [
    {
      user: {
        id: "user-1",
        username: "admin_user",
        lang_tag: "ko",
        metadata: "{}",
        edge_count: 3,
        create_time: twoWeeksAgo,
        update_time: now
      },
      state: 2 // 관리자
    },
    {
      user: {
        id: "user-2",
        username: "developer1",
        lang_tag: "ko",
        metadata: "{}",
        edge_count: 1,
        create_time: lastWeek,
        update_time: lastWeek
      },
      state: 1 // 일반 멤버
    },
    {
      user: {
        id: "user-3",
        username: "developer2",
        lang_tag: "ko",
        metadata: "{}",
        create_time: now,
        update_time: now
      },
      state: 1 // 일반 멤버
    },
    {
      user: {
        id: "user-4",
        username: "designer1",
        lang_tag: "ko",
        metadata: "{}",
        create_time: lastWeek,
        update_time: lastWeek
      },
      state: 1 // 일반 멤버
    },
    {
      user: {
        id: "user-5",
        username: "tester1",
        lang_tag: "ko",
        metadata: "{}",
        create_time: now,
        update_time: now
      },
      state: 1 // 일반 멤버
    }
  ];
} 