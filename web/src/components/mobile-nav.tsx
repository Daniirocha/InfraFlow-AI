'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Cpu, Ticket, ListTodo } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/equipment', icon: Cpu, label: 'Equip.' },
  { href: '/tickets', icon: Ticket, label: 'Chamados' },
  { href: '/tasks', icon: ListTodo, label: 'Tarefas' },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-border bg-card/95 px-2 py-2 backdrop-blur md:hidden">
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 rounded-lg py-1 text-[10px] font-medium',
              active ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
