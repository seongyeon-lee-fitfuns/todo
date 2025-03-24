	'use client';

	import { useEffect, useState } from 'react';
	import TodoForm from './TodoForm';
	import TodoList from './TodoList';
	import TodoStats from './TodoStats';
	import { fetchWithAuth } from '@/app/api/fetchWithAuth';
	import { useNakamaUser } from '@/app/login/useNakamaUser';
	export interface Todo {
		id: number;
		text: string;
		completed: boolean;
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
	 * Nakama 스토리지에서 Todo 목록 조회
	 */
	async function fetchTodos(title: string, userId: string) {
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
			return data.objects.map((item: any) => {
				try {
					return JSON.parse(item.value);
				} catch (e) {
					console.error('Todo 파싱 오류:', e);
					return null;
				}
			}).filter(Boolean);
			return [];
		} catch (error) {
			console.error('Todo 목록 조회 실패:', error);
			throw error;
		}
	}

	/**
	 * Todo 항목 생성
	 */
	async function createTodo(todo: Todo, title: string) {
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
	async function updateTodo(todo: Todo, version: string) {
		try {
			const todoItem: TodoItem = {
				collection: 'todos',
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
	async function deleteTodoItem(title: string) {
		try {
			const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_NAKAMA_URL}/v2/storage/${title}`, {
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
	async function fetchTodoVersion(title: string) {
		try {
			const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_NAKAMA_URL}/v2/storage/${title}}`);
			
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

	export default function TodoApp({ title }: { title: string }) {
		const [todos, setTodos] = useState<Todo[]>([]);
		const [error, setError] = useState<string | null>(null);
		const [isLoading, setIsLoading] = useState(true);
		const { user } = useNakamaUser();
		// 버전 정보 저장 (key: todoId, value: version)
		const [todoVersions, setTodoVersions] = useState<Record<string, string>>({});

		// 초기 Todo 목록 로드

		useEffect(() => {
			if (user) {
				fetchTodos(title, user?.id || '')
					.then(data => {
						setTodos(data);
					
					// 버전 정보 초기화
					const versions: Record<string, string> = {};
					data.forEach((todo: Todo) => {
						fetchTodoVersion(todo.id.toString())
							.then(version => {
								versions[todo.id] = version;
							});
					});
					setTodoVersions(versions);
				})
				.catch(err => {
					setError(err instanceof Error ? err.message : 'Todo 목록을 불러오는데 실패했습니다');
				})
				.finally(() => {
					setIsLoading(false);
				});
			}
		}, [user]);

		// 새 할일 추가
		const addTodo = (text: string) => {
			if (text.trim() === '') return;
			
			const newTodo: Todo = {
				id: Date.now(),
				text: text,
				completed: false
			};
			
			setError(null);
			setIsLoading(true);
			
			createTodo(newTodo, title)
				.then(response => {
					// 응답에서 버전 정보 추출
					const newVersion = response.objects?.[0]?.version || '*';
					
					// 상태 업데이트
					setTodos(prevTodos => [...prevTodos, newTodo]);
					setTodoVersions(prev => ({
						...prev,
						[newTodo.id]: newVersion
					}));
				})
				.catch(err => {
					setError(err instanceof Error ? err.message : '할 일을 저장하는데 실패했습니다');
				})
				.finally(() => {
					setIsLoading(false);
				});
		};

		// 할일 완료 토글
		const toggleComplete = (id: number) => {
			setError(null);
			
			// 현재 todo와 version 찾기
			const todo = todos.find(t => t.id === id);
			const version = todoVersions[id];
			
			if (!todo) return;
			
			// 새 상태 생성
			const updatedTodo = { ...todo, completed: !todo.completed };
			
			setIsLoading(true);
			
			// 서버에 업데이트
			updateTodo(updatedTodo, version)
				.then(response => {
					// 응답에서 새 버전 정보 추출
					const newVersion = response.objects?.[0]?.version || version;
					
					// 상태 업데이트
					setTodos(todos.map(t => t.id === id ? updatedTodo : t));
					setTodoVersions(prev => ({
						...prev,
						[id]: newVersion
					}));
				})
				.catch(err => {
					setError(err instanceof Error ? err.message : '할 일 상태 변경에 실패했습니다');
					// 오류 시 다시 가져오기
					fetchTodos(title, user?.id || '').then(setTodos);
				})
				.finally(() => {
					setIsLoading(false);
				});
		};

		// 할일 삭제
		const deleteTodo = (id: number) => {
			setError(null);
			setIsLoading(true);
			
			deleteTodoItem(id.toString())
				.then(() => {
					// 로컬 상태에서 삭제
					setTodos(todos.filter(todo => todo.id !== id));
					
					// 버전 정보에서 제거
					const newVersions = { ...todoVersions };
					delete newVersions[id];
					setTodoVersions(newVersions);
				})
				.catch(err => {
					setError(err instanceof Error ? err.message : '할 일 삭제에 실패했습니다');
				})
				.finally(() => {
					setIsLoading(false);
				});
		};

		return (
			<div className="max-w-md mx-auto bg-white/20 backdrop-blur-md rounded-xl shadow-xl p-8 border border-white/20">
				<h1 className="text-3xl font-bold text-center mb-8 font-geist-sans text-white">{title}</h1>
				
				{isLoading && (
					<div className="flex justify-center items-center py-4">
						<div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
					</div>
				)}
				
				{error && (
					<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
						<p>{error}</p>
					</div>
				)}
				
				<TodoForm onAddTodo={addTodo} />
				
				<TodoList 
					todos={todos} 
					onToggleComplete={toggleComplete} 
					onDeleteTodo={deleteTodo} 
				/>
				
				{todos.length > 0 && <TodoStats todos={todos} />}
			</div>
		);
	} 