import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// 임시 저장소 (실제로는 데이터베이스를 사용해야 함)
export const posts = new Map();

export async function GET(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const { groupId } = params;
    
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
    const { groupId } = params;
    
    // 요청 본문 파싱
    const body = await req.json();
    const content = body.content;
    
    // 새 게시글 생성
    const postId = uuidv4();
    const now = new Date().toISOString();
    
    const newPost = {
      id: postId,
      group_id: groupId,
      title: body.title,
      content: content,
      created_at: now,
      updated_at: now,
    };
    
    // 게시글 저장 (실제로는 데이터베이스에 저장)
    posts.set(postId, newPost);
    
    return NextResponse.json(newPost, { status: 201 });
    
  } catch (error) {
    console.error('할 일 작성 오류:', error);
    return NextResponse.json(
      { error: '할 일 작성 중 오류가 발생했습니다', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 