import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { posts } from '../../[postId]/route';

// 임시 저장소 (실제로는 데이터베이스를 사용해야 함)
const comments = new Map();

export async function GET(
  req: NextRequest,
  { params }: { params: { postId: string } }
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
    const { postId } = params;
    
    // 게시글 존재 확인
    const post = posts.get(postId);
    if (!post) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다' },
        { status: 404 }
      );
    }
    
    // 그룹 멤버십 확인 코드
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
    
    // 사용자의 그룹 멤버십 확인 (실제 환경에서)
    const groupId = post.group_id;
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
          { error: '이 게시글의 댓글에 접근할 권한이 없습니다' },
          { status: 403 }
        );
      }
    }
    
    // 쿼리 파라미터 처리
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const cursor = searchParams.get('cursor');
    
    // 게시글의 댓글만 필터링
    const postComments = Array.from(comments.values())
      .filter((comment: any) => comment.post_id === postId)
      .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    // 커서 기반 페이지네이션 처리
    let startIndex = 0;
    if (cursor) {
      const cursorIndex = postComments.findIndex((comment: any) => comment.id === cursor);
      if (cursorIndex !== -1) {
        startIndex = cursorIndex + 1;
      }
    }
    
    // 댓글 목록 반환
    const paginatedComments = postComments.slice(startIndex, startIndex + limit);
    const nextCursor = paginatedComments.length === limit ? paginatedComments[paginatedComments.length - 1].id : undefined;
    
    return NextResponse.json({
      comments: paginatedComments,
      cursor: nextCursor
    });
    
  } catch (error) {
    console.error('댓글 목록 가져오기 오류:', error);
    return NextResponse.json(
      { error: '댓글 목록을 처리하는 중 오류가 발생했습니다', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { postId: string } }
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
    const { postId } = params;
    
    // 게시글 존재 확인
    const post = posts.get(postId);
    if (!post) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다' },
        { status: 404 }
      );
    }
    
    // 요청 본문 파싱
    const body = await req.json();
    if (!body.content) {
      return NextResponse.json(
        { error: '댓글 내용은 필수 항목입니다' },
        { status: 400 }
      );
    }
    
    // 나카마 API를 통해 사용자 정보 가져오기
    const nakamaUrl = process.env.NAKAMA_URL;
    if (!nakamaUrl) {
      throw new Error('NAKAMA_URL 환경 변수가 설정되지 않았습니다');
    }
    
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
    const groupId = post.group_id;
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
          { error: '이 게시글에 댓글을 작성할 권한이 없습니다' },
          { status: 403 }
        );
      }
    }
    
    // 새 댓글 생성
    const commentId = uuidv4();
    const now = new Date().toISOString();
    
    const newComment = {
      id: commentId,
      post_id: postId,
      author_id: userId,
      author_name: userName,
      content: body.content,
      created_at: now,
      updated_at: now
    };
    
    // 댓글 저장 (실제로는 데이터베이스에 저장)
    comments.set(commentId, newComment);
    
    // 게시글의 댓글 수 증가
    const updatedPost = {
      ...post,
      comment_count: post.comment_count + 1
    };
    posts.set(postId, updatedPost);
    
    return NextResponse.json(newComment, { status: 201 });
    
  } catch (error) {
    console.error('댓글 작성 오류:', error);
    return NextResponse.json(
      { error: '댓글 작성 중 오류가 발생했습니다', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 