'use client';

import { useState } from 'react';
import { CreateGroupRequest, createGroup } from '../api/groupsApi';

export default function GroupCreation() {
  const [groupData, setGroupData] = useState<CreateGroupRequest>({
    name: '',
    description: '',
    open: true,
    maxCount: 100
  });
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setGroupData({
        ...groupData,
        [name]: target.checked
      });
    } else if (name === 'maxCount') {
      setGroupData({
        ...groupData,
        [name]: parseInt(value)
      });
    } else {
      setGroupData({
        ...groupData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (!groupData.name.trim()) {
        throw new Error('그룹 이름은 필수 항목입니다');
      }

      const result = await createGroup(groupData);
      setSuccess(`"${result.name}" 그룹이 성공적으로 생성되었습니다!`);
      setGroupData({
        name: '',
        description: '',
        open: true,
        maxCount: 100
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '그룹 생성 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">새 그룹 만들기</h2>
      
      {error && (
        <div className="bg-red-500/80 text-white p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-500/80 text-white p-3 rounded-md mb-4">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="name" className="block text-white text-sm font-medium mb-2">
            그룹 이름 *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={groupData.name}
            onChange={handleChange}
            className="w-full bg-white/20 border border-white/30 rounded-md px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="그룹 이름을 입력하세요"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="description" className="block text-white text-sm font-medium mb-2">
            그룹 설명
          </label>
          <textarea
            id="description"
            name="description"
            value={groupData.description}
            onChange={handleChange}
            className="w-full bg-white/20 border border-white/30 rounded-md px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="그룹에 대한 설명을 입력하세요"
            rows={3}
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="maxCount" className="block text-white text-sm font-medium mb-2">
            최대 인원 수
          </label>
          <input
            type="number"
            id="maxCount"
            name="maxCount"
            value={groupData.maxCount}
            onChange={handleChange}
            min={2}
            max={1000}
            className="w-full bg-white/20 border border-white/30 rounded-md px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="mb-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="open"
              name="open"
              checked={groupData.open}
              onChange={(e) => setGroupData({...groupData, open: e.target.checked})}
              className="h-4 w-4 text-blue-600 border-white/30 rounded focus:ring-blue-500"
            />
            <label htmlFor="open" className="ml-2 block text-white text-sm">
              공개 그룹 (누구나 가입 가능)
            </label>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-2 px-4 rounded-md text-white font-medium transition-colors ${
            isLoading
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          }`}
        >
          {isLoading ? '처리 중...' : '그룹 생성하기'}
        </button>
      </form>
    </div>
  );
} 