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
			className="group block bg-white/20 hover:bg-white/30 rounded-xl p-6 transition-all duration-300"
		>
			<div className="flex items-center justify-between">
				<h2 className="text-xl font-semibold text-white">{title}</h2>
				<span className="text-white/70 group-hover:translate-x-2 transition-transform">
					→
				</span>
			</div>
			<p className="text-white/70 mt-2">
				{description}
			</p>
		</Link>
	);
} 