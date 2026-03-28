'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';

const links = [
  { href: '/history', label: 'Run Archive' },
  { href: '/dataset', label: 'Trace Explorer' },
];

export function SentinelHeader() {
  const pathname = usePathname();

  return (
    <header className="threatsim-header fade-in">
      <div className="threatsim-header-brand">
        <Link href="/" className="threatsim-home-badge" aria-label="KRIO ThreatSim home">
          <span className="threatsim-home-badge-rim" aria-hidden="true" />
          <span className="threatsim-home-badge-mark">KT</span>
        </Link>
        <div className="threatsim-header-copy">
          <p>KRIO ThreatSim</p>
          <span>Swarm Defense Arena</span>
        </div>
      </div>

      <div className="threatsim-header-nav">
        <nav className="threatsim-nav-links" aria-label="Primary">
          {links.map((link) => {
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
