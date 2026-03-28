'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';

type Assignable = { id: string; name: string; email: string };
type EquipmentRow = { id: string; name: string; patrimonyNumber: string };

const STATUSES = ['PENDING', 'IN_PROGRESS', 'DONE', 'BLOCKED'] as const;

export default function NewTaskPage() {
  const router = useRouter();
  const { user } = useAuth();
  const canWrite = user?.role === 'ADMIN' || user?.role === 'TECHNICIAN';

  const [assignables, setAssignables] = useState<Assignable[]>([]);
  const [equipment, setEquipment] = useState<EquipmentRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('ticket_related');
  const [status, setStatus] = useState<string>('PENDING');
  const [dueDate, setDueDate] = useState('');
  const [ticketId, setTicketId] = useState('');
  const [equipmentId, setEquipmentId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const q = new URLSearchParams(window.location.search).get('ticketId');
      if (q) setTicketId(q);
    }
  }, []);

  useEffect(() => {
    if (!canWrite) return;
    Promise.all([
      apiFetch<Assignable[]>('/users/assignable'),
      apiFetch<EquipmentRow[]>('/equipment'),
    ])
      .then(([a, eq]) => {
        setAssignables(a);
        setEquipment(eq);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro'));
  }, [canWrite]);

  if (!canWrite) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Sem permissão para criar tarefas.</p>
        <Link href="/tasks" className="text-sm text-primary underline">
          Voltar
        </Link>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        title,
        description: description.trim() || undefined,
        type,
        status,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        ticketId: ticketId.trim() || null,
        equipmentId: equipmentId || null,
        assigneeId: assigneeId || null,
      };
      const created = await apiFetch<{ id: string }>('/tasks', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      router.push(`/tasks/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <Link href="/tasks" className="text-sm text-muted-foreground hover:text-foreground">
          ← Tarefas
        </Link>
        <h1 className="mt-1 text-2xl font-bold">Nova tarefa</h1>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Card>
        <CardHeader>
          <CardTitle>Detalhes</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="text-sm font-medium">Título</label>
              <Input required value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Descrição</label>
              <textarea
                className="mt-1 min-h-[100px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tipo</label>
              <Input value={type} onChange={(e) => setType(e.target.value)} placeholder="ex.: ticket_related" />
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <select
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Prazo (opcional)</label>
              <Input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">ID do chamado (opcional)</label>
              <Input value={ticketId} onChange={(e) => setTicketId(e.target.value)} placeholder="cuid do chamado" />
            </div>
            <div>
              <label className="text-sm font-medium">Equipamento</label>
              <select
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={equipmentId}
                onChange={(e) => setEquipmentId(e.target.value)}
              >
                <option value="">— Nenhum —</option>
                {equipment.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.patrimonyNumber} · {eq.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Responsável</label>
              <select
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
              >
                <option value="">— Nenhum —</option>
                {assignables.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando…' : 'Criar tarefa'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
