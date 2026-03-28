'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { MobileNav } from '@/components/mobile-nav';
import { useAuth } from '@/contexts/auth-context';

export default function AppAreaLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Carregando…
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <AppShell>{children}</AppShell>
      <MobileNav />
    </>
  );
}
