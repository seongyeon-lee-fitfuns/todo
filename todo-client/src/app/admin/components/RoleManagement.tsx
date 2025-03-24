'use client'

import { useState, useEffect } from 'react'
import { listRoles, createRole, deleteRole, Role } from '../api/rbacApi'

export default function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newRoleName, setNewRoleName] = useState('')
  const [newRoleDescription, setNewRoleDescription] = useState('')
  const [isAddingRole, setIsAddingRole] = useState(false)

  // 역할 목록 불러오기
  const fetchRoles = async () => {
    try {
      setLoading(true)
      const data = await listRoles()
      const roles = data.map((role: any) => ({
        role_name: role.key,
        description: role.value.description,
        created_at: role.create_time,
        updated_at: role.update_time
      }))
      setRoles(roles)
      setError(null)
    } catch (err) {
      setError('역할 목록을 불러오는 중 오류가 발생했습니다')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // 컴포넌트 마운트 시 역할 목록 로드
  useEffect(() => {
    fetchRoles()
  }, [])

  // 새 역할 생성
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newRoleName.trim() || !newRoleDescription.trim()) {
      setError('역할 이름과 설명을 모두 입력해주세요')
      return
    }

    try {
      setLoading(true)
      await createRole(newRoleName, newRoleDescription)
      
      // 입력 필드 초기화
      setNewRoleName('')
      setNewRoleDescription('')
      setIsAddingRole(false)
      
      // 역할 목록 새로고침
      await fetchRoles()
      setError(null)
    } catch (err) {
      setError('역할 생성 중 오류가 발생했습니다')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // 역할 삭제
  const handleDeleteRole = async (roleName: string) => {
    if (!confirm(`정말로 '${roleName}' 역할을 삭제하시겠습니까?`)) {
      return
    }

    try {
      setLoading(true)
      await deleteRole(roleName)
      
      // 역할 목록 새로고침
      await fetchRoles()
      setError(null)
    } catch (err) {
      setError(`'${roleName}' 역할 삭제 중 오류가 발생했습니다`)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">역할 관리</h2>
        <button
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition"
          onClick={() => setIsAddingRole(true)}
        >
          역할 추가
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* 역할 추가 폼 */}
      {isAddingRole && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6 border">
          <h3 className="text-lg font-medium mb-3">새 역할 추가</h3>
          <form onSubmit={handleCreateRole}>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                역할 이름
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="관리자, 일반사용자 등"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                역할 설명
              </label>
              <textarea
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newRoleDescription}
                onChange={(e) => setNewRoleDescription(e.target.value)}
                placeholder="이 역할의 용도와 권한에 대한 설명"
                rows={3}
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                className="px-4 py-2 border rounded-md hover:bg-gray-100"
                onClick={() => setIsAddingRole(false)}
              >
                취소
              </button>
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                disabled={loading}
              >
                {loading ? '처리 중...' : '추가'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 역할 목록 테이블 */}
      {loading && !isAddingRole ? (
        <div className="text-center py-4">
          <div className="spinner"></div>
          역할 정보를 불러오는 중...
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  역할 이름
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  설명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  권한 수
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  생성일
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {roles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    등록된 역할이 없습니다
                  </td>
                </tr>
              ) : (
                roles.map((role) => (
                  <tr key={role.role_name}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      {role.role_name}
                    </td>
                    <td className="px-6 py-4">
                      {role.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {role.permissions?.length || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(role.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteRole(role.role_name)}
                        className="text-red-600 hover:text-red-900"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
} 