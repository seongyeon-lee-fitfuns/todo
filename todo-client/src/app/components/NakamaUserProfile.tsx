'use client';
import { useNakamaUser } from '../login/useNakamaUser';
import Image from 'next/image';

export default function NakamaUserProfile() {
  const { user, error, isLoading, refreshUser } = useNakamaUser();

  if (isLoading) {
    return (
      <div className="p-4 bg-white/20 backdrop-blur-md rounded-lg shadow-md">
        <p className="text-white">사용자 정보 로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/90 backdrop-blur-md rounded-lg shadow-md">
        <p className="text-white font-medium">오류: {error.message}</p>
        <button 
          onClick={refreshUser}
          className="mt-2 px-4 py-2 bg-white/90 text-red-500 font-medium rounded-md hover:bg-white transition-colors shadow-md"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4 bg-white/20 backdrop-blur-md rounded-lg shadow-md">
        <p className="text-white">로그인이 필요합니다</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white/20 backdrop-blur-md rounded-lg shadow-md">
      <div className="flex items-center space-x-4">
        {user.avatarUrl && (
          <Image
            src={user.avatarUrl} 
            alt={user.displayName || user.username || '사용자'} 
            className="w-12 h-12 rounded-full object-cover border-2 border-white/50"
            width={48}
            height={48}
          />
        )}
        <div className="text-white">
          <h3 className="text-lg font-semibold">
            {user.displayName || user.username || '알 수 없는 사용자'}
          </h3>
          {user.username && user.displayName && user.displayName !== user.username && (
            <p className="text-sm text-white/70">@{user.username}</p>
          )}
          {user.createdAt && (
            <p className="text-xs text-white/60">
              가입: {new Date(user.createdAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
      
      <button 
        onClick={refreshUser}
        className="mt-4 px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors shadow-md"
      >
        새로고침
      </button>
    </div>
  );
} 