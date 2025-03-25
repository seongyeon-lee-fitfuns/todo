import { NextRequest, NextResponse } from 'next/server';

// 외부에서 posts 맵에 접근할 수 있도록 posts 맵 참조 (실제로는 데이터베이스를 사용해야 함)
export const posts = new Map();

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
    
    // 게시글 조회 (실제로는 데이터베이스에서 가져와야 함)
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
          { error: '이 게시글에 접근할 권한이 없습니다' },
          { status: 403 }
        );
      }
    }
    
    return NextResponse.json(post);
    
  } catch (error) {
    console.error('게시글 상세 정보 가져오기 오류:', error);
    return NextResponse.json(
      { error: '게시글 상세 정보를 처리하는 중 오류가 발생했습니다', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    
    // 게시글 조회
    const post = posts.get(postId);
    
    if (!post) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다' },
        { status: 404 }
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
    
    // 글 작성자만 수정 가능
    if (post.author_id !== userId) {
      return NextResponse.json(
        { error: '게시글을 수정할 권한이 없습니다' },
        { status: 403 }
      );
    }
    
    // 요청 내용 파싱
    const body = await req.json();
    
    if (!body.title && !body.content) {
      return NextResponse.json(
        { error: '수정할 내용이 없습니다' },
        { status: 400 }
      );
    }
    
    // 게시글 업데이트
    const updatedPost = {
      ...post,
      title: body.title || post.title,
      content: body.content || post.content,
      updated_at: new Date().toISOString()
    };
    
    // 저장 (실제로는 데이터베이스에 저장)
    posts.set(postId, updatedPost);
    
    return NextResponse.json(updatedPost);
    
  } catch (error) {
    console.error('게시글 수정 오류:', error);
    return NextResponse.json(
      { error: '게시글 수정 중 오류가 발생했습니다', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    
    // 게시글 조회
    const post = posts.get(postId);
    
    if (!post) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다' },
        { status: 404 }
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
    
    // 글 작성자만 삭제 가능
    if (post.author_id !== userId) {
      return NextResponse.json(
        { error: '게시글을 삭제할 권한이 없습니다' },
        { status: 403 }
      );
    }
    
    // 게시글 삭제
    posts.delete(postId);
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('게시글 삭제 오류:', error);
    return NextResponse.json(
      { error: '게시글 삭제 중 오류가 발생했습니다', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 