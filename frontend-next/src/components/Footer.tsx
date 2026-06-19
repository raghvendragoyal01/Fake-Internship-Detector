'use client';

import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-[#FAFAFA] border-t border-black/5 py-16 px-6 md:px-12 text-black">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        
        {/* Brand */}
        <div className="flex flex-col gap-4">
          <Link href="/" className="flex items-center gap-2 group w-fit">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white">
              <ShieldCheck size={20} />
            </div>
            <span className="font-bold text-xl tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              ScamShield
            </span>
          </Link>
          <p className="text-black/50 text-sm max-w-xs mt-2">
            The world&apos;s most advanced Machine Learning platform for detecting fake job listings and recruitment scams.
          </p>
          <div className="flex gap-4 mt-4 text-black/40 text-sm">
            <a href="#" className="hover:text-black transition-colors">Twitter</a>
            <a href="#" className="hover:text-black transition-colors">GitHub</a>
            <a href="#" className="hover:text-black transition-colors">LinkedIn</a>
          </div>
        </div>

        {/* Links */}
        <div>
          <h4 className="font-semibold mb-6" style={{ fontFamily: 'var(--font-display)' }}>Product</h4>
          <ul className="flex flex-col gap-3 text-sm text-black/60">
            <li><Link href="/dashboard/scan" className="hover:text-black transition-colors">Deep Scan</Link></li>
            <li><Link href="/dashboard/alerts" className="hover:text-black transition-colors">Job Alerts</Link></li>
            <li><Link href="/dashboard/api" className="hover:text-black transition-colors">Developer API</Link></li>
            <li><Link href="/#pricing" className="hover:text-black transition-colors">Pricing</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-6" style={{ fontFamily: 'var(--font-display)' }}>Resources</h4>
          <ul className="flex flex-col gap-3 text-sm text-black/60">
            <li><Link href="/docs" className="hover:text-black transition-colors">Documentation</Link></li>
            <li><Link href="/blog" className="hover:text-black transition-colors">Blog</Link></li>
            <li><Link href="/scam-index" className="hover:text-black transition-colors">Scam Index</Link></li>
            <li><Link href="/help" className="hover:text-black transition-colors">Help Center</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-6" style={{ fontFamily: 'var(--font-display)' }}>Company</h4>
          <ul className="flex flex-col gap-3 text-sm text-black/60">
            <li><Link href="/about" className="hover:text-black transition-colors">About Us</Link></li>
            <li><Link href="/careers" className="hover:text-black transition-colors">Careers</Link></li>
            <li><Link href="/privacy" className="hover:text-black transition-colors">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-black transition-colors">Terms of Service</Link></li>
          </ul>
        </div>

      </div>

      <div className="max-w-[1400px] mx-auto mt-16 pt-8 border-t border-black/5 flex flex-col md:flex-row justify-between items-center text-xs text-black/40">
        <p>© 2026 ScamShield Inc. All rights reserved.</p>
        <div className="flex gap-6 mt-4 md:mt-0">
          <Link href="/privacy" className="hover:text-black transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-black transition-colors">Terms</Link>
          <Link href="/cookies" className="hover:text-black transition-colors">Cookies</Link>
        </div>
      </div>
    </footer>
  );
}
