import { fetchWithAuth } from './fetchWithAuth';

export interface Todo {
	id: number;
	text: string;
	completed: boolean;
}

export interface TodoTitle {
	id: string;
	name: string;
	createTime?: string;
}

interface TodoItem {
	collection: string;
	key: string;
	value: string;
	version: string;
	permissionRead: number;
	permissionWrite: number;
}

type TodoReq = TodoItem[];

/**
 * Todo 타이틀 목록 조회
 */
export async function fetchTodoTitles(userId: string) {
	try {
		const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_NAKAMA_URL}/v2/storage/todo_titles?user_id=${userId}&limit=100`);
		
		if (!response.ok) {
			const errorData = await response.json().catch(() => null);
			const errorMessage = errorData?.message || `요청 실패: ${response.status}`;
			throw new Error(errorMessage);
		}
		
		const data = await response.json();
		
		// 응답 데이터가 없으면 빈 배열 반환
		if (!data.objects || data.objects.length === 0) {
			return [];
		}
		
		// Nakama 스토리지 객체를 TodoTitle 객체로 변환
		return data.objects.map((item: any) => {
			try {
				return JSON.parse(item.value);
			} catch (e) {
				console.error('Todo 타이틀 파싱 오류:', e);
				return null;
			}
		}).filter(Boolean);
	} catch (error) {
		console.error('Todo 타이틀 목록 조회 실패:', error);
		throw error;
	}
}

/**
 * 새 Todo 타이틀 생성
 */
export async function createTodoTitle(title: string, userId: string) {
	try {
		const titleId = Date.now().toString();
		const newTitle: TodoTitle = {
			id: titleId,
			name: title,
			createTime: new Date().toISOString()
		};
		
		const todoTitleItem: TodoItem = {
			collection: 'todo_titles',
			key: titleId,
			value: JSON.stringify(newTitle),
			version: '*',
			permissionRead: 2, // 소유자 및 인증된 사용자가 읽기 가능
			permissionWrite: 1  // 소유자만 쓰기 가능
		};
		
		const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_NAKAMA_URL}/v2/storage`, {
			method: 'PUT',
			body: JSON.stringify({ objects: [todoTitleItem] }),
		});
		
		if (!response.ok) {
			const errorData = await response.json().catch(() => null);
			const errorMessage = errorData?.message || `요청 실패: ${response.status}`;
			throw new Error(errorMessage);
		}
		
		const responseData = await response.json();
		return { ...newTitle, version: responseData.objects?.[0]?.version || '*' };
	} catch (error) {
		console.error('Todo 타이틀 생성 실패:', error);
		throw error;
	}
}

/**
 * Todo 타이틀 삭제
 */
export async function deleteTodoTitle(titleId: string) {
	try {
		const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_NAKAMA_URL}/v2/storage/todo_titles/${titleId}`, {
			method: 'DELETE'
		});
		
		if (!response.ok) {
			const errorData = await response.json().catch(() => null);
			const errorMessage = errorData?.message || `요청 실패: ${response.status}`;
			throw new Error(errorMessage);
		}
		
		return true;
	} catch (error) {
		console.error('Todo 타이틀 삭제 실패:', error);
		throw error;
	}
}

/**
 * Nakama 스토리지에서 Todo 목록 조회
 */
export async function fetchTodos(title: string, userId: string) {
	try {
		const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_NAKAMA_URL}/v2/storage/${title}/${userId}?limit=100`, {
			method: 'GET'
		});
		if (!response.ok) {
			const errorData = await response.json().catch(() => null);
			const errorMessage = errorData?.message || `요청 실패: ${response.status}`;
			throw new Error(errorMessage);
		}
		
		const data = await response.json();
		console.log('data', data);
		
		// Nakama 스토리지 객체를 Todo 객체로 변환
		return data.objects?.map((item: any) => {
			try {
				return JSON.parse(item.value);
			} catch (e) {
				console.error('Todo 파싱 오류:', e);
				return null;
			}
		}).filter(Boolean) || [];

	} catch (error) {
		console.error('Todo 목록 조회 실패:', error);
		throw error;
	}
}

/**
 * Todo 항목 생성
 */
export async function createTodo(todo: Todo, title: string) {
	try {
		const todoItem: TodoItem = {
			collection: title,
			key: todo.id.toString(),
			value: JSON.stringify(todo),
			version: '*', // 새 항목은 버전을 서버가 할당
			permissionRead: 2, // 2: 소유자 및 인증된 사용자
			permissionWrite: 1  // 1: 소유자만
		};
		
		const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_NAKAMA_URL}/v2/storage`, {
			method: 'PUT',
			body: JSON.stringify({ objects: [todoItem] }),
		});
		
		if (!response.ok) {
			const errorData = await response.json().catch(() => null);
			const errorMessage = errorData?.message || `요청 실패: ${response.status}`;
			throw new Error(errorMessage);
		}
		
		return await response.json();
	} catch (error) {
		console.error('Todo 생성 실패:', error);
		throw error;
	}
}

/**
 * Todo 항목 업데이트
 */
export async function updateTodo(todo: Todo, version: string, title: string) {
	try {
		const todoItem: TodoItem = {
			collection: title,
			key: todo.id.toString(),
			value: JSON.stringify(todo),
			version: version, // 버전 정보 필요
			permissionRead: 2,
			permissionWrite: 1
		};
		
		const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_NAKAMA_URL}/v2/storage`, {
			method: 'PUT',
			body: JSON.stringify({ objects: [todoItem] }),
		});
		
		if (!response.ok) {
			const errorData = await response.json().catch(() => null);
			const errorMessage = errorData?.message || `요청 실패: ${response.status}`;
			throw new Error(errorMessage);
		}
		
		return await response.json();
	} catch (error) {
		console.error('Todo 업데이트 실패:', error);
		throw error;
	}
}

/**
 * Todo 항목 삭제
 */
export async function deleteTodoItem(collection: string, todoId: string) {
	try {
		const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_NAKAMA_URL}/v2/storage/${collection}/${todoId}`, {
			method: 'DELETE'
		});
		
		if (!response.ok) {
			const errorData = await response.json().catch(() => null);
			const errorMessage = errorData?.message || `요청 실패: ${response.status}`;
			throw new Error(errorMessage);
		}
		
		return true;
	} catch (error) {
		console.error('Todo 삭제 실패:', error);
		throw error;
	}
}

/**
 * Todo 버전 정보 조회
 */
export async function fetchTodoVersion(collection: string, todoId: string) {
	try {
		const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_NAKAMA_URL}/v2/storage/${collection}/${todoId}`);
		
		if (!response.ok) {
			const errorData = await response.json().catch(() => null);
			const errorMessage = errorData?.message || `요청 실패: ${response.status}`;
			throw new Error(errorMessage);
		}
		
		const data = await response.json();
		return data.objects[0]?.version || '*';
	} catch (error) {
		console.error('Todo 버전 조회 실패:', error);
		return '*'; // 조회 실패 시 새 버전으로 간주
	}
} 