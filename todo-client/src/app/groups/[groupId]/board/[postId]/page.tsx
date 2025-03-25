'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchPostDetail, fetchPostComments, createComment, deletePost, GroupPost, PostComment } from '@/app/api/groupBoardApi';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupId as string;
  const postId = params.postId as string;
  
  const [post, setPost] = useState<GroupPost | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loadingPost, setLoadingPost] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [deletingPost, setDeletingPost] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [commentCursor, setCommentCursor] = useState<string | undefined>(undefined);
  const [hasMoreComments, setHasMoreComments] = useState(true);

  // 게시글 상세 정보 로드
  useEffect(() => {
    loadPost();
  }, [postId]);

  // 댓글 로드
  useEffect(() => {
    if (postId) {
      loadComments();
    }
  }, [postId]);

  const loadPost = async () => {
    try {
      setLoadingPost(true);
      setError(null);
      
      const postData = await fetchPostDetail(postId);
      setPost(postData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '게시글을 불러오는 중 오류가 발생했습니다.');
      console.error('게시글 상세 정보 로드 오류:', err);
    } finally {
      setLoadingPost(false);
    }
  };

  const loadComments = async (newCursor?: string) => {
    try {
      setLoadingComments(true);
      setCommentError(null);
      
      const response = await fetchPostComments(postId, 20, newCursor);
      
      if (newCursor) {
        setComments(prev => [...prev, ...response.comments]);
      } else {
        setComments(response.comments);
      }
      
      setCommentCursor(response.cursor);
      setHasMoreComments(!!response.cursor);
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : '댓글을 불러오는 중 오류가 발생했습니다.');
      console.error('댓글 로드 오류:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleLoadMoreComments = () => {
    if (!loadingComments && hasMoreComments) {
      loadComments(commentCursor);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!commentText.trim()) {
      setCommentError('댓글 내용을 입력해주세요.');
      return;
    }
    
    try {
      setSubmittingComment(true);
      setCommentError(null);
      
      const newComment = await createComment(postId, commentText.trim());
      
      // 새 댓글을 목록에 추가
      setComments(prev => [newComment, ...prev]);
      
      // 입력 필드 초기화
      setCommentText('');
      
      // 게시글의 댓글 수 업데이트
      if (post) {
        setPost({
          ...post,
          comment_count: post.comment_count + 1
        });
      }
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : '댓글 작성 중 오류가 발생했습니다.');
      console.error('댓글 작성 오류:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('정말 이 게시글을 삭제하시겠습니까?')) {
      return;
    }
    
    try {
      setDeletingPost(true);
      setError(null);
      
      await deletePost(postId);
      
      // 삭제 성공 시 목록으로 이동
      router.push(`/groups/${groupId}/board`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '게시글 삭제 중 오류가 발생했습니다.');
      console.error('게시글 삭제 오류:', err);
    } finally {
      setDeletingPost(false);
    }
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 현재 사용자가 글 작성자인지 확인 (간단한 예시용 함수)
  const isPostAuthor = (): boolean => {
    if (!post) return false;
    
    // 실제로는 세션에서 사용자 ID를 가져와 비교해야 함
    // 여기서는 간단히 로컬 스토리지나 세션 스토리지에서 가져온다고 가정
    const currentUserId = sessionStorage.getItem('userId') || '';
    return post.author_id === currentUserId;
  };

  if (loadingPost) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600">게시글을 불러오는 중입니다...</div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error || '게시글을 찾을 수 없습니다.'}
        </div>
        <div className="mt-4">
          <Link 
            href={`/groups/${groupId}/board`}
            className="text-blue-600 hover:text-blue-800"
          >
            게시판으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 영역 */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">{post.title}</h1>
            <Link 
              href={`/groups/${groupId}/board`}
              className="text-gray-600 hover:text-gray-900"
            >
              목록으로
            </Link>
          </div>
          <div className="mt-2 flex items-center text-gray-600">
            <span className="mr-4">작성자: {post.author_name}</span>
            <span>작성일: {formatDate(post.created_at)}</span>
            {post.updated_at && post.updated_at !== post.created_at && (
              <span className="ml-4">(수정됨: {formatDate(post.updated_at)})</span>
            )}
          </div>
        </div>
        
        {/* 게시글 내용 */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <div className="prose max-w-none">
            {post.content.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
        
        {/* 게시글 관리 버튼 */}
        {isPostAuthor() && (
          <div className="flex justify-end mb-8">
            <Link 
              href={`/groups/${groupId}/board/${postId}/edit`}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded mr-2"
            >
              수정
            </Link>
            <button
              onClick={handleDeletePost}
              disabled={deletingPost}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            >
              {deletingPost ? '삭제 중...' : '삭제'}
            </button>
          </div>
        )}
        
        {/* 댓글 섹션 */}
        <h2 className="text-2xl font-bold mb-4">댓글 {post.comment_count}개</h2>
        
        {/* 댓글 작성 폼 */}
        <div className="bg-white shadow-md rounded-lg p-4 mb-6">
          <form onSubmit={handleSubmitComment}>
            {commentError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-sm">
                {commentError}
              </div>
            )}
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="댓글을 작성하세요..."
              className="w-full border rounded-lg p-2 mb-2"
              rows={3}
              disabled={submittingComment}
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submittingComment}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                {submittingComment ? '등록 중...' : '댓글 등록'}
              </button>
            </div>
          </form>
        </div>
        
        {/* 댓글 목록 */}
        {loadingComments && comments.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-600">댓글을 불러오는 중입니다...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <p className="text-gray-600">아직 댓글이 없습니다. 첫 댓글을 남겨보세요!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-white shadow-sm rounded-lg p-4">
                <div className="flex justify-between">
                  <div className="font-medium">{comment.author_name}</div>
                  <div className="text-sm text-gray-500">{formatDate(comment.created_at)}</div>
                </div>
                <div className="mt-2">
                  {comment.content.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            ))}
            
            {hasMoreComments && (
              <div className="text-center mt-4">
                <button
                  onClick={handleLoadMoreComments}
                  disabled={loadingComments}
                  className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded text-sm"
                >
                  {loadingComments ? '댓글 불러오는 중...' : '댓글 더 보기'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 