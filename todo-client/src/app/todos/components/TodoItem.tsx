'use client';

import { motion } from 'framer-motion';
import { Todo } from './TodoApp';

interface TodoItemProps {
  todo: Todo;
  onToggleComplete: (id: number) => void;
  onDeleteTodo: (id: number) => void;
}

export default function TodoItem({ 
  todo, 
  onToggleComplete, 
  onDeleteTodo 
}: TodoItemProps) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      layout
      className="flex items-center justify-between bg-gray-50 p-4 rounded-md"
    >
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => onToggleComplete(todo.id)}
          className="h-5 w-5 text-blue-500 rounded mr-3"
        />
        <span className={`${todo.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
          {todo.text}
        </span>
      </div>
      <button
        onClick={() => onDeleteTodo(todo.id)}
        className="text-red-500 hover:text-red-700 transition-colors"
      >
        삭제
      </button>
    </motion.li>
  );
} 