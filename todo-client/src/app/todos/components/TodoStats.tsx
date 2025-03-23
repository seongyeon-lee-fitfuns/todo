'use client';

import { Todo } from './TodoApp';

interface TodoStatsProps {
  todos: Todo[];
}

export default function TodoStats({ todos }: TodoStatsProps) {
  const completedCount = todos.filter(todo => todo.completed).length;
  const incompleteCount = todos.length - completedCount;

  return (
    <div className="mt-6 pt-4 border-t border-white/20 text-sm text-white/70">
      <p>전체: {todos.length}개</p>
      <p>완료: {completedCount}개</p>
      <p>미완료: {incompleteCount}개</p>
    </div>
  );
} 