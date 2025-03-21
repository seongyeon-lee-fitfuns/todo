'use client';

import { AnimatePresence } from 'framer-motion';
import { Todo } from './TodoApp';
import TodoItem from './TodoItem';

interface TodoListProps {
  todos: Todo[];
  onToggleComplete: (id: number) => void;
  onDeleteTodo: (id: number) => void;
}

export default function TodoList({ 
  todos, 
  onToggleComplete, 
  onDeleteTodo 
}: TodoListProps) {
  
  if (todos.length === 0) {
    return (
      <p className="text-center text-gray-500 py-4">
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