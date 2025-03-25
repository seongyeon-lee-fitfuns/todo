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

// 기본 TodoTitle 인터페이스
export interface TodoTitleBase {
	id: string;
	name: string;
	createTime?: string;
}

// 메타데이터를 포함한 TodoTitle 인터페이스
export interface TodoTitleInfo extends TodoTitleBase {
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

// TodoTitleInfo 객체 생성 유틸리티 함수
export function createTodoTitleInfoFromStorage(storageObject: NakamaStorageObject): TodoTitleInfo {
	try {
		const titleBase = JSON.parse(storageObject.value) as TodoTitleBase;
		return {
			...titleBase,
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
		console.error('TodoTitle 파싱 오류:', e);
		throw new Error('저장된 TodoTitle 항목을 파싱할 수 없습니다.');
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

// TodoTitle 스토리지 데이터로부터 TodoTitleInfo 배열 생성
export function createTodoTitleInfosFromStorage(storageObjects: NakamaStorageObject[]): TodoTitleInfo[] {
	return storageObjects
		.map(obj => {
			try {
				return createTodoTitleInfoFromStorage(obj);
			} catch (e) {
				console.error('TodoTitle 파싱 오류:', e, obj);
				return null;
			}
		})
		.filter(Boolean) as TodoTitleInfo[];
}

/**
 * Todo 타이틀 목록 조회
 */
export async function fetchTodoTitlesWithNakamaApi() {
	const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_NAKAMA_URL}/v2/rpc/read_todo_titles`, {
		method: 'GET',
	});
	if (!response.ok) {
		const errorData = await response.json().catch(() => null);
		const errorMessage = errorData?.message || `요청 실패: ${response.status}`;
		throw new Error(errorMessage);
	}
	const result = await response.json();
	const res = JSON.parse(result.payload).titles;
	if (!res || Object.keys(res).length === 0) {
		return [];
	}
	return res;
}

export async function createTodoTitleWithNakamaApi(title: string) {
	try {
		const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_NAKAMA_URL}/v2/rpc/create_todo_title?unwrap`, {
			method: 'POST',
			body: JSON.stringify({ title: title })
		});
		if (!response.ok) {
			const errorData = await response.json().catch(() => null);
			const errorMessage = errorData?.message || `요청 실패: ${response.status}`;
			throw new Error(errorMessage);
		}
		const result = await response.json();
		return result.titles;
	} catch (error) {
		console.error('Todo 타이틀 생성 실패:', error);
		throw error;
	}
}

/**
 * Todo 타이틀 삭제, 사실 내부적으로는 update...
 */
export async function deleteTodoTitleWithNakamaApi(title: string) {
	const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_NAKAMA_URL}/v2/rpc/delete_todo_title?unwrap`, {
		method: 'POST',
		body: JSON.stringify({ title: title })
	});
	if (!response.ok) {
		const errorData = await response.json().catch(() => null);
		const errorMessage = errorData?.message || `요청 실패: ${response.status}`;
		throw new Error(errorMessage);
	}
	const result = await response.json();
	return result.titles;
}

/**
 * Nakama 스토리지에서 Todo 목록 조회
 */
export async function fetchTodos(title: string): Promise<TodoInfo[]> {
	try {
		const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_NAKAMA_URL}/v2/storage/${title}?limit=100`, {
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
 * Nakama RPC를 사용하여 Todo 항목 업데이트/생성
 * RPC 함수를 직접 호출합니다.
 */
export async function updateTodoWithNakamaApi(todo: TodoInfo, collection: string): Promise<TodoInfo> {
	try {
		// 버전 정보 가져오기
		const version = todo.meta?.version || '*';
		
		// RPC 호출용 객체 생성
		const rpcPayload = {
			objects: {
				collection: collection,
				key: todo.id.toString(),
				value: JSON.stringify({
					id: todo.id,
					text: todo.text,
					completed: todo.completed
				}),
				version: version
			}
		};
		
		// Nakama RPC 직접 호출
		const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_NAKAMA_URL}/v2/rpc/update_todo?unwrap`, {
			method: 'POST',
			body: JSON.stringify(rpcPayload),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => null);
			const errorMessage = errorData?.error || `요청 실패: ${response.status}`;
			throw new Error(errorMessage);
		}
		
		const result = await response.json();
		
		if (!result || result.error) {
			throw new Error(result?.error || 'Todo 업데이트에 실패했습니다');
		}

		// meta가 없는 경우 기본값 생성
		const currentMeta = todo.meta || {
			collection: collection,
			create_time: new Date().toISOString(),
			key: todo.id.toString(),
			permission_read: 2,
			permission_write: 1,
			update_time: new Date().toISOString(),
			user_id: '',
			version: '*'
		};
		
		// 업데이트된 Todo 반환
		return {
			...todo,
			meta: {
				...currentMeta,
				update_time: result.update_time || currentMeta.update_time,
				version: result.version || currentMeta.version
			}
		};
	} catch (error) {
		console.error('Nakama RPC 요청 실패:', error);
		throw error;
	}
}

/**
 * Nakama RPC를 사용하여 새 Todo 항목 생성
 */
export async function createTodoWithNakamaApi(todo: TodoBase, collection: string): Promise<TodoInfo> {
	try {
		// RPC 호출용 객체 생성
		const rpcPayload = {
			objects: {
				collection: collection,
				key: todo.id.toString(),
				value: JSON.stringify({
					id: todo.id,
					text: todo.text,
					completed: todo.completed
				}),
				version: '*' // 새 항목은 서버가 버전 할당
			}
		};
		
		// Nakama RPC 직접 호출
		const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_NAKAMA_URL}/v2/rpc/create_todo?unwrap`, {
			method: 'POST',
			body: JSON.stringify(rpcPayload),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => null);
			const errorMessage = errorData?.error || `요청 실패: ${response.status}`;
			throw new Error(errorMessage);
		}
		
		const result = await response.json();
		
		if (!result || result.error) {
			throw new Error(result?.error || 'Todo 생성에 실패했습니다');
		}

		// 메타데이터가 포함된 Todo 항목 반환
		return {
			...todo,
			meta: {
				collection: collection,
				create_time: result.create_time || new Date().toISOString(),
				key: todo.id.toString(),
				permission_read: 2,
				permission_write: 1,
				update_time: result.update_time || new Date().toISOString(),
				user_id: result.user_id || '',
				version: result.version || '*'
			}
		};
	} catch (error) {
		console.error('Nakama RPC Todo 생성 실패:', error);
		throw error;
	}
}

/**
 * Nakama RPC를 사용하여 Todo 항목 삭제
 */
export async function deleteTodoWithNakamaApi(collection: string, todoId: string, version: string): Promise<boolean> {
	try {
		// RPC 호출용 객체 생성
		const rpcPayload = {
			objects: {
				collection: collection,
				key: todoId,
				version: version
			}
		};
		
		// Nakama RPC 직접 호출
		const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_NAKAMA_URL}/v2/rpc/delete_todo?unwrap`, {
			method: 'POST',
			body: JSON.stringify(rpcPayload),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => null);
			const errorMessage = errorData?.error || `요청 실패: ${response.status}`;
			throw new Error(errorMessage);
		}
		
		const result = await response.json();
		
		if (!result || result.error) {
			throw new Error(result?.error || 'Todo 삭제에 실패했습니다');
		}

		return true;
	} catch (error) {
		console.error('Nakama RPC Todo 삭제 실패:', error);
		throw error;
	}
}