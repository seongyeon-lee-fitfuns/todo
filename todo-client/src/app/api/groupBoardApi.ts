// 게시글 인터페이스 정의
export interface GroupPost {
  id: string;
  group_id: string;
  author_id: string;
  author_name: string;
  title: string;
  content: string;
  created_at: string;
  updated_at?: string;
  comment_count: number;
  like_count: number;
}

// 댓글 인터페이스 정의
export interface PostComment {
  id: string;
  post_id: string;
  author_id: string;
  author_name: string;
  content: string;
  created_at: string;
  updated_at?: string;
}

// 게시글 생성 요청 인터페이스
export interface CreatePostRequest {
  group_id: string;
  title: string;
  content: string;
}

// 댓글 생성 요청 인터페이스
export interface CreateCommentRequest {
  post_id: string;
  content: string;
}

// 게시글 목록 응답 인터페이스
export interface PostListResponse {
  posts: GroupPost[];
  cursor?: string;
}

// 댓글 목록 응답 인터페이스
export interface CommentListResponse {
  comments: PostComment[];
  cursor?: string;
}

/**
 * 그룹의 게시글 목록 가져오기
 */
export async function fetchGroupPosts(
  groupId: string,
  limit: number = 10,
  cursor?: string
): Promise<PostListResponse> {
  try {
    const token = sessionStorage.getItem('nakamaToken');
    if (!token) {
      throw new Error('인증 토큰이 없습니다. 로그인이 필요합니다.');
    }

    let url = `/api/groups/${groupId}/posts?limit=${limit}`;
    if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || `요청 실패: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('그룹 게시글 목록 가져오기 실패:', error);
    throw error;
  }
}

/**
 * 게시글 상세 정보 가져오기
 */
export async function fetchPostDetail(postId: string): Promise<GroupPost> {
  try {
    const token = sessionStorage.getItem('nakamaToken');
    if (!token) {
      throw new Error('인증 토큰이 없습니다. 로그인이 필요합니다.');
    }

    const response = await fetch(`/api/posts/${postId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || `요청 실패: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('게시글 상세 정보 가져오기 실패:', error);
    throw error;
  }
}

/**
 * 게시글의 댓글 목록 가져오기
 */
export async function fetchPostComments(
  postId: string,
  limit: number = 20,
  cursor?: string
): Promise<CommentListResponse> {
  try {
    const token = sessionStorage.getItem('nakamaToken');
    if (!token) {
      throw new Error('인증 토큰이 없습니다. 로그인이 필요합니다.');
    }

    let url = `/api/posts/${postId}/comments?limit=${limit}`;
    if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || `요청 실패: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('게시글 댓글 목록 가져오기 실패:', error);
    throw error;
  }
}

/**
 * 게시글 작성하기
 */
export async function createPost(request: CreatePostRequest): Promise<GroupPost> {
  try {
    const token = sessionStorage.getItem('nakamaToken');
    if (!token) {
      throw new Error('인증 토큰이 없습니다. 로그인이 필요합니다.');
    }

    const response = await fetch(`/api/groups/${request.group_id}/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || `요청 실패: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('게시글 작성 실패:', error);
    throw error;
  }
}

/**
 * 게시글 수정하기
 */
export async function updatePost(
  postId: string,
  updates: { title?: string; content?: string }
): Promise<GroupPost> {
  try {
    const token = sessionStorage.getItem('nakamaToken');
    if (!token) {
      throw new Error('인증 토큰이 없습니다. 로그인이 필요합니다.');
    }

    const response = await fetch(`/api/posts/${postId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || `요청 실패: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('게시글 수정 실패:', error);
    throw error;
  }
}

/**
 * 게시글 삭제하기
 */
export async function deletePost(postId: string): Promise<boolean> {
  try {
    const token = sessionStorage.getItem('nakamaToken');
    if (!token) {
      throw new Error('인증 토큰이 없습니다. 로그인이 필요합니다.');
    }

    const response = await fetch(`/api/posts/${postId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || `요청 실패: ${response.status}`);
    }

    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error('게시글 삭제 실패:', error);
    throw error;
  }
}

/**
 * 댓글 작성하기
 */
export async function createComment(postId: string, content: string): Promise<PostComment> {
  try {
    const token = sessionStorage.getItem('nakamaToken');
    if (!token) {
      throw new Error('인증 토큰이 없습니다. 로그인이 필요합니다.');
    }

    const response = await fetch(`/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || `요청 실패: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('댓글 작성 실패:', error);
    throw error;
  }
} 