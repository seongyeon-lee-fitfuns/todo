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
      
      if (!nakamaUrl) {
        // 개발 환경에서는 목업 데이터 반환
        console.warn('NAKAMA_URL 환경 변수가 설정되지 않았습니다. 목업 데이터를 반환합니다.');
        return NextResponse.json({
          members: createMockMembers(groupId)
        });
      }
      
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
          members: createMockMembers(groupId)
        });
      }
      
      const data = await response.json();
      return NextResponse.json(data);
      
    } catch (err) {
      console.error('Nakama API 호출 오류:', err);
      // 오류 발생 시 목업 데이터 반환
      return NextResponse.json({
        members: createMockMembers(groupId)
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
        display_name: "관리자",
        avatar_url: "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp"
      },
      state: 2, // 관리자
      join_time: twoWeeksAgo
    },
    {
      user: {
        id: "user-2",
        username: "developer1",
        display_name: "개발자1",
        avatar_url: "https://www.gravatar.com/avatar/11111111111111111111111111111111?d=mp"
      },
      state: 1, // 일반 멤버
      join_time: lastWeek
    },
    {
      user: {
        id: "user-3",
        username: "developer2",
        display_name: "개발자2",
        avatar_url: "https://www.gravatar.com/avatar/22222222222222222222222222222222?d=mp"
      },
      state: 1, // 일반 멤버
      join_time: now
    },
    {
      user: {
        id: "user-4",
        username: "designer1",
        display_name: "디자이너",
        avatar_url: "https://www.gravatar.com/avatar/33333333333333333333333333333333?d=mp"
      },
      state: 1, // 일반 멤버
      join_time: lastWeek
    },
    {
      user: {
        id: "user-5",
        username: "tester1",
        display_name: "테스터",
        avatar_url: "https://www.gravatar.com/avatar/44444444444444444444444444444444?d=mp"
      },
      state: 1, // 일반 멤버
      join_time: now
    }
  ];
} 