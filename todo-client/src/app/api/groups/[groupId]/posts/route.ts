import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// 임시 저장소 (실제로는 데이터베이스를 사용해야 함)
const posts = new Map();

export async function GET(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    // 인증 토큰 확인
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증 토큰이 필요합니다' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7);
    const { groupId } = params;
    
    // 나카마 API를 통해 사용자가 그룹에 속해 있는지 확인
    const nakamaUrl = process.env.NAKAMA_URL;
    if (!nakamaUrl) {
      throw new Error('NAKAMA_URL 환경 변수가 설정되지 않았습니다');
    }
    
    // 먼저 사용자 정보 가져오기
    const userResponse = await fetch(`${nakamaUrl}/v2/account`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!userResponse.ok) {
      return NextResponse.json(
        { error: '사용자 정보를 가져오는데 실패했습니다' },
        { status: userResponse.status }
      );
    }
    
    const userData = await userResponse.json();
    const userId = userData.account.user.id;
    
    // 사용자의 그룹 멤버십 확인
    const groupResponse = await fetch(`${nakamaUrl}/v2/user/${userId}/group`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!groupResponse.ok) {
      // 실제 환경에서는 오류를 보낸다. 
      // 현재는 목업 데이터로 진행하기 위해 오류 처리를 생략
      console.warn('그룹 멤버십 확인 실패. 목업 데이터로 계속 진행합니다.');
    } else {
      const groupsData = await groupResponse.json();
      // 사용자가 그룹의 멤버인지 확인
      const isMember = Array.isArray(groupsData.user_groups) && 
        groupsData.user_groups.some((ug: any) => ug.group.id === groupId);
      
      if (!isMember) {
        return NextResponse.json(
          { error: '이 그룹의 게시판에 접근할 권한이 없습니다' },
          { status: 403 }
        );
      }
    }
    
    // 쿼리 파라미터 처리
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const cursor = searchParams.get('cursor');
    
    // 목업 데이터 생성 (실제로는 데이터베이스에서 가져와야 함)
    // 그룹 ID에 해당하는 게시글만 필터링
    const groupPosts = Array.from(posts.values())
      .filter((post: any) => post.group_id === groupId)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    // 커서 기반 페이지네이션 처리
    let startIndex = 0;
    if (cursor) {
      const cursorIndex = groupPosts.findIndex((post: any) => post.id === cursor);
      if (cursorIndex !== -1) {
        startIndex = cursorIndex + 1;
      }
    }
    
    // 게시글 목록 반환
    const paginatedPosts = groupPosts.slice(startIndex, startIndex + limit);
    const nextCursor = paginatedPosts.length === limit ? paginatedPosts[paginatedPosts.length - 1].id : undefined;
    
    return NextResponse.json({
      posts: paginatedPosts,
      cursor: nextCursor
    });

  } catch (error) {
    console.error('그룹 게시글 목록 가져오기 오류:', error);
    return NextResponse.json(
      { error: '그룹 게시글 목록을 처리하는 중 오류가 발생했습니다', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    // 인증 토큰 확인
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증 토큰이 필요합니다' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7);
    const { groupId } = params;
    
    // 요청 본문 파싱
    const body = await req.json();
    if (!body.title || !body.content) {
      return NextResponse.json(
        { error: '제목과 내용은 필수 항목입니다' },
        { status: 400 }
      );
    }
    
    // 나카마 API를 통해 사용자가 그룹에 속해 있는지 확인
    const nakamaUrl = process.env.NAKAMA_URL;
    if (!nakamaUrl) {
      throw new Error('NAKAMA_URL 환경 변수가 설정되지 않았습니다');
    }
    
    // 먼저 사용자 정보 가져오기
    const userResponse = await fetch(`${nakamaUrl}/v2/account`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!userResponse.ok) {
      return NextResponse.json(
        { error: '사용자 정보를 가져오는데 실패했습니다' },
        { status: userResponse.status }
      );
    }
    
    const userData = await userResponse.json();
    const userId = userData.account.user.id;
    const userName = userData.account.user.username || userData.account.user.display_name || '익명';
    
    // 사용자의 그룹 멤버십 확인 (실제 환경에서)
    const groupResponse = await fetch(`${nakamaUrl}/v2/user/${userId}/group`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!groupResponse.ok) {
      // 실제 환경에서는 오류를 보낸다.
      // 현재는 목업 데이터로 진행하기 위해 오류 처리를 생략
      console.warn('그룹 멤버십 확인 실패. 목업 데이터로 계속 진행합니다.');
    } else {
      const groupsData = await groupResponse.json();
      // 사용자가 그룹의 멤버인지 확인
      const isMember = Array.isArray(groupsData.user_groups) && 
        groupsData.user_groups.some((ug: any) => ug.group.id === groupId);
      
      if (!isMember) {
        return NextResponse.json(
          { error: '이 그룹에 게시글을 작성할 권한이 없습니다' },
          { status: 403 }
        );
      }
    }
    
    // 새 게시글 생성
    const postId = uuidv4();
    const now = new Date().toISOString();
    
    const newPost = {
      id: postId,
      group_id: groupId,
      author_id: userId,
      author_name: userName,
      title: body.title,
      content: body.content,
      created_at: now,
      updated_at: now,
      comment_count: 0,
      like_count: 0
    };
    
    // 게시글 저장 (실제로는 데이터베이스에 저장)
    posts.set(postId, newPost);
    
    return NextResponse.json(newPost, { status: 201 });
    
  } catch (error) {
    console.error('게시글 작성 오류:', error);
    return NextResponse.json(
      { error: '게시글 작성 중 오류가 발생했습니다', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 