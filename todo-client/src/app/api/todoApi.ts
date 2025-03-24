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
export async function fetchTodoTitles(userId: string): Promise<TodoTitleInfo[]> {
	try {
		const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_NAKAMA_URL}/v2/storage/todo_titles?limit=100`);
		
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
		
		try {
			// 첫 번째 객체 사용 (todo_titles 컬렉션이 있는 경우)
			const firstObject = data.objects[0];
			const parsedValue = JSON.parse(firstObject.value);
			
			// titles 배열이 있는 경우
			if (parsedValue.titles && Array.isArray(parsedValue.titles)) {
				// 각 항목에 메타데이터 추가
				return parsedValue.titles.map((title: TodoTitleBase) => ({
					...title,
					meta: {
						collection: firstObject.collection,
						create_time: firstObject.create_time,
						key: firstObject.key,
						permission_read: firstObject.permission_read,
						permission_write: firstObject.permission_write,
						update_time: firstObject.update_time,
						user_id: firstObject.user_id,
						version: firstObject.version
					}
				}));
			} 
		
			// 단일 객체인 경우 배열로 변환
			return [{
				...parsedValue,
				meta: {
					collection: firstObject.collection,
					create_time: firstObject.create_time,
					key: firstObject.key,
					permission_read: firstObject.permission_read,
					permission_write: firstObject.permission_write,
					update_time: firstObject.update_time,
					user_id: firstObject.user_id,
					version: firstObject.version
				}
			}];
		} catch (e) {
			console.error('Todo 타이틀 파싱 실패:', e);
			return [];
		}
	} catch (error) {
		console.error('Todo 타이틀 목록 조회 실패:', error);
		throw error;
	}
}

/**
 * 새 Todo 타이틀 생성
 */
export async function createTodoTitle(title: string, userId: string): Promise<TodoTitleInfo> {
	try {
		// 먼저 기존 todo_titles 컬렉션이 있는지 확인
		const checkResponse = await fetchWithAuth(`${process.env.NEXT_PUBLIC_NAKAMA_URL}/v2/storage/todo_titles?limit=100`);
		
		if (!checkResponse.ok) {
			const errorData = await checkResponse.json().catch(() => null);
			const errorMessage = errorData?.message || `요청 실패: ${checkResponse.status}`;
			throw new Error(errorMessage);
		}
		
		const checkData = await checkResponse.json();
		const collectionExists = checkData.objects && checkData.objects.length > 0;
		
		// 새 타이틀 생성
		const titleId = Date.now().toString();
		const newTitle: TodoTitleBase = {
			id: titleId,
			name: title,
			createTime: new Date().toISOString()
		};
		
		let key, version;
		let existingTitles: TodoTitleInfo[] = [];
		
		// 기존 컬렉션이 있으면 데이터를 확인하고 새 타이틀 항목을 추가
		if (collectionExists) {
			try {
				// 첫 번째 객체 사용 (todo_titles 컬렉션이 있는 경우)
				const firstObject = checkData.objects[0];
				const existingData = JSON.parse(firstObject.value);
				
				// 이미 타이틀 목록이 배열 형태로 저장되어 있는 경우
				if (Array.isArray(existingData)) {
					existingTitles = existingData;
				} else if (existingData.titles && Array.isArray(existingData.titles)) {
					existingTitles = existingData.titles;
				} else {
					// 단일 객체인 경우, 배열로 변환
					existingTitles = [existingData];
				}
				
				// 키와 버전 저장
				key = firstObject.key;
				version = firstObject.version;
			} catch (e) {
				console.error('기존 todo_titles 파싱 실패:', e);
				// 파싱 실패해도 계속 진행
				key = titleId;
				version = '*';
				existingTitles = [];
			}
		} else {
			// 컬렉션이 없는 경우 기본값 설정
			key = titleId;
			version = '*';
		}
		
		// 이미 존재하는 타이틀인지 확인 (id로 비교)
		const isDuplicate = existingTitles.some(item => 
			(item.id === newTitle.id) || (item.name && item.name === newTitle.name)
		);
		
		if (!isDuplicate) {
			// 중복이 아니면 추가
			existingTitles.push(newTitle);
		}
		
		// JSON 형태로 titles 배열을 포함한 객체 생성
		const valueObject = {
			titles: existingTitles
		};
		
		// todo_titles 컬렉션 항목 생성
		const todoTitleItem: TodoItem = {
			collection: 'todo_titles',
			key: key,
			value: JSON.stringify(valueObject), // 객체를 JSON 문자열로 변환
			version: version,
			permissionRead: 2, // 소유자 및 인증된 사용자가 읽기 가능
			permissionWrite: 1  // 소유자만 쓰기 가능
		};
		
		const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_NAKAMA_URL}/v2/storage`, {
			method: 'PUT',
			body: JSON.stringify({ objects: [todoTitleItem] })
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
			throw new Error('서버 응답에서 TodoTitle 항목을 찾을 수 없습니다');
		}
		
		// 통합된 TodoTitleInfo 객체 반환
		return {
			...newTitle,
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
		console.error('Todo 타이틀 생성 실패:', error);
		throw error;
	}
}

