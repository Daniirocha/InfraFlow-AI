'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';

type Task = {
  id: string;
  title: string;
  status: string;
  dueDate: string | null;
  type: string;
  assignee: { name: string } | null;
  ticket: { title: string } | null;
};

export default function TasksPage() {
  const { user } = useAuth();
  const canWrite = user?.role === 'ADMIN' || user?.role === 'TECHNICIAN';
  const [filter, setFilter] = useState<'all' | 'overdue'>('all');
  const [rows, setRows] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = filter === 'overdue' ? '?overdue=true' : '';
    apiFetch<Task[]>(`/tasks${q}`)
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro'));
  }, [filter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tarefas</h1>
          <p className="text-sm text-muted-foreground">Workflows ligados a chamados ou preventivas.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canWrite && (
            <Link href="/tasks/new">
              <Button type="button">Nova tarefa</Button>
            </Link>
          )}
          <Button variant={filter === 'all' ? 'default' : 'outline'} type="button" onClick={() => setFilter('all')}>
            Todas
          </Button>
          <Button
            variant={filter === 'overdue' ? 'default' : 'outline'}
            type="button"
            onClick={() => setFilter('overdue')}
          >
            Atrasadas
          </Button>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="space-y-3">
        {rows.map((t) => (
          <Link key={t.id} href={`/tasks/${t.id}`} className="block">
            <Card className="transition-colors hover:border-primary/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>
                  {t.status} · {t.type}
                </p>
                <p className="mt-1">
                  Chamado: {t.ticket?.title ?? '—'} · Responsável: {t.assignee?.name ?? '—'}
                </p>
                {t.dueDate && (
                  <p className="mt-1">Prazo: {new Date(t.dueDate).toLocaleString('pt-BR')}</p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      {rows.length === 0 && !error && <p className="text-sm text-muted-foreground">Nenhuma tarefa.</p>}
    </div>
  );
}
