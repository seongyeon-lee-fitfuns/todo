'use client';

import { useState, useEffect } from 'react';
import { NakamaGroup, fetchGroupsWithMembership, joinGroup } from '../api/groupsApi';

export default function GroupsList() {
  const [groups, setGroups] = useState<NakamaGroup[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<NakamaGroup[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [joinLoading, setJoinLoading] = useState<{[key: string]: boolean}>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showOnlyMyGroups, setShowOnlyMyGroups] = useState<boolean>(false);

  const loadGroups = async (query: string = '', resetList: boolean = true) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const cursorToUse = resetList ? undefined : cursor;
      const response = await fetchGroupsWithMembership(query, 10, cursorToUse);
      
      console.log('그룹 데이터 로드됨:', response.groups);
      
      const newGroups = resetList ? response.groups : [...groups, ...response.groups];
      setGroups(newGroups);
      
      // 필터 적용
      applyFilters(newGroups, showOnlyMyGroups);
      
      setCursor(response.cursor);
    } catch (err) {
      console.error('그룹 목록 가져오기 오류:', err);
      setError(err instanceof Error ? err.message : '그룹 목록을 가져오는 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  // 필터를 적용하는 함수
  const applyFilters = (groupsList: NakamaGroup[], onlyMyGroups: boolean) => {
    if (onlyMyGroups) {
      const myGroups = groupsList.filter(group => group.isMember === true);
      console.log('내 그룹만 필터링:', myGroups.length, '/', groupsList.length);
      setFilteredGroups(myGroups);
    } else {
      console.log('모든 그룹 표시:', groupsList.length);
      setFilteredGroups(groupsList);
    }
  };

  // 필터 변경 핸들러
  const handleFilterChange = (onlyMyGroups: boolean) => {
    console.log('필터 변경:', onlyMyGroups ? '내 그룹만' : '모든 그룹');
    setShowOnlyMyGroups(onlyMyGroups);
    applyFilters(groups, onlyMyGroups);
  };

  useEffect(() => {
    console.log('컴포넌트 마운트, 그룹 로딩 시작');
    loadGroups();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('검색 실행:', searchQuery);
    loadGroups(searchQuery);
  };

  const handleJoinGroup = async (groupId: string, groupName: string) => {
    try {
      setJoinLoading(prev => ({ ...prev, [groupId]: true }));
      setSuccessMessage(null);
      
      console.log('그룹 가입 요청:', groupName, groupId);
      await joinGroup(groupId);
      setSuccessMessage(`"${groupName}" 그룹 가입 요청이 성공적으로 전송되었습니다!`);
      
      // 가입 요청 후 그룹 목록 갱신
      await loadGroups(searchQuery);
    } catch (err) {
      console.error('그룹 가입 요청 오류:', err);
      setError(err instanceof Error ? err.message : '그룹 가입 요청 중 오류가 발생했습니다');
    } finally {
      setJoinLoading(prev => ({ ...prev, [groupId]: false }));
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '알 수 없음';
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">그룹 목록</h2>
      
      {successMessage && (
        <div className="bg-green-500/80 text-white p-3 rounded-md mb-4">
          {successMessage}
        </div>
      )}
      
      {error && (
        <div className="bg-red-500/80 text-white p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
        <form onSubmit={handleSearch} className="w-full md:flex-1">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="그룹 이름으로 검색"
              className="flex-1 bg-white/20 border border-white/30 rounded-md px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors"
            >
              검색
            </button>
          </div>
        </form>
        
        <div className="flex rounded-md shadow-sm w-full md:w-auto">
          <button
            onClick={() => handleFilterChange(false)}
            className={`px-4 py-2 text-sm font-medium ${
              !showOnlyMyGroups
                ? 'bg-blue-600 text-white'
                : 'bg-white/20 text-white/80 hover:bg-white/30 hover:text-white'
            } border border-white/30 rounded-l-md transition-colors`}
          >
            모든 그룹
          </button>
          <button
            onClick={() => handleFilterChange(true)}
            className={`px-4 py-2 text-sm font-medium ${
              showOnlyMyGroups
                ? 'bg-green-600 text-white'
                : 'bg-white/20 text-white/80 hover:bg-white/30 hover:text-white'
            } border border-white/30 border-l-0 rounded-r-md transition-colors`}
          >
            내 그룹만
          </button>
        </div>
      </div>
      
      {isLoading && filteredGroups.length === 0 ? (
        <div className="text-center text-white py-8">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 rounded-full border-t-transparent mx-auto mb-2"></div>
          <p>그룹 목록을 불러오는 중...</p>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="text-center text-white py-8">
          <p>{showOnlyMyGroups ? '가입한 그룹이 없습니다.' : '표시할 그룹이 없습니다.'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGroups.map(group => (
            <div 
              key={group.id} 
              className={`rounded-lg p-4 hover:bg-white/30 transition-colors ${
                group.isMember 
                  ? 'bg-green-500/30 border border-green-500/50' 
                  : 'bg-white/20'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-16 h-16 flex-shrink-0 rounded-full overflow-hidden flex items-center justify-center ${
                  group.isMember ? 'bg-green-600' : 'bg-blue-600'
                }`}>
                  <div className="text-white text-xl font-bold">
                    {group.name.charAt(0).toUpperCase()}
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center">
                    <h3 className="text-xl font-bold text-white">{group.name}</h3>
                    {group.isMember && (
                      <span className="ml-2 px-2 py-1 text-xs bg-green-500 text-white rounded-full">
                        가입됨
                      </span>
                    )}
                  </div>
                  
                  {group.description && (
                    <p className="text-white/80 mt-1">{group.description}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-white/70">
                    <div>멤버: {group.edge_count || 0} / {group.max_count}</div>
                    <div>{group.open ? '공개 그룹' : '비공개 그룹'}</div>
                    <div>생성일: {formatDate(group.create_time)}</div>
                  </div>
                </div>
                
                <div>
                  {group.isMember ? (
                    <button
                      className="py-2 px-4 rounded-md text-white font-medium bg-green-600"
                      disabled
                    >
                      가입됨
                    </button>
                  ) : (
                    <button
                      onClick={() => handleJoinGroup(group.id, group.name)}
                      disabled={joinLoading[group.id]}
                      className={`py-2 px-4 rounded-md text-white font-medium ${
                        joinLoading[group.id]
                          ? 'bg-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 transition-colors'
                      }`}
                    >
                      {joinLoading[group.id] ? '처리 중...' : '가입하기'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {!showOnlyMyGroups && cursor && (
            <div className="text-center mt-4">
              <button
                onClick={() => loadGroups(searchQuery, false)}
                disabled={isLoading}
                className={`py-2 px-6 rounded-md text-white font-medium ${
                  isLoading
                    ? 'bg-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 transition-colors'
                }`}
              >
                {isLoading ? '로딩 중...' : '더 보기'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 