/**
 * Todo 타이틀 업데이트
 */
export async function updateTodoTitle(todoTitle: TodoTitleInfo): Promise<TodoTitleInfo> {
	try {
		if (!todoTitle.meta) {
			throw new Error('메타데이터가 없는 TodoTitle은 업데이트할 수 없습니다.');
		}
		
		// 먼저 기존 데이터 조회
		const checkResponse = await fetchWithAuth(`${process.env.NEXT_PUBLIC_NAKAMA_URL}/v2/storage/todo_titles?limit=100`);
		
		if (!checkResponse.ok) {
			const errorData = await checkResponse.json().catch(() => null);
			const errorMessage = errorData?.message || `요청 실패: ${checkResponse.status}`;
			throw new Error(errorMessage);
		}
		
		const checkData = await checkResponse.json();
		const collectionExists = checkData.objects && checkData.objects.length > 0;
		
		if (!collectionExists) {
			throw new Error('기존 Todo 타이틀 데이터를 찾을 수 없습니다.');
		}
		
		// 기존 데이터에서 업데이트하려는 항목 제외하고 나머지 유지
		const firstObject = checkData.objects[0];
		let updatedTitles: TodoTitleBase[] = [];
		
		try {
			const parsedValue = JSON.parse(firstObject.value);
			
			if (parsedValue.titles && Array.isArray(parsedValue.titles)) {
				// titles 배열이 있으면 해당 항목 업데이트
				updatedTitles = parsedValue.titles.map((item: TodoTitleBase) => 
					item.id === todoTitle.id ? { id: todoTitle.id, name: todoTitle.name, createTime: todoTitle.createTime } : item
				);
			} else if (Array.isArray(parsedValue)) {
				// 배열 형식으로 저장된 경우
				updatedTitles = parsedValue.map((item: TodoTitleBase) => 
					item.id === todoTitle.id ? { id: todoTitle.id, name: todoTitle.name, createTime: todoTitle.createTime } : item
				);
			} else {
				// 단일 항목인 경우, 배열로 변환
				updatedTitles = [{ id: todoTitle.id, name: todoTitle.name, createTime: todoTitle.createTime }];
			}
		} catch (e) {
			console.error('기존 todo_titles 파싱 실패:', e);
			// 파싱 실패시 해당 항목만 포함
			updatedTitles = [{ id: todoTitle.id, name: todoTitle.name, createTime: todoTitle.createTime }];
		}
		
		// JSON 형태로 titles 배열을 포함한 객체 생성
		const valueObject = {
			titles: updatedTitles
		};
		
		const todoTitleItem: TodoItem = {
			collection: todoTitle.meta.collection,
			key: todoTitle.meta.key,
			value: JSON.stringify(valueObject),
			version: todoTitle.meta.version,
			permissionRead: todoTitle.meta.permission_read,
			permissionWrite: todoTitle.meta.permission_write
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
		
		const result = await response.json();
		const storageObject = result.acks?.[0];
		
		if (!storageObject) {
			throw new Error('서버 응답에서 TodoTitle 항목을 찾을 수 없습니다');
		}
		
		return {
			...todoTitle,
			meta: {
				...todoTitle.meta,
				update_time: storageObject.update_time,
				version: storageObject.version
			}
		};
	} catch (error) {
		console.error('TodoTitle 업데이트 실패:', error);
		throw error;
	}
}

/**
 * Todo 타이틀 삭제, 사실 내부적으로는 update...
 */
export async function deleteTodoTitle(titleId: string, userId: string) {
	try {
		// 먼저 기존 데이터를 가져옴
		const checkResponse = await fetchWithAuth(`${process.env.NEXT_PUBLIC_NAKAMA_URL}/v2/storage/todo_titles?limit=100`);
		
		if (!checkResponse.ok) {
			const errorData = await checkResponse.json().catch(() => null);
			const errorMessage = errorData?.message || `요청 실패: ${checkResponse.status}`;
			throw new Error(errorMessage);
		}
		
		const checkData = await checkResponse.json();
		const collectionExists = checkData.objects && checkData.objects.length > 0;
		
		if (!collectionExists) {
			throw new Error('삭제할 Todo 타이틀 데이터를 찾을 수 없습니다.');
		}
		
		// 기존 데이터에서 삭제할 항목을 제거
		const firstObject = checkData.objects[0];
		let updatedTitles: TodoTitleBase[] = [];
		
		try {
			const parsedValue = JSON.parse(firstObject.value);
			
			if (parsedValue.titles && Array.isArray(parsedValue.titles)) {
				// titles 배열에서 해당 ID를 제외
				updatedTitles = parsedValue.titles.filter((item: TodoTitleBase) => item.id !== titleId);
			} else if (Array.isArray(parsedValue)) {
				// 배열 형식인 경우 해당 ID를 제외
				updatedTitles = parsedValue.filter((item: TodoTitleBase) => item.id !== titleId);
			} else {
				// 단일 항목이면서 ID가 일치하면 빈 배열 반환, 아니면 그대로 유지
				updatedTitles = parsedValue.id === titleId ? [] : [parsedValue];
			}
		} catch (e) {
			console.error('기존 todo_titles 파싱 실패:', e);
			return false;
		}
		
		// 새로운 값 객체 생성
		const valueObject = {
			titles: updatedTitles
		};
		
		// todo_titles 컬렉션 항목 업데이트
		const todoTitleItem: TodoItem = {
			collection: firstObject.collection,
			key: firstObject.key,
			value: JSON.stringify(valueObject),
			version: firstObject.version,
			permissionRead: firstObject.permission_read,
			permissionWrite: firstObject.permission_write
		};
		
		// TODO: 서버 로직에서 삭제한 title 같은 이름의 컬렉션 삭제 처리 필요
		const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_NAKAMA_URL}/v2/storage`, {
			method: 'PUT',
			body: JSON.stringify({ objects: [todoTitleItem] })
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
		const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_NAKAMA_URL}/v2/storage/${title}	?limit=100`, {
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
		console.log('version', storageObject.version);
		
		
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
export async function deleteTodoItem(collection: string, todoId: string, version: string) {
	try {
		const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_NAKAMA_URL}/v2/storage/delete`, {
			method: 'PUT',
			body: JSON.stringify({
				object_ids: [{
					collection: collection,
					key: todoId,
					version: version
				}]
			})
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
 * Nakama RPC를 사용하여 Todo 항목 업데이트/생성
 * RPC 함수를 직접 호출합니다.
 */
export async function updateTodoWithNakamaApi(todo: TodoInfo, collection: string): Promise<TodoInfo> {
	try {
		// 버전 정보 가져오기
		const version = todo.meta?.version || '*';
		
		// RPC 호출용 객체 생성
		const rpcPayload = {
			todoItem: {
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
			deleteObject: {
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