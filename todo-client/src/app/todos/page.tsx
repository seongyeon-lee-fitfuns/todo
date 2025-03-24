'use client';

import { useState, useEffect } from 'react';
import TodoApp from "./components/TodoApp";
import { useNakamaUser } from "@/app/login/useNakamaUser";
import { 
	TodoTitleBase, 
	TodoTitleInfo, 
	fetchTodoTitles, 
	createTodoTitleWithNakamaApi,
	deleteTodoTitle 
} from "@/app/api/todoApi";

export default function TodoPage() {
	const [titles, setTitles] = useState<TodoTitleInfo[]>([]);
	const [newTitleInput, setNewTitleInput] = useState('');
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { user } = useNakamaUser();

	// 타이틀 목록 로드
	useEffect(() => {
		if (user?.id) {
			setIsLoading(true);
			fetchTodoTitles(user.id)
				.then(titleInfos => {
					setTitles(titleInfos);
				})
				.catch(err => {
					setError('Todo 목록을 불러오는데 실패했습니다');
					console.error(err);
				})
				.finally(() => {
					setIsLoading(false);
				});
		}
	}, [user]);

	// 새 Todo 타이틀 생성
	const handleCreateTodoTitle = async () => {
		if (!newTitleInput.trim() || !user?.id) return;
		
		setIsLoading(true);
		setError(null);
		
		try {
			const newTitleInfo = await createTodoTitleWithNakamaApi(newTitleInput);
			setTitles(prev => [...prev, newTitleInfo]);
			setNewTitleInput(''); // 입력 필드 초기화
		} catch (err) {
			setError('새 Todo 목록 생성에 실패했습니다');
			console.error(err);
		} finally {
			setIsLoading(false);
		}
	};

	// Todo 타이틀 삭제
	const handleDeleteTodoTitle = async (id: string) => {
		if (!id || !user?.id) return;
		
		setIsLoading(true);
		setError(null);
		
		try {
			await deleteTodoTitle(id, user.id);
			setTitles(prev => prev.filter(title => title.id !== id));
		} catch (err) {
			setError('Todo 목록 삭제에 실패했습니다');
			console.error(err);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="container mx-auto p-4">
			{/* 새 Todo 목록 생성 폼 */}
			<div className="mb-8 max-w-md mx-auto">
				<h2 className="text-2xl font-bold mb-4 text-white">새 Todo 목록 만들기</h2>
				<div className="flex gap-2">
					<input
						type="text"
						value={newTitleInput}
						onChange={(e) => setNewTitleInput(e.target.value)}
						placeholder="할 일 목록 이름 입력"
						className="flex-1 px-4 py-2 rounded bg-white/10 border border-white/20 text-white"
					/>
					<button
						onClick={handleCreateTodoTitle}
						disabled={isLoading || !newTitleInput.trim()}
						className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded disabled:opacity-50"
					>
						{isLoading ? '생성 중...' : '생성'}
					</button>
				</div>
				{error && (
					<div className="mt-2 text-red-500">{error}</div>
				)}
			</div>

			{/* Todo 앱 목록 */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{titles.length === 0 && !isLoading ? (
					<div className="col-span-full text-center py-12 text-white">
						<p className="text-xl">아직 Todo 목록이 없습니다. 위에서 새 목록을 만들어보세요!</p>
					</div>
				) : (
					titles.map((titleInfo) => (
						<div key={titleInfo.id} className="relative">
							<button
								onClick={() => handleDeleteTodoTitle(titleInfo.id)}
								className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-full z-10"
								title="삭제"
							>
								×
							</button>
							<TodoApp title={titleInfo.name} />
						</div>
					))
				)}
			</div>
			
			{isLoading && titles.length === 0 && (
				<div className="flex justify-center items-center py-12">
					<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
				</div>
			)}
		</div>
	);
}
