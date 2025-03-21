'use client';

import { useState } from 'react';
import TodoForm from './TodoForm';
import TodoList from './TodoList';
import TodoStats from './TodoStats';

export interface Todo {
	id: number;
	text: string;
	completed: boolean;
}

export default function TodoApp({ title }: { title: string }) {
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
		<div className="max-w-md mx-auto bg-neutral-50 dark:bg-neutral-900 rounded-xl shadow-xl p-8 border border-neutral-200 dark:border-neutral-800">
			<h1 className="text-3xl font-bold text-center mb-8 font-geist-sans">{title}</h1>
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