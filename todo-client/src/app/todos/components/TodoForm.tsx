'use client';

import { useState } from 'react';

interface TodoFormProps {
  onAddTodo: (text: string) => void;
}

export default function TodoForm({ onAddTodo }: TodoFormProps) {
  const [input, setInput] = useState('');

  const handleSubmit = () => {
    if (input.trim() !== '') {
      onAddTodo(input);
      setInput('');
    }
  };

  return (
	<div className="flex mb-6">
		<input
			type="text"
			value={input}
			onChange={(e) => setInput(e.target.value)}
			onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
			placeholder="할 일을 입력하세요"
			className="flex-grow px-4 py-2 border border-white/30 bg-white/30 backdrop-blur-sm text-white placeholder-white/70 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
		<button
			onClick={handleSubmit}
			className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r-lg transition-colors shadow-md"
      >
			추가
		</button>
	</div>
  );
} 