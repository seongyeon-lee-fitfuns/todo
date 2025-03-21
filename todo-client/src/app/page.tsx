import { Metadata } from "next";
import Layout from "./components/Layout";
import NavigationCard from "./components/NavigationCard";
import Footer from "./components/Footer";

export const metadata: Metadata = {
	title: "홈 | Todo 앱",
	description: "Next.js로 만든 Todo 애플리케이션",
};

export default function Home() {
	return (
		<Layout>
			<h1 className="text-4xl font-bold text-white text-center mb-8">
				Todo App
			</h1>
			
			<nav className="grid gap-4">
				<NavigationCard 
					href="/todos"
					title="TODO Lists"
					description="TODO 관리 페이지"
				/>
				<NavigationCard 
					href="/admin"
					title="Admin"
					description="권한 관리 페이지"
				/>
			</nav>

			<Footer />
		</Layout>
	);
}