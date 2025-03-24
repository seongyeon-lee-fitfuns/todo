import { fetchWithAuth } from './fetchWithAuth';

// 기본 Todo 항목 인터페이스
export interface TodoBase {
	id: number;
	text: string;
	completed: boolean;
}

// Nakama 스토리지에서 반환되는 메타데이터 포함 Todo 인터페이스
export interface TodoInfo extends TodoBase {
	meta?: {
		collection: string;
		create_time: string;
		key: string;
		permission_read: number;
		permission_write: number;
		update_time: string;
		user_id: string;
		version: string;
	};
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

// Nakama 스토리지 응답 인터페이스
export interface NakamaStorageObject {
	collection: string;
	create_time: string;
	key: string;
	permission_read: number;
	permission_write: number;
	update_time: string;
	user_id: string;
	value: string;
	version: string;
}

// TodoInfo 객체 생성 유틸리티 함수
export function createTodoInfoFromStorage(storageObject: NakamaStorageObject): TodoInfo {
	try {
		const todoBase = JSON.parse(storageObject.value) as TodoBase;
		return {
			...todoBase,
			meta: {
				collection: storageObject.collection,
				create_time: storageObject.create_time,
				key: storageObject.key,
				permission_read: storageObject.permission_read,
				permission_write: storageObject.permission_write,
				update_time: storageObject.update_time,
				user_id: storageObject.user_id,
				version: storageObject.version
			}
		};
	} catch (e) {
		console.error('Todo 파싱 오류:', e);
		throw new Error('저장된 Todo 항목을 파싱할 수 없습니다.');
	}
}

// Todo 스토리지 데이터로부터 TodoInfo 배열 생성
export function createTodoInfosFromStorage(storageObjects: NakamaStorageObject[]): TodoInfo[] {
	return storageObjects
		.map(obj => {
			try {
				return createTodoInfoFromStorage(obj);
			} catch (e) {
				console.error('Todo 파싱 오류:', e, obj);
				return null;
			}
		})
		.filter(Boolean) as TodoInfo[];
}

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
		
		// TODO: 추후 rpc를 활용하여 중복 체크하면 좋을 듯
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
export async function fetchTodos(title: string, userId: string): Promise<TodoInfo[]> {
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
		if (!data.objects || !Array.isArray(data.objects)) {
			return [];
		}
		
		// NakamaStorageObject 배열을 TodoInfo 배열로 변환
		return createTodoInfosFromStorage(data.objects);
	} catch (error) {
		console.error('Todo 목록 조회 실패:', error);
		throw error;
	}
}

/**
 * Todo 항목 생성
 */
export async function createTodo(todo: TodoBase, title: string): Promise<TodoInfo> {
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
		
		const result = await response.json();
		console.log('result', result);
		
		// 응답에서 첫 번째 객체 가져오기
		const storageObject = result.acks?.[0];
		if (!storageObject) {
			throw new Error('서버 응답에서 Todo 항목을 찾을 수 없습니다');
		}
		
		// 통합된 TodoInfo 객체 반환
		return {
			...todo,
			meta: {
				collection: storageObject.collection,
				create_time: storageObject.create_time,
				key: storageObject.key,
				permission_read: storageObject.permission_read,
				permission_write: storageObject.permission_write,
				update_time: storageObject.update_time,
				user_id: storageObject.user_id,
				version: storageObject.version
			}
		};
	} catch (error) {
		console.error('Todo 생성 실패:', error);
		throw error;
	}
}

/**
 * Todo 항목 업데이트
 */
export async function updateTodo(todo: TodoInfo, title: string): Promise<TodoInfo> {
	try {
		// 버전 정보 가져오기
		const version = todo.meta?.version || '*';
		
		const todoItem: TodoItem = {
			collection: title,
			key: todo.id.toString(),
			value: JSON.stringify({
				id: todo.id,
				text: todo.text,
				completed: todo.completed
			}),
			version: version,
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
		
		const result = await response.json();
		
		// 응답에서 첫 번째 객체 가져오기
		const storageObject = result.acks?.[0];
		if (!storageObject) {
			throw new Error('서버 응답에서 Todo 항목을 찾을 수 없습니다');
		}
		
		// meta가 없는 경우 기본값 생성
		const currentMeta = todo.meta || {
			collection: title,
			create_time: new Date().toISOString(),
			key: todo.id.toString(),
			permission_read: 2,
			permission_write: 1,
			update_time: new Date().toISOString(),
			user_id: '',
			version: '*'
		};
		
		// 메타데이터 업데이트
		return {
			...todo,
			meta: {
				...currentMeta,
				update_time: storageObject.update_time,
				version: storageObject.version
			}
		};
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