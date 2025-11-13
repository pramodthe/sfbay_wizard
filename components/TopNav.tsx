import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Bell } from 'lucide-react';
import { Button } from './ui/Button';
import UserProfile from './UserProfile';

const NavButton = ({ href, currentPath, children }: { href: string; currentPath: string; children: React.ReactNode }) => {
    const isActive = href === '/' ? currentPath === href : currentPath.startsWith(href);
    return (
        <Link 
            href={href}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
            }`}
            aria-current={isActive ? 'page' : undefined}
        >
            {children}
        </Link>
    );
};

export default function TopNav() {
  const router = useRouter();
  const currentPath = router.pathname;

  return (
    <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600 text-white font-bold">
              F
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">FinSmart</span>
          </Link>
          <nav className="hidden items-center gap-2 md:flex">
             <NavButton href="/" currentPath={currentPath}>Dashboard</NavButton>
             <NavButton href="/spending" currentPath={currentPath}>Spending Analysis</NavButton>
             <NavButton href="/planning" currentPath={currentPath}>Financial Planning</NavButton>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-900">
            <Bell className="h-5 w-5" />
          </Button>
          <UserProfile />
        </div>
      </div>
    </header>
  );
}
