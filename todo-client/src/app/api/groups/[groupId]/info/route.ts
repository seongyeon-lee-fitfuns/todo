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
    
    // Nakama API를 통해 그룹 정보 가져오기
    try {   
      // 실제 Nakama API 호출
      const response = await fetch(`${process.env.NAKAMA_SERVER_URL}/v2/console/group/${groupId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from("admin:password").toString('base64')}`
        }
      });
      console.log("group info", response);
      
      if (!response.ok) {
        console.warn(`Nakama API 응답 오류: ${response.status}`);
        return NextResponse.json({
          error: '그룹 정보를 가져오는데 실패했습니다'
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