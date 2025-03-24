'use client'

import { useState, useEffect } from 'react'
import { listRoles, assignRole, removeRole, Role } from '../api/rbacApi'

interface User {
  user_id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  roles?: string[];
}

export default function UserRoleManagement() {
  const [roles, setRoles] = useState<Role[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedRole, setSelectedRole] = useState('')
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddingUser, setIsAddingUser] = useState(false)

  // 사용자 목록 (실제 구현에서는 API 호출로 가져와야 합니다)
  const mockUsers: User[] = [
    { user_id: 'user1', username: 'user1', display_name: '사용자1' },
    { user_id: 'user2', username: 'user2', display_name: '사용자2' },
    { user_id: 'admin1', username: 'admin1', display_name: '관리자1' },
  ]

  // 역할 목록 불러오기
  const fetchRoles = async () => {
    try {
      setLoading(true)
      const data = await listRoles()
      setRoles(data)
      setError(null)
    } catch (err) {
      setError('역할 목록을 불러오는 중 오류가 발생했습니다')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // 사용자 목록 불러오기 (실제 구현에서는 API 호출)
  const fetchUsers = async () => {
    try {
      // 실제 구현: API 호출로 사용자 목록 가져오기
      // const response = await fetch('/api/users');
      // const data = await response.json();
      // setUsers(data);
      
      // 임시 데이터 사용
      setUsers(mockUsers)
    } catch (err) {
      console.error('사용자 목록을 불러오는 중 오류가 발생했습니다', err)
    }
  }

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchRoles()
    fetchUsers()
  }, [])

  // 역할 할당
  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedUser) {
      setError('역할을 할당할 사용자를 선택해주세요')
      return
    }
    
    if (!selectedRole) {
      setError('할당할 역할을 선택해주세요')
      return
    }
    
    try {
      setLoading(true)
      await assignRole(selectedUser.user_id, selectedRole)
      
      // 사용자 정보 업데이트 (실제 구현에서는 API 호출로 갱신)
      const updatedUser = { ...selectedUser }
      updatedUser.roles = updatedUser.roles || []
      if (!updatedUser.roles.includes(selectedRole)) {
        updatedUser.roles.push(selectedRole)
      }
      
      setSelectedUser(updatedUser)
      setSelectedRole('')
      
      setError(null)
    } catch (err) {
      setError('역할 할당 중 오류가 발생했습니다')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // 역할 제거
  const handleRemoveRole = async (roleName: string) => {
    if (!selectedUser) {
      return
    }
    
    if (!confirm(`정말로 '${selectedUser.display_name || selectedUser.username}' 사용자에게서 '${roleName}' 역할을 제거하시겠습니까?`)) {
      return
    }

    try {
      setLoading(true)
      await removeRole(selectedUser.user_id, roleName)
      
      // 사용자 정보 업데이트 (실제 구현에서는 API 호출로 갱신)
      const updatedUser = { ...selectedUser }
      updatedUser.roles = updatedUser.roles?.filter((r: string) => r !== roleName) || []
      setSelectedUser(updatedUser)
      
      setError(null)
    } catch (err) {
      setError(`역할 제거 중 오류가 발생했습니다`)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // 사용자 아이디 추가
  const handleAddUser = () => {
    if (!userId.trim()) {
      setError('사용자 ID를 입력해주세요')
      return
    }
    
    // 이미 목록에 있는지 확인
    if (users.some((u: User) => u.user_id === userId)) {
      setError('이미 목록에 있는 사용자입니다')
      return
    }
    
    // 사용자 추가 (실제 구현에서는 먼저 사용자 정보를 검색해야 함)
    const newUser: User = {
      user_id: userId,
      username: userId,
      display_name: userId,
      roles: []
    }
    
    setUsers([...users, newUser])
    setSelectedUser(newUser)
    setUserId('')
    setIsAddingUser(false)
    setError(null)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">사용자 역할 관리</h2>
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition"
          onClick={() => setIsAddingUser(true)}
        >
          사용자 추가
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* 사용자 추가 폼 */}
      {isAddingUser && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6 border">
          <h3 className="text-lg font-medium mb-3">사용자 추가</h3>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              사용자 ID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="사용자 ID 입력"
                required
              />
              <button
                onClick={handleAddUser}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                disabled={!userId.trim()}
              >
                추가
              </button>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              className="px-4 py-2 border rounded-md hover:bg-gray-100"
              onClick={() => setIsAddingUser(false)}
            >
              취소
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        {/* 사용자 목록 */}
        <div className="w-full md:w-1/3 mb-6">
          <h3 className="text-lg font-medium mb-3">사용자 목록</h3>
          <div className="bg-white rounded-md border overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {users.length === 0 ? (
                <li className="p-4 text-gray-500 text-center">등록된 사용자가 없습니다</li>
              ) : (
                users.map((user) => (
                  <li 
                    key={user.user_id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 ${selectedUser?.user_id === user.user_id ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelectedUser(user)}
                  >
                    <div className="font-medium">
                      {user.display_name || user.username}
                    </div>
                    <div className="text-sm text-gray-500">
                      {user.user_id}
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        {/* 사용자 역할 관리 */}
        <div className="w-full md:w-2/3">
          {selectedUser ? (
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-lg font-medium mb-4">
                {selectedUser.display_name || selectedUser.username}의 역할
              </h3>
              
              {/* 역할 할당 폼 */}
              <form onSubmit={handleAssignRole} className="mb-6">
                <div className="flex gap-2">
                  <select
                    className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    required
                  >
                    <option value="">-- 역할 선택 --</option>
                    {roles.map((role) => (
                      <option 
                        key={role.role_name} 
                        value={role.role_name}
                        disabled={selectedUser.roles?.includes(role.role_name)}
                      >
                        {role.role_name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                    disabled={loading || !selectedRole}
                  >
                    {loading ? '처리 중...' : '할당'}
                  </button>
                </div>
              </form>
              
              {/* 할당된 역할 목록 */}
              <h4 className="text-md font-medium mb-3">할당된 역할</h4>
              {!selectedUser.roles || selectedUser.roles.length === 0 ? (
                <p className="text-gray-500 italic">할당된 역할이 없습니다</p>
              ) : (
                <ul className="space-y-2">
                  {selectedUser.roles.map((roleName) => {
                    const role = roles.find((r: Role) => r.role_name === roleName);
                    return (
                      <li 
                        key={roleName} 
                        className="flex justify-between items-center bg-gray-50 p-3 rounded border"
                      >
                        <div>
                          <div className="font-medium">{roleName}</div>
                          {role && <div className="text-sm text-gray-600">{role.description}</div>}
                        </div>
                        <button
                          onClick={() => handleRemoveRole(roleName)}
                          className="text-red-600 hover:text-red-900 text-sm"
                        >
                          제거
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border">
              <p className="text-gray-500">관리할 사용자를 선택해주세요</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 