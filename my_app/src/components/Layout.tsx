// src/components/Layout.tsx
// import Navbar from './Navbar';
import { SidebarWrapper } from './Sidebarwrapper';

interface LayoutProps {
children: React.ReactNode;
}

export default async function Layout({ children }: LayoutProps) {
return (
    <div className="min-h-screen bg-zinc-900">
    <SidebarWrapper />
    {/* <Navbar /> */}
    <div className="ml-72 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
        <main className="p-4">{children}</main>
    </div>
    </div>
);
}
