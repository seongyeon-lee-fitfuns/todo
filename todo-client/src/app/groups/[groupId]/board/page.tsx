'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchGroupPosts, GroupPost } from '@/app/api/groupBoardApi';
import Link from 'next/link';

export default function GroupBoardPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupId as string;
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);

  useEffect(() => {
    loadPosts();
  }, [groupId]);

  const loadPosts = async (newCursor?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetchGroupPosts(groupId, 10, newCursor);
      
      if (newCursor) {
        setPosts(prev => [...prev, ...response.posts]);
      } else {
        setPosts(response.posts);
      }
      
      setCursor(response.cursor);
      setHasMore(!!response.cursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : '게시글을 불러오는 중 오류가 발생했습니다.');
      console.error('게시글 로드 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadPosts(cursor);
    }
  };

  const handleNewPost = () => {
    router.push(`/groups/${groupId}/board/new`);
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">그룹 게시판</h1>
        <button
          onClick={handleNewPost}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          새 글 작성
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {posts.length === 0 && !loading ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">아직 게시글이 없습니다. 첫 번째 게시글을 작성해보세요!</p>
        </div>
      ) : (
        <div className="overflow-hidden shadow-md sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  제목
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작성자
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작성일
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  댓글
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link 
                      href={`/groups/${groupId}/board/${post.id}`}
                      className="text-blue-600 hover:text-blue-900 font-medium"
                    >
                      {post.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{post.author_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{formatDate(post.created_at)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {post.comment_count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {hasMore && (
        <div className="text-center mt-6">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? '로딩 중...' : '더 보기'}
          </button>
        </div>
      )}
    </div>
  );
} 