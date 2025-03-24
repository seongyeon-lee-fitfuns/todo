import { fetchWithAuth } from '@/app/api/fetchWithAuth';

// RBAC API 호출 함수들

export interface Role {
  role_name: string;
  description: string;
  permissions: string[];
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface UserRole {
  user_id: string;
  roles: string[];
  created_at: string;
  updated_at: string;
}

// 역할 목록 가져오기
export async function listRoles() {
  try {
    const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_NAKAMA_URL}/v2/rpc/rbac_list_roles`, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMessage = errorData?.message || `역할 목록 조회 실패: ${response.status}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const payload = JSON.parse(data.payload);
    const roles = JSON.parse(payload.roles);
    return roles;
  } catch (error) {
    console.error('역할 목록 조회 오류:', error);
    throw error;
  }
}

// 역할 생성
export async function createRole(roleName: string, description: string, permissions: string[] = []) {
  try {
    const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_NAKAMA_URL}/v2/rpc/rbac_create_role?unwrap`, {
      method: 'POST',
      body: JSON.stringify({
        role_name: roleName,
        description,
        permissions,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMessage = errorData?.message || `역할 생성 실패: ${response.status}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.role;
  } catch (error) {
    console.error('역할 생성 오류:', error);
    throw error;
  }
}

// 역할 삭제
export async function deleteRole(roleName: string) {
  try {
    const response = await fetch('/api/rbac-proxy?endpoint=rbac_delete_role', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role_name: roleName,
      }),
    });

    if (!response.ok) {
      throw new Error(`역할 삭제 실패: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('역할 삭제 오류:', error);
    throw error;
  }
}

// 권한 할당
export async function assignPermission(roleName: string, permission: string) {
  try {
    const response = await fetch('/api/rbac-proxy?endpoint=rbac_assign_permission', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role_name: roleName,
        permission,
      }),
    });

    if (!response.ok) {
      throw new Error(`권한 할당 실패: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('권한 할당 오류:', error);
    throw error;
  }
}

// 권한 제거
export async function removePermission(roleName: string, permission: string) {
  try {
    const response = await fetch('/api/rbac-proxy?endpoint=rbac_remove_permission', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role_name: roleName,
        permission,
      }),
    });

    if (!response.ok) {
      throw new Error(`권한 제거 실패: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('권한 제거 오류:', error);
    throw error;
  }
}

// 사용자에게 역할 할당
export async function assignRole(userId: string, roleName: string) {
  try {
    const response = await fetch('/api/rbac-proxy?endpoint=rbac_assign_role', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        role_name: roleName,
      }),
    });

    if (!response.ok) {
      throw new Error(`역할 할당 실패: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('역할 할당 오류:', error);
    throw error;
  }
}

// 사용자에게서 역할 제거
export async function removeRole(userId: string, roleName: string) {
  try {
    const response = await fetch('/api/rbac-proxy?endpoint=rbac_remove_role', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        role_name: roleName,
      }),
    });

    if (!response.ok) {
      throw new Error(`역할 제거 실패: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('역할 제거 오류:', error);
    throw error;
  }
} 