'use client'

import { useState, useEffect } from 'react'
import { listRoles, assignPermission, removePermission, Role } from '../api/rbacApi'

export default function PermissionManagement() {
  const [roles, setRoles] = useState<Role[]>([])
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [newPermission, setNewPermission] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddingPermission, setIsAddingPermission] = useState(false)

  // 권한 관리를 위한 상태값 추가
  const [commonPermissions, setCommonPermissions] = useState([
    'read:todos',
    'write:todos',
    'delete:todos',
    'admin:system',
    'admin:users',
    'admin:roles'
  ])

  // 역할 목록 불러오기
  const fetchRoles = async () => {
    try {
      setLoading(true)
      const data = await listRoles()
      setRoles(data)
      
      // 선택된 역할이 있고, 새로 불러온 목록에 해당 역할이 있으면 최신 정보로 업데이트
      if (selectedRole) {
        const updatedRole = data.find((r: Role) => r.role_name === selectedRole.role_name)
        if (updatedRole) {
          setSelectedRole(updatedRole)
        }
      }
      
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

  // 권한 추가
  const handleAssignPermission = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedRole) {
      setError('권한을 추가할 역할을 선택해주세요')
      return
    }
    
    if (!newPermission.trim()) {
      setError('추가할 권한을 입력해주세요')
      return
    }
    
    try {
      setLoading(true)
      await assignPermission(selectedRole.role_name, newPermission)
      
      // 필드 초기화
      setNewPermission('')
      setIsAddingPermission(false)
      
      // 역할 목록 새로고침
      await fetchRoles()
      setError(null)
    } catch (err) {
      setError('권한 할당 중 오류가 발생했습니다')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // 권한 제거
  const handleRemovePermission = async (permission: string) => {
    if (!selectedRole) {
      return
    }
    
    if (!confirm(`정말로 '${selectedRole.role_name}' 역할에서 '${permission}' 권한을 제거하시겠습니까?`)) {
      return
    }

    try {
      setLoading(true)
      await removePermission(selectedRole.role_name, permission)
      
      // 역할 목록 새로고침
      await fetchRoles()
      setError(null)
    } catch (err) {
      setError(`권한 제거 중 오류가 발생했습니다`)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // 권한 이름이 이미 존재하는지 확인
  const permissionExists = (permission: string) => {
    if (!selectedRole || !selectedRole.permissions) return false
    return selectedRole.permissions.includes(permission)
  }

  // 권한 선택 핸들러
  const handlePermissionSelect = (permission: string) => {
    setNewPermission(permission)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">권한 관리</h2>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* 역할 선택 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          역할 선택
        </label>
        <select
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedRole?.role_name || ''}
          onChange={(e) => {
            const role = roles.find((r: Role) => r.role_name === e.target.value)
            setSelectedRole(role || null)
          }}
        >
          <option value="">-- 역할 선택 --</option>
          {roles.map((role) => (
            <option key={role.role_name} value={role.role_name}>
              {role.role_name}
            </option>
          ))}
        </select>
      </div>

      {/* 역할 정보 표시 */}
      {selectedRole && (
        <>
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
            <h3 className="text-lg font-medium mb-2">{selectedRole.role_name}</h3>
            <p className="text-gray-600 mb-4">{selectedRole.description}</p>
            
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-md font-medium">권한 목록</h4>
              <button
                onClick={() => setIsAddingPermission(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
              >
                권한 추가
              </button>
            </div>
            
            {/* 권한 추가 폼 */}
            {isAddingPermission && (
              <div className="bg-white p-4 rounded-lg mb-4 border">
                <h4 className="text-md font-medium mb-3">권한 추가</h4>
                <form onSubmit={handleAssignPermission}>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      권한 이름
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={newPermission}
                        onChange={(e) => setNewPermission(e.target.value)}
                        placeholder="권한 이름 (예: read:todos)"
                        required
                      />
                      <div className="relative inline-block text-left">
                        <select
                          className="h-full border border-gray-300 text-gray-700 py-2 px-3 rounded leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onChange={(e) => handlePermissionSelect(e.target.value)}
                        >
                          <option value="">일반 권한</option>
                          {commonPermissions.map((permission) => (
                            <option key={permission} value={permission}>
                              {permission}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {newPermission && permissionExists(newPermission) && (
                      <p className="text-red-500 text-sm mt-1">이미 역할에 할당된 권한입니다</p>
                    )}
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      className="px-4 py-2 border rounded-md hover:bg-gray-100"
                      onClick={() => setIsAddingPermission(false)}
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                      disabled={loading || !newPermission || permissionExists(newPermission)}
                    >
                      {loading ? '처리 중...' : '추가'}
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            {/* 권한 목록 */}
            {selectedRole.permissions && selectedRole.permissions.length > 0 ? (
              <ul className="space-y-2">
                {selectedRole.permissions.map((permission) => (
                  <li 
                    key={permission} 
                    className="flex justify-between items-center bg-white p-3 rounded border"
                  >
                    <span className="font-mono text-sm">{permission}</span>
                    <button
                      onClick={() => handleRemovePermission(permission)}
                      className="text-red-600 hover:text-red-900 text-sm"
                    >
                      제거
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">이 역할에 할당된 권한이 없습니다</p>
            )}
          </div>
        </>
      )}

      {!selectedRole && !loading && (
        <div className="text-center py-4 text-gray-500">
          권한을 관리할 역할을 선택해주세요
        </div>
      )}

      {loading && (
        <div className="text-center py-4">
          <div className="spinner"></div>
          정보를 불러오는 중...
        </div>
      )}
    </div>
  )
} 