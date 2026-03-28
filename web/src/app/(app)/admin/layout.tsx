'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && user.role !== 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        Carregando…
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  return <>{children}</>;
}
