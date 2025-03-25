'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNakamaUser } from '../../login/useNakamaUser';
import Link from 'next/link';

// 그룹 정보 인터페이스
interface GroupInfo {
  id: string;
  name: string;
  description: string;
  creator_id: string;
  lang_tag: string;
  open: boolean;
  edge_count: number;
  max_count: number;
  create_time: string;
  update_time: string;
  metadata?: any;
  state?: number;
  members?: GroupMember[];
}

// 그룹 멤버 인터페이스
interface GroupMember {
  user: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
  };
  state: number; // 1: member, 2: admin, etc.
  join_time?: string;
}

export default function GroupDetailPage({ params }: { params: { groupId: string } }) {
  const { user, isLoading } = useNakamaUser();
  const router = useRouter();
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isLoadingGroup, setIsLoadingGroup] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // 토큰 가져오기
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const nakamaToken = sessionStorage.getItem('nakamaToken');
      setToken(nakamaToken);
    }
  }, []);

  useEffect(() => {
    // 사용자가 로그인하지 않은 경우 로그인 페이지로 리다이렉트
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!user || !token || !params.groupId) return;

    const fetchGroupInfo = async () => {
      setIsLoadingGroup(true);
      setError(null);
      
      try {
        // 그룹 정보 가져오기
        const response = await fetch(`/api/groups/${params.groupId}/info`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('그룹 정보를 가져오는데 실패했습니다');
        }

        const data = await response.json();
        setGroupInfo(data.group);
        
        // 그룹 멤버 목록 가져오기
        const membersResponse = await fetch(`/api/groups/${params.groupId}/members`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (membersResponse.ok) {
          const membersData = await membersResponse.json();
          console.log("group members", membersData.group_users);
          
          // 멤버 데이터 가공: group_users 배열을 컴포넌트에 맞는 형식으로 변환
          if (membersData.group_users && Array.isArray(membersData.group_users)) {
            const formattedMembers = membersData.group_users.map((member: any) => ({
              user: {
                id: member.user.id,
                username: member.user.username || '익명',
                display_name: member.user.username || '익명', // Nakama API에서는 display_name이 없으므로 username 사용
                avatar_url: member.user.avatar_url || undefined
              },
              state: member.state,
              join_time: member.user.create_time
            }));
            setMembers(formattedMembers);
          } else {
            setMembers([]);
          }
        }
      } catch (err) {
        console.error('그룹 정보 가져오기 오류:', err);
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다');
      } finally {
        setIsLoadingGroup(false);
      }
    };

    fetchGroupInfo();
  }, [user, token, params.groupId]);

  if (isLoading || isLoadingGroup) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin w-10 h-10 border-4 border-blue-500 rounded-full border-t-transparent mx-auto mb-4"></div>
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-red-500/20 backdrop-blur-sm rounded-lg p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-4">오류 발생</h2>
          <p className="text-white/90 mb-6">{error}</p>
          <Link href="/groups" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors">
            그룹 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  if (!groupInfo) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-gray-800/50 backdrop-blur-sm rounded-lg p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-4">그룹 정보 없음</h2>
          <p className="text-white/90 mb-6">존재하지 않는 그룹이거나 접근 권한이 없습니다.</p>
          <Link href="/groups" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors">
            그룹 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  // 그룹 멤버 상태 텍스트 정의
  const getMemberStateText = (state: number) => {
    switch (state) {
      case 0: return '슈퍼관리자';
      case 1: return '일반 멤버';
      case 2: return '관리자';
      case 3: return '초대 중';
      default: return '알 수 없음';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* 상단 헤더 */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-xl p-6 md:p-8 shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{groupInfo.name}</h1>
              <p className="text-white/80 text-sm">
                생성일: {new Date(groupInfo.create_time).toLocaleDateString('ko-KR')}
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-3">
              <Link 
                href="/groups" 
                className="bg-black/20 hover:bg-black/30 text-white py-2 px-4 rounded transition-colors"
              >
                그룹 목록으로
              </Link>
            </div>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-b-xl p-6 shadow-lg">
          {/* 그룹 상세 정보 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4 border-b border-white/10 pb-2">그룹 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-400">설명</h3>
                <p className="text-white mt-1">{groupInfo.description || '설명이 없습니다.'}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-400">공개 여부</h3>
                <p className="text-white mt-1">
                  {groupInfo.open ? '공개 그룹' : '비공개 그룹'}
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-400">멤버 수</h3>
                <p className="text-white mt-1">
                  {groupInfo.edge_count}/{groupInfo.max_count}
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-400">언어</h3>
                <p className="text-white mt-1">
                  {groupInfo.lang_tag || '없음'}
                </p>
              </div>
              {groupInfo.metadata && (
                <div className="bg-white/5 rounded-lg p-4 md:col-span-2">
                  <h3 className="text-sm font-medium text-gray-400">메타데이터</h3>
                  <p className="text-white mt-1 font-mono text-sm">
                    {JSON.stringify(groupInfo.metadata, null, 2)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 그룹 멤버 목록 */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4 border-b border-white/10 pb-2">멤버 목록</h2>
            {members.length === 0 ? (
              <p className="text-white/70 text-center py-8">멤버 정보를 불러올 수 없습니다.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {members.map((member) => (
                  <div key={member.user.id} className="bg-white/5 hover:bg-white/10 rounded-lg p-4 transition-colors">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        {member.user.avatar_url ? (
                          <img 
                            src={member.user.avatar_url} 
                            alt={member.user.display_name || member.user.username} 
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-bold">{(member.user.display_name || member.user.username || '?').charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="text-white font-medium">{member.user.display_name || member.user.username}</p>
                        <div className="flex items-center mt-1">
                          <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                            member.state === 2 ? 'bg-purple-600 text-white' : 
                            member.state === 0 ? 'bg-red-600 text-white' : 
                            'bg-blue-600/50 text-white'
                          }`}>
                            {getMemberStateText(member.state)}
                          </span>
                          {member.join_time && (
                            <span className="text-gray-400 text-xs ml-2">
                              {new Date(member.join_time).toLocaleDateString('ko-KR')} 가입
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 