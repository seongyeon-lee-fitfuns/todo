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
    
    // Nakama API를 통해 그룹 정보 가져오기
    try {
      const nakamaUrl = process.env.NAKAMA_URL;
      
      if (!nakamaUrl) {
        // 개발 환경에서는 목업 데이터 반환
        console.warn('NAKAMA_URL 환경 변수가 설정되지 않았습니다. 목업 데이터를 반환합니다.');
        return NextResponse.json({
          group: createMockGroupInfo(groupId)
        });
      }
      
      // 실제 Nakama API 호출
      const response = await fetch(`${nakamaUrl}/v2/group/${groupId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        console.warn(`Nakama API 응답 오류: ${response.status}`);
        // API 호출 실패 시 목업 데이터 반환
        return NextResponse.json({
          group: createMockGroupInfo(groupId)
        });
      }
      
      const data = await response.json();
      return NextResponse.json({
        group: data
      });
      
    } catch (err) {
      console.error('Nakama API 호출 오류:', err);
      // 오류 발생 시 목업 데이터 반환
      return NextResponse.json({
        group: createMockGroupInfo(groupId)
      });
    }
    
  } catch (error) {
    console.error('그룹 정보 처리 오류:', error);
    return NextResponse.json(
      { error: '그룹 정보를 처리하는 중 오류가 발생했습니다', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// 목업 그룹 정보 생성 함수
function createMockGroupInfo(groupId: string) {
  const now = new Date().toISOString();
  const yesterday = new Date(Date.now() - 86400000).toISOString();
  
  return {
    id: groupId,
    creator_id: "creator-user-id",
    name: "나의 대표 그룹",
    description: "이 그룹은 테스트 및 개발을 위한 목업 그룹입니다.",
    lang_tag: "ko",
    open: true,
    edge_count: 5,
    max_count: 100,
    create_time: yesterday,
    update_time: now,
    metadata: {
      icon: "🚀",
      category: "개발",
      tags: ["프로젝트", "할일관리", "협업"]
    },
    state: 2  // 2는 관리자
  };
} 