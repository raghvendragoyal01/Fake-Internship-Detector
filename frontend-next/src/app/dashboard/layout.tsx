'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Search, 
  Bookmark, 
  Bell, 
  User, 
  Settings, 
  LogOut,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const menu = [
    { name: 'Overview', icon: Home, path: '/dashboard' },
    { name: 'New Scan', icon: Search, path: '/dashboard/scan' },
    { name: 'Saved Jobs', icon: Bookmark, path: '/dashboard/saved' },
    { name: 'Alerts', icon: Bell, path: '/dashboard/alerts' },
    { name: 'Verify Recruiter', icon: ShieldCheck, path: '/dashboard/verify' },
  ];

  const general = [
    { name: 'Report Scam', icon: ShieldAlert, path: '/dashboard/report' },
    { name: 'Profile', icon: User, path: '/dashboard/profile' },
    { name: 'Developer API', icon: Settings, path: '/dashboard/api' },
    { name: 'Settings', icon: Settings, path: '/dashboard/settings' },
    { name: 'Logout', icon: LogOut, path: '/' },
  ];

  return (
    <div className="flex min-h-screen bg-[#FAFAFA] text-black" style={{ fontFamily: 'var(--font-sans)' }}>
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-black/5 flex flex-col fixed h-full z-20">
        
        {/* Logo */}
        <div className="h-24 flex items-center px-8 border-b border-black/5">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white">
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
                        ? 'bg-black text-white font-medium shadow-md' 
                        : 'text-black/60 hover:bg-black/5 hover:text-black'
                    }`}
                  >
                    <item.icon size={20} className={isActive ? 'text-white' : 'text-black/40'} />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div>
            <div className="px-4 text-xs font-semibold text-black/40 tracking-wider mb-4">ACCOUNT</div>
            <nav className="flex flex-col gap-1">
              {general.map((item) => (
                <Link 
                  key={item.name} 
                  href={item.path}
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
