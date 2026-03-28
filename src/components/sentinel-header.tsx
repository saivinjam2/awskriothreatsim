'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';

const NAV_LINKS = [
  { href: '/configure', label: 'New Test' },
  { href: '/history',   label: 'Results' },
  { href: '/guide',     label: 'Guide' },
];

export function SentinelHeader() {
  const pathname = usePathname();

  return (
    <header className="threatsim-header">
      <div className="threatsim-header-brand">
        <Link href="/" className="threatsim-home-badge" aria-label="KRIO ThreatSim home">
          <span className="threatsim-home-badge-mark">KT</span>
        </Link>
        <div className="threatsim-header-copy">
          <p>KRIO ThreatSim</p>
          <span>Swarm Defense Arena</span>
        </div>
      </div>

      <div className="threatsim-header-nav">
        <nav className="threatsim-nav-links" aria-label="Primary">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link key={link.href} href={link.href} className={active ? 'active' : ''}>
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="threatsim-nav-tools">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
