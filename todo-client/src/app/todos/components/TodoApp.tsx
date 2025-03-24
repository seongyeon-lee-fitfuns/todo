'use client';

import { SetStateAction, useEffect, useState } from 'react';
import TodoForm from './TodoForm';
import TodoList from './TodoList';
import TodoStats from './TodoStats';
import { useNakamaUser } from '@/app/login/useNakamaUser';
import { 
	TodoBase,
	TodoInfo, 
	fetchTodos, 
	updateTodoWithNakamaApi,
	createTodoWithNakamaApi,
	deleteTodoWithNakamaApi
} from '@/app/api/todoApi';

export default function TodoApp({ title }: { title: string }) {
	const [todos, setTodos] = useState<TodoInfo[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const { user } = useNakamaUser();

	// 초기 Todo 목록 로드
	useEffect(() => {
		if (user) {
			fetchTodos(title)
				.then(todoInfos => {
					setTodos(todoInfos);
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
		
		const newTodo: TodoBase = {
			id: Date.now(),
			text: text,
			completed: false
		};
		
		setError(null);
		setIsLoading(true);
		
		createTodoWithNakamaApi(newTodo, title)
			.then(todoInfo => {
				// 상태 업데이트
				setTodos(prevTodos => [...prevTodos, todoInfo]);
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
		
		// 현재 todo 찾기
		const todoToUpdate = todos.find(t => t.id === id);
		
		if (!todoToUpdate) return;
		
		// 새 상태 생성
		const updatedTodo: TodoInfo = {
			...todoToUpdate,
			completed: !todoToUpdate.completed
		};
		
		setIsLoading(true);
		
		// 서버에 업데이트
		updateTodoWithNakamaApi(updatedTodo, title)
			.then(updatedTodoInfo => {
				// 상태 업데이트
				setTodos(prevTodos => 
					prevTodos.map(t => t.id === id ? updatedTodoInfo : t)
				);
			})
			.catch(err => {
				setError(err instanceof Error ? err.message : '할 일 상태 변경에 실패했습니다');
				// 오류 시 다시 가져오기
				if (user) {
					fetchTodos(title).then(setTodos);
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
		
		deleteTodoWithNakamaApi(title, id.toString(), todos.find(t => t.id === id)?.meta?.version || '')
			.then(() => {
				// 로컬 상태에서 삭제
				setTodos(todos.filter(todo => todo.id !== id));
			})
			.catch(err => {
				setError(err instanceof Error ? err.message : '할 일 삭제에 실패했습니다');
			})
			.finally(() => {
				setIsLoading(false);
			});
		
	};

	// TodoList 및 TodoStats에 전달할 기본 Todo 데이터 추출
	const basicTodos: TodoBase[] = todos.map(({ id, text, completed }) => ({ id, text, completed }));

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
				todos={basicTodos} 
				onToggleComplete={toggleComplete} 
				onDeleteTodo={handleDeleteTodo} 
			/>
			
			{basicTodos.length > 0 && <TodoStats todos={basicTodos} />}
		</div>
	);
} 