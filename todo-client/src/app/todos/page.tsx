import TodoApp from "./components/TodoApp";

export default function TodoPage() {
	return (
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 min-h-screen place-items-center">
				<TodoApp title="개인 할 일" />
				<TodoApp title="업무 할 일" />
				<TodoApp title="장보기 목록" />
			</div>
	);
}
