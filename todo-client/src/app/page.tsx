'use client';

import { useNakamaUser } from "./login/useNakamaUser";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Layout from "./components/Layout";
import NavigationCard from "./components/NavigationCard";
import Footer from "./components/Footer";

export default function Home() {
	const { user, isLoading, error } = useNakamaUser();
	const router = useRouter();
	const [loadingTimeout, setLoadingTimeout] = useState(false);

	useEffect(() => {
		// 5초 후에도 로딩 중이면 타임아웃으로 처리
		const timer = setTimeout(() => {
			if (isLoading) {
				setLoadingTimeout(true);
			}
		}, 5000);

		return () => clearTimeout(timer);
	}, [isLoading]);

	// 로그인되지 않은 상태에서 로딩이 완료되거나 타임아웃되면 로그인 페이지로 이동
	useEffect(() => {
		if ((loadingTimeout || (!isLoading && !user)) && !user) {
			router.push('/login');
		}
	}, [user, isLoading, loadingTimeout, router]);

	return (
		<Layout>
			<h1 className="text-4xl font-bold text-white text-center mb-8">
				Todo App
			</h1>
			
			{isLoading && !loadingTimeout ? (
				<div className="bg-white/10 backdrop-blur-md p-6 rounded-lg shadow-lg mb-8 animate-pulse">
					<p className="text-white text-center">로딩 중...</p>
				</div>
			) : user ? (
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
			) : (
				<div className="bg-white/10 backdrop-blur-md p-6 rounded-lg shadow-lg mb-8 animate-pulse">
					<p className="text-white text-center">로그인 페이지로 이동 중...</p>
				</div>
			)}

			<Footer />
		</Layout>
	);
}