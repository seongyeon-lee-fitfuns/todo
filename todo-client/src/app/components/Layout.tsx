'use client';

interface LayoutProps {
	children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
			<div className="bg-white/30 backdrop-blur-lg rounded-2xl p-8 shadow-xl w-full max-w-md" style={{ WebkitBackdropFilter: 'blur(20px)' }}>
				{children}
			</div>
		</div>
	);
} 