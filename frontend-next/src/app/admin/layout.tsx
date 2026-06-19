'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  Search, 
  FileText, 
  BarChart2, 
  Users, 
  Settings, 
  HelpCircle, 
  LogOut,
  ShieldCheck
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const auth = localStorage.getItem('admin_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    } else if (pathname !== '/admin/login') {
      router.push('/admin/login');
    }
    setIsLoading(false);
  }, [pathname, router]);

  if (isLoading) {
    return <div className="min-h-screen bg-[#F4F7F6] flex items-center justify-center">Loading...</div>;
  }

  // If on the login page, just render the content without the sidebar
  if (pathname === '/admin/login') {
    return <div className="min-h-screen bg-[#F4F7F6] font-sans">{children}</div>;
  }

  // If not authenticated and not on login page, don't render the layout
  if (!isAuthenticated && pathname !== '/admin/login') {
    return null;
  }

  const menu = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { name: 'Scans', icon: Search, path: '/admin/scans' },
    { name: 'Reports', icon: FileText, path: '/admin/reports' },
    { name: 'Analytics', icon: BarChart2, path: '/admin/analytics' },
    { name: 'Team', icon: Users, path: '/admin/team' },
  ];

  const general = [
    { name: 'Settings', icon: Settings, path: '/admin/settings' },
    { name: 'Help', icon: HelpCircle, path: '/admin/help' },
    { name: 'Logout', icon: LogOut, path: '/admin/login', onClick: () => {
      localStorage.removeItem('admin_auth');
    }},
  ];

  return (
    <div className="flex min-h-screen bg-[#F4F7F6] text-black" style={{ fontFamily: 'var(--font-sans)' }}>
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-black/5 flex flex-col fixed h-full z-20">
        
        {/* Logo */}
        <div className="h-24 flex items-center px-8 border-b border-black/5">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-[#166534] rounded-lg flex items-center justify-center text-white">
              <ShieldCheck size={20} />
            </div>
            <span className="font-bold text-xl tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              ScamShield
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-8 px-4 flex flex-col gap-8">
          
          <div>
            <div className="px-4 text-xs font-semibold text-black/40 tracking-wider mb-4">MENU</div>
            <nav className="flex flex-col gap-1">
              {menu.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <Link 
                    key={item.name} 
                    href={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive 
                        ? 'bg-[#166534]/10 text-[#166534] font-medium' 
                        : 'text-black/60 hover:bg-black/5 hover:text-black'
                    }`}
                  >
                    <item.icon size={20} className={isActive ? 'text-[#166534]' : 'text-black/40'} />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div>
            <div className="px-4 text-xs font-semibold text-black/40 tracking-wider mb-4">GENERAL</div>
            <nav className="flex flex-col gap-1">
              {general.map((item) => (
                <Link 
                  key={item.name} 
                  href={item.path}
                  onClick={item.onClick}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-black/60 hover:bg-black/5 hover:text-black transition-all"
                >
                  <item.icon size={20} className="text-black/40" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}
