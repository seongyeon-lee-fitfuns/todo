'use client';

import { AnimatePresence } from 'framer-motion';
import { TodoBase } from '@/app/api/todoApi';
import TodoItem from './TodoItem';

interface TodoListProps {
  todos: TodoBase[];
  onToggleComplete: (id: number) => void;
  onDeleteTodo: (id: number) => void;
}

export default function TodoList({ 
  todos, 
  onToggleComplete, 
  onDeleteTodo 
}: TodoListProps) {
  if (todos.length === 0 || !todos || Object.keys(todos).length === 0) {
    return (
      <p className="text-center text-white/70 py-4">
        할 일이 없습니다. 새로운 할 일을 추가해보세요!
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      <AnimatePresence>
        {todos.map(todo => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggleComplete={onToggleComplete}
            onDeleteTodo={onDeleteTodo}
          />
        ))}
      </AnimatePresence>
    </ul>
  );
} 