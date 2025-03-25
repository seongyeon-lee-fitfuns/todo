'use client';

import { useState } from 'react';
import { useNakamaUser } from '../login/useNakamaUser';
import GroupCreation from '../components/GroupCreation';
import GroupsList from '../components/GroupsList';
import { useRouter } from 'next/navigation';

export default function GroupsPage() {
  const { user, isLoading } = useNakamaUser();
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const router = useRouter();

  // 사용자가 로그인하지 않은 경우 로그인 페이지로 리다이렉트
  if (!isLoading && !user) {
    router.push('/login');
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin w-10 h-10 border-4 border-blue-500 rounded-full border-t-transparent mx-auto mb-4"></div>
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8 text-center">그룹 관리</h1>
      
      <div className="mb-8 flex justify-center">
        <div className="bg-white/10 backdrop-blur-md rounded-full p-1 inline-flex">
          <button
            onClick={() => setActiveTab('list')}
            className={`py-2 px-6 rounded-full transition-colors ${
              activeTab === 'list'
                ? 'bg-blue-600 text-white'
                : 'text-white/80 hover:text-white'
            }`}
          >
            그룹 목록
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`py-2 px-6 rounded-full transition-colors ${
              activeTab === 'create'
                ? 'bg-blue-600 text-white'
                : 'text-white/80 hover:text-white'
            }`}
          >
            그룹 생성
          </button>
        </div>
      </div>
      
      {activeTab === 'list' ? <GroupsList /> : <GroupCreation />}
    </div>
  );
} 