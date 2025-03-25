'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchPostDetail, updatePost } from '@/app/api/groupBoardApi';

export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupId as string;
  const postId = params.postId as string;
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 기존 게시글 정보 로드
  useEffect(() => {
    loadPost();
  }, [postId]);

  const loadPost = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const post = await fetchPostDetail(postId);
      
      // 게시글 정보 설정
      setTitle(post.title);
      setContent(post.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : '게시글을 불러오는 중 오류가 발생했습니다.');
      console.error('게시글 로드 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }
    
    if (!content.trim()) {
      setError('내용을 입력해주세요.');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      await updatePost(postId, {
        title: title.trim(),
        content: content.trim()
      });
      
      // 성공 시 상세 페이지로 이동
      router.push(`/groups/${groupId}/board/${postId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '게시글 수정 중 오류가 발생했습니다.');
      console.error('게시글 수정 오류:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600">게시글을 불러오는 중입니다...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">게시글 수정</h1>
          <Link
            href={`/groups/${groupId}/board/${postId}`}
            className="text-gray-600 hover:text-gray-900"
          >
            취소하고 돌아가기
          </Link>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
          <div className="mb-4">
            <label htmlFor="title" className="block text-gray-700 text-sm font-bold mb-2">
              제목
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="게시글 제목"
              disabled={submitting}
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="content" className="block text-gray-700 text-sm font-bold mb-2">
              내용
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-60"
              placeholder="게시글 내용을 입력하세요."
              disabled={submitting}
            />
          </div>
          
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={() => router.push(`/groups/${groupId}/board/${postId}`)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
              disabled={submitting}
            >
              취소
            </button>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              disabled={submitting}
            >
              {submitting ? '저장 중...' : '저장하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 