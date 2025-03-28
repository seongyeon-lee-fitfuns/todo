'use client'

import { useState } from 'react'
import RoleManagement from './components/RoleManagement'
import UserRoleManagement from './components/UserRoleManagement'
import PermissionManagement from './components/PermissionManagement'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'roles' | 'permissions' | 'user-roles'>('roles')

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">관리자 페이지</h1>
      
      <div className="flex mb-6 border-b">
        <button
          className={`py-2 px-4 font-medium ${activeTab === 'roles' ? 'border-b-2 border-indigo-800 text-indigo-800 font-bold bg-indigo-50' : 'text-gray-700 hover:text-gray-900'}`}
          onClick={() => setActiveTab('roles')}
        >
          역할 관리
        </button>
        <button
          className={`py-2 px-4 font-medium ${activeTab === 'permissions' ? 'border-b-2 border-indigo-800 text-indigo-800 font-bold bg-indigo-50' : 'text-gray-700 hover:text-gray-900'}`}
          onClick={() => setActiveTab('permissions')}
        >
          권한 관리
        </button>
        <button
          className={`py-2 px-4 font-medium ${activeTab === 'user-roles' ? 'border-b-2 border-indigo-800 text-indigo-800 font-bold bg-indigo-50' : 'text-gray-700 hover:text-gray-900'}`}
          onClick={() => setActiveTab('user-roles')}
        >
          사용자 역할 관리
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 text-gray-800">
        {activeTab === 'roles' && <RoleManagement />}
        {activeTab === 'permissions' && <PermissionManagement />}
        {activeTab === 'user-roles' && <UserRoleManagement />}
      </div>
    </div>
  )
}