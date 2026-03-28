'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Cpu,
  Ticket,
  ListTodo,
  FileBarChart,
  Bell,
  LogOut,
  Moon,
  Sun,
  Shield,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/equipment', label: 'Equipamentos', icon: Cpu },
  { href: '/tickets', label: 'Chamados', icon: Ticket },
  { href: '/tasks', label: 'Tarefas', icon: ListTodo },
  { href: '/reports', label: 'Relatórios', icon: FileBarChart },
  { href: '/notifications', label: 'Notificações', icon: Bell },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-card/80 backdrop-blur md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <div className="h-9 w-9 rounded-lg bg-primary/15 text-center text-lg font-bold leading-9 text-primary">
            IF
          </div>
          <div>
            <p className="text-sm font-semibold">InfraFlow AI</p>
            <p className="text-xs text-muted-foreground">Gestão de TI</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} href={item.href}>
                <span
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </span>
              </Link>
            );
          })}
          {user?.role === 'ADMIN' && (
            <Link href="/admin/users">
              <span
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  pathname.startsWith('/admin')
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted',
                )}
              >
                <Shield className="h-4 w-4" />
                Admin
              </span>
            </Link>
          )}
        </nav>
        <div className="border-t border-border p-4 text-xs text-muted-foreground">
          <p className="truncate font-medium text-foreground">
            {user?.name ?? user?.email ?? '—'}
          </p>
          <p className="truncate">{user?.email}</p>
          <p className="mt-1 uppercase tracking-wide">{user?.role}</p>
        </div>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur md:px-8">
          <div className="md:hidden">
            <p className="font-semibold">InfraFlow AI</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              className="h-9 w-9 px-0"
              aria-label="Alternar tema"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button type="button" variant="outline" className="gap-2" onClick={() => logout()}>
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </header>
        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="px-4 py-6 pb-24 md:px-8 md:pb-6"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
