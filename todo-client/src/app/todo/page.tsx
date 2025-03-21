'use client';

import { useState } from 'react';
import TodoForm from './components/TodoForm';
import TodoList from './components/TodoList';
import TodoStats from './components/TodoStats';

export interface Todo {
	id: number;
	text: string;
	completed: boolean;
}

export default function TodoApp() {
	const [todos, setTodos] = useState<Todo[]>([]);

	// 새 할일 추가
	const addTodo = (text: string) => {
		if (text.trim() === '') return;
		
		const newTodo: Todo = {
			id: Date.now(),
			text: text,
			completed: false
		};
		
		setTodos([...todos, newTodo]);
	};

	// 할일 완료 토글
	const toggleComplete = (id: number) => {
		setTodos(
			todos.map(todo => 
				todo.id === id ? { ...todo, completed: !todo.completed } : todo
			)
		);
	};

	// 할일 삭제
	const deleteTodo = (id: number) => {
		setTodos(todos.filter(todo => todo.id !== id));
	};

	return (
		<div className="min-h-screen bg-gray-100 py-10 px-4">
			<div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
				<h1 className="text-2xl font-bold text-center mb-6">할 일 목록</h1>
				<TodoForm onAddTodo={addTodo} />
				<TodoList 
					todos={todos} 
					onToggleComplete={toggleComplete} 
					onDeleteTodo={deleteTodo} 
				/>
				{todos.length > 0 && <TodoStats todos={todos} />}
			</div>
		</div>
	);
} 