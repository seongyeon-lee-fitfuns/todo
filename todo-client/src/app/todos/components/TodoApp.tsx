	'use client';

	import { useEffect, useState } from 'react';
	import TodoForm from './TodoForm';
	import TodoList from './TodoList';
	import TodoStats from './TodoStats';
	import { useNakamaUser } from '@/app/login/useNakamaUser';
	import { 
		Todo, 
		fetchTodos, 
		createTodo, 
		updateTodo, 
		deleteTodoItem, 
		fetchTodoVersion 
	} from '@/app/api/todoApi';

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
						fetchTodoVersion(title, todo.id.toString())
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
		}, [user, title]);

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
			updateTodo(updatedTodo, version, title)
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
					if (user) {
						fetchTodos(title, user.id || '').then(setTodos);
					}
				})
				.finally(() => {
					setIsLoading(false);
				});
		};

		// 할일 삭제
		const handleDeleteTodo = (id: number) => {
			setError(null);
			setIsLoading(true);
			
			deleteTodoItem(title, id.toString())
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
					onDeleteTodo={handleDeleteTodo} 
				/>
				
				{todos.length > 0 && <TodoStats todos={todos} />}
			</div>
		);
	} 