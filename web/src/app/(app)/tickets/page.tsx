'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';

type Ticket = {
  id: string;
  title: string;
  status: string;
  priority: string;
  category: string | null;
  assignee: { name: string } | null;
  createdAt: string;
};

export default function TicketsPage() {
  const { user } = useAuth();
  const canWrite = user?.role === 'ADMIN' || user?.role === 'TECHNICIAN';
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<Ticket[]>([]);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => (q ? `?q=${encodeURIComponent(q)}` : ''), [q]);

  useEffect(() => {
    apiFetch<Ticket[]>(`/tickets${query}`)
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro'));
  }, [query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Chamados</h1>
          <p className="text-sm text-muted-foreground">Tickets de suporte e SLA.</p>
        </div>
        {canWrite && (
          <Link href="/tickets/new">
            <Button>Novo chamado</Button>
          </Link>
        )}
      </div>
      <Input placeholder="Buscar chamados…" value={q} onChange={(e) => setQ(e.target.value)} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="space-y-3">
        {rows.map((t) => (
          <Link key={t.id} href={`/tickets/${t.id}`} className="block">
            <Card className="transition-colors hover:border-primary/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>
                  {t.status} · {t.priority}
                  {t.category ? ` · ${t.category}` : ''}
                </p>
                <p className="mt-1">
                  Responsável: {t.assignee?.name ?? '—'} · {new Date(t.createdAt).toLocaleString('pt-BR')}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      {rows.length === 0 && !error && <p className="text-sm text-muted-foreground">Nenhum chamado.</p>}
    </div>
  );
}
