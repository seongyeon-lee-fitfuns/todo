import TodoApp from "./components/TodoApp";
import { fetchWithAuth } from "../api/fetchWithAuth";
import { useNakamaUser } from "../login/useNakamaUser";
export default function TodoPage() {
	// TODO: 타이틀 받아오기
	const titles = ['test1'];
	// TODO: 타이틀 생성
	const createTitle = async () => {
		const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_NAKAMA_URL}/v2/storage`, {
			method: 'POST',
			body: JSON.stringify({ title: 'test1' })
		});
	}
	return (
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 min-h-screen place-items-center">
				{titles.map((title) => (
					<TodoApp key={title} title={title} />
				))}
			</div>
	);
}
