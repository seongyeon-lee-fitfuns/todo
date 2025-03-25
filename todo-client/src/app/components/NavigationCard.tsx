import Link from "next/link";

interface NavigationCardProps {
	href: string;
	title: string;
	description: string;
}

export default function NavigationCard({ href, title, description }: NavigationCardProps) {
	return (
		<Link 
			href={href} 
			className="group block bg-white/40 backdrop-blur-md hover:bg-white/50 rounded-xl p-6 transition-all duration-300 shadow-lg"
			style={{ WebkitBackdropFilter: 'blur(12px)' }}
		>
			<div className="flex items-center justify-between">
				<h2 className="text-xl font-semibold text-indigo-900">{title}</h2>
				<span className="text-indigo-700 group-hover:translate-x-2 transition-transform">
					→
				</span>
			</div>
			<p className="text-indigo-800 mt-2">
				{description}
			</p>
		</Link>
	);
} 