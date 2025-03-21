'use client';

import { Todo } from '../page';

interface TodoStatsProps {
  todos: Todo[];
}

export default function TodoStats({ todos }: TodoStatsProps) {
  const completedCount = todos.filter(todo => todo.completed).length;
  const incompleteCount = todos.length - completedCount;

  return (
    <div className="mt-6 pt-4 border-t border-gray-200 text-sm text-gray-500">
      <p>전체: {todos.length}개</p>
      <p>완료: {completedCount}개</p>
      <p>미완료: {incompleteCount}개</p>
    </div>
  );
} 