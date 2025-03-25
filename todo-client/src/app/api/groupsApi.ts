// 그룹 인터페이스 정의
export interface NakamaGroup {
  id: string;
  creator_id: string;
  name: string;
  description: string;
  lang_tag: string;
  metadata?: any;
  avatar_url?: string;
  open: boolean;
  edge_count?: number;
  max_count: number;
  create_time?: string;
  update_time?: string;
  // 내가 속한 그룹인지 여부를 표시하는 플래그
  isMember?: boolean;
  state?: number; // 0: 초대 대기중, 1: 멤버, 2: 관리자
}

// 그룹 생성 요청 인터페이스
export interface CreateGroupRequest {
  name: string;
  description?: string;
  langTag?: string;
  open?: boolean;
  maxCount?: number;
  avatarUrl?: string;
}

// 그룹 목록 응답 인터페이스
export interface GroupsListResponse {
  groups: NakamaGroup[];
  cursor?: string;
}

/**
 * 그룹 목록 가져오기
 */
export async function fetchGroups(
  name?: string,
  limit: number = 10,
  cursor?: string
): Promise<GroupsListResponse> {
  try {
    const token = sessionStorage.getItem('nakamaToken');
    if (!token) {
      throw new Error('인증 토큰이 없습니다. 로그인이 필요합니다.');
    }

    let url = `/api/nakama-groups?limit=${limit}`;
    if (name) url += `&name=${encodeURIComponent(name)}`;
    if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || `요청 실패: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('그룹 목록 가져오기 실패:', error);
    throw error;
  }
}

/**
 * 새 그룹 생성하기
 */
export async function createGroup(groupData: CreateGroupRequest): Promise<NakamaGroup> {
  try {
    const token = sessionStorage.getItem('nakamaToken');
    if (!token) {
      throw new Error('인증 토큰이 없습니다. 로그인이 필요합니다.');
    }

    const response = await fetch('/api/nakama-groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(groupData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || `그룹 생성 실패: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('그룹 생성 실패:', error);
    throw error;
  }
}

/**
 * 그룹 가입 요청하기
 */
export async function joinGroup(groupId: string): Promise<void> {
  try {
    const token = sessionStorage.getItem('nakamaToken');
    if (!token) {
      throw new Error('인증 토큰이 없습니다. 로그인이 필요합니다.');
    }

    const response = await fetch(`/api/nakama-groups/${groupId}/join`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || `그룹 가입 요청 실패: ${response.status}`);
    }
  } catch (error) {
    console.error('그룹 가입 요청 실패:', error);
    throw error;
  }
}

/**
 * 사용자의 그룹 목록 가져오기
 */
export async function fetchUserGroups(): Promise<NakamaGroup[]> {
  try {
    const token = sessionStorage.getItem('nakamaToken');
    if (!token) {
      throw new Error('인증 토큰이 없습니다. 로그인이 필요합니다.');
    }

    const response = await fetch('/api/nakama-groups/user', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('사용자 그룹 목록 가져오기 실패 응답:', errorData);
      throw new Error(errorData?.error || `요청 실패: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('사용자 그룹 응답 데이터:', data);
    
    // 그룹 데이터가 없으면 빈 배열 반환
    if (!data || (!data.groups && !Array.isArray(data.user_groups))) {
      console.warn('사용자 그룹 데이터 형식이 예상과 다릅니다:', data);
      return [];
    }

    // API 응답 구조에 따라 그룹 데이터 추출
    let groups = data.groups;
    
    // user_groups 형식으로 응답이 왔을 경우 처리
    if (!groups && Array.isArray(data.user_groups)) {
      groups = data.user_groups.map((ug: any) => ({
        ...ug.group,
        state: ug.state,
        isMember: true // 내 그룹이므로 멤버 표시
      }));
    }
    
    return groups || [];
  } catch (error) {
    console.error('사용자 그룹 목록 가져오기 실패:', error);
    throw error;
  }
}

/**
 * 그룹 목록과 내가 속한 그룹을 함께 표시하는 기능
 */
export async function fetchGroupsWithMembership(
  name?: string,
  limit: number = 10,
  cursor?: string
): Promise<GroupsListResponse> {
  try {
    // 1. 내가 속한 그룹 목록 가져오기 (우선 시도)
    const myGroups = await fetchUserGroups().catch(err => {
      console.error('내 그룹 목록 가져오기 실패:', err);
      return [];
    });
    
    console.log('내 그룹 목록:', myGroups);
    
    const myGroupIds = new Set(myGroups.map(group => group.id));
    console.log('내 그룹 ID 목록:', Array.from(myGroupIds));
    
    // 2. 모든 그룹 목록 가져오기
    const allGroupsResponse = await fetchGroups(name, limit, cursor);
    
    // 3. 모든 그룹에 내가 속했는지 여부 표시
    const groupsWithMembership = allGroupsResponse.groups.map(group => {
      const isMember = myGroupIds.has(group.id);
      console.log(`그룹 ${group.name} (${group.id}) 멤버십 확인:`, isMember);
      
      return {
        ...group,
        isMember
      };
    });
    
    // 4. 결과 반환
    return {
      ...allGroupsResponse,
      groups: groupsWithMembership
    };
  } catch (error) {
    console.error('그룹 멤버십 정보 가져오기 실패:', error);
    // 에러가 발생해도 기본 그룹 목록은 반환
    try {
      return await fetchGroups(name, limit, cursor);
    } catch (fallbackError) {
      console.error('기본 그룹 목록 가져오기도 실패:', fallbackError);
      throw error; // 원래 에러 전달
    }
  }
} 