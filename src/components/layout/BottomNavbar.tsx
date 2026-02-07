'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  MessagesSquare,
  Hand,
  Users2,
  HeartHandshake,
  BookOpen,
  Newspaper,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/home', icon: Home, label: 'Home' },
  { href: '/communicate', icon: MessagesSquare, label: 'Communicate' },
  { href: '/sign', icon: Hand, label: 'Sign' },
  { href: '/community', icon: Users2, label: 'Community' },
  { href: '/volunteer', icon: HeartHandshake, label: 'Volunteer' },
  { href: '/learn', icon: BookOpen, label: 'Learn' },
  { href: '/news', icon: Newspaper, label: 'News' },
];

export default function BottomNavbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-auto bg-card border-t border-border shadow-t-lg z-50">
      <div className="flex justify-around items-center max-w-5xl mx-auto px-2 py-3 sm:py-4">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center w-16 text-center text-card-foreground/70 hover:text-primary transition-colors duration-200',
                isActive && 'text-primary'
              )}
            >
              <Icon className="h-6 w-6 sm:h-7 sm:w-7 mb-1" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-xs sm:text-sm font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
