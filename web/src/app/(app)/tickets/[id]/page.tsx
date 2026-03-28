'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiFetch, apiPostFormData } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';

const STATUSES = ['OPEN', 'IN_PROGRESS', 'IN_REVIEW', 'CLOSED'] as const;
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

type TicketDetail = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string | null;
  estimatedMinutes: number | null;
  equipmentId: string | null;
  assigneeId: string | null;
  equipment: { id: string; name: string; patrimonyNumber: string } | null;
  assignee: { id: string; name: string; email: string } | null;
  createdBy: { id: string; name: string; email: string };
  attachments: { id: string; fileName: string; createdAt: string }[];
  tasks: { id: string; title: string; status: string }[];
  createdAt: string;
};

type Assignable = { id: string; name: string; email: string; role: string };
type EquipmentRow = { id: string; name: string; patrimonyNumber: string };

export default function TicketDetailPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const { user } = useAuth();
  const canWrite = user?.role === 'ADMIN' || user?.role === 'TECHNICIAN';

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [assignables, setAssignables] = useState<Assignable[]>([]);
  const [equipment, setEquipment] = useState<EquipmentRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<string>('OPEN');
  const [priority, setPriority] = useState<string>('MEDIUM');
  const [category, setCategory] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [equipmentId, setEquipmentId] = useState('');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setError(null);
    Promise.all([
      apiFetch<TicketDetail>(`/tickets/${id}`),
      canWrite ? apiFetch<Assignable[]>('/users/assignable') : Promise.resolve([]),
      apiFetch<EquipmentRow[]>('/equipment'),
    ])
      .then(([t, a, eq]) => {
        if (cancelled) return;
        setTicket(t);
        setTitle(t.title);
        setDescription(t.description);
        setStatus(t.status);
        setPriority(t.priority);
        setCategory(t.category ?? '');
        setEstimatedMinutes(t.estimatedMinutes != null ? String(t.estimatedMinutes) : '');
        setAssigneeId(t.assigneeId ?? '');
        setEquipmentId(t.equipmentId ?? '');
        setAssignables(a);
        setEquipment(eq);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro'));
    return () => {
      cancelled = true;
    };
  }, [id, canWrite]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!canWrite || !id) return;
    setSaving(true);
    setError(null);
    try {
      const est = estimatedMinutes.trim();
      await apiFetch(`/tickets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title,
          description,
          status,
          priority,
          category: category.trim() || undefined,
          estimatedMinutes: est === '' ? undefined : Number(est),
          assigneeId: assigneeId === '' ? null : assigneeId,
          equipmentId: equipmentId === '' ? null : equipmentId,
        }),
      });
      const t = await apiFetch<TicketDetail>(`/tickets/${id}`);
      setTicket(t);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !canWrite || !id) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      await apiPostFormData(`/tickets/${id}/attachments`, fd);
      const t = await apiFetch<TicketDetail>(`/tickets/${id}`);
      setTicket(t);
      e.target.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no upload');
    } finally {
      setUploading(false);
    }
  }

  if (!id) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-20 md:pb-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link href="/tickets" className="text-sm text-muted-foreground hover:text-foreground">
            ← Chamados
          </Link>
          <h1 className="mt-1 text-2xl font-bold">Chamado</h1>
        </div>
        {ticket && canWrite && (
          <Link href={`/tasks/new?ticketId=${ticket.id}`}>
            <Button type="button" variant="outline" size="sm">
              Nova tarefa
            </Button>
          </Link>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!ticket && !error && <p className="text-sm text-muted-foreground">Carregando…</p>}

      {ticket && (
        <form className="space-y-4" onSubmit={onSave}>
          <Card>
            <CardHeader>
              <CardTitle>Detalhes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Título</label>
                <Input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={!canWrite}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Descrição</label>
                <textarea
                  required
                  className="mt-1 min-h-[140px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:opacity-60"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={!canWrite}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <select
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:opacity-60"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    disabled={!canWrite}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Prioridade</label>
                  <select
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:opacity-60"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    disabled={!canWrite}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Categoria</label>
                <Input value={category} onChange={(e) => setCategory(e.target.value)} disabled={!canWrite} />
              </div>
              <div>
                <label className="text-sm font-medium">Estimativa (minutos)</label>
                <Input
                  type="number"
                  min={0}
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(e.target.value)}
                  disabled={!canWrite}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Responsável</label>
                  {canWrite ? (
                    <select
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      value={assigneeId}
                      onChange={(e) => setAssigneeId(e.target.value)}
                    >
                      <option value="">— Nenhum —</option>
                      {assignables.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {ticket.assignee?.name ?? '—'}
                      {ticket.assignee?.email ? ` · ${ticket.assignee.email}` : ''}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">Equipamento</label>
                  {canWrite ? (
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
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {ticket.equipment
                        ? `${ticket.equipment.patrimonyNumber} · ${ticket.equipment.name}`
                        : '—'}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Aberto por {ticket.createdBy.name} ·{' '}
                {new Date(ticket.createdAt).toLocaleString('pt-BR')}
              </p>
              {canWrite && (
                <Button type="submit" disabled={saving}>
                  {saving ? 'Salvando…' : 'Salvar alterações'}
                </Button>
              )}
            </CardContent>
          </Card>
        </form>
      )}

      {ticket && (
        <Card>
          <CardHeader>
            <CardTitle>Anexos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {canWrite && (
              <div>
                <label className="text-sm font-medium">Enviar arquivo (máx. 8 MB)</label>
                <Input
                  type="file"
                  className="mt-1 cursor-pointer"
                  disabled={uploading}
                  onChange={onFile}
                />
              </div>
            )}
            <ul className="space-y-1 text-sm text-muted-foreground">
              {ticket.attachments.map((a) => (
                <li key={a.id}>{a.fileName}</li>
              ))}
            </ul>
            {ticket.attachments.length === 0 && <p className="text-sm text-muted-foreground">Nenhum anexo.</p>}
          </CardContent>
        </Card>
      )}

      {ticket && ticket.tasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tarefas ligadas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {ticket.tasks.map((t) => (
              <Link
                key={t.id}
                href={`/tasks/${t.id}`}
                className="block rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/50"
              >
                {t.title} · {t.status}
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
