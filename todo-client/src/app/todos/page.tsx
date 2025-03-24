import TodoApp from "./components/TodoApp";

export default function TodoPage() {
	const titles = ['test1'];
	return (
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 min-h-screen place-items-center">
				{titles.map((title) => (
					<TodoApp key={title} title={title} />
				))}
			</div>
	);
}
