import Link from "next/link";

export default function Home() {
	return (
		<div>
			<h1>HOME</h1>
			<Link href="/hello">Hello</Link>
			<Link href="/todo">Todo</Link>
			<Link href="/admin">Admin</Link>
		</div>
	);
}