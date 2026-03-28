'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';

type Assignable = { id: string; name: string; email: string };
type TaskDetail = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  type: string;
  dueDate: string | null;
  ticketId: string | null;
  equipmentId: string | null;
  assigneeId: string | null;
  ticket: { id: string; title: string } | null;
  equipment: { id: string; name: string; patrimonyNumber: string } | null;
  assignee: { id: string; name: string; email: string } | null;
  outgoingDeps: { dependsOn: { id: string; title: string; status: string } }[];
};

const STATUSES = ['PENDING', 'IN_PROGRESS', 'DONE', 'BLOCKED'] as const;

export default function TaskDetailPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const { user } = useAuth();
  const canWrite = user?.role === 'ADMIN' || user?.role === 'TECHNICIAN';

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [assignables, setAssignables] = useState<Assignable[]>([]);
  const [allTasks, setAllTasks] = useState<{ id: string; title: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [depId, setDepId] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('PENDING');
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState('');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setError(null);
    const load = async () => {
      try {
        const t = await apiFetch<TaskDetail>(`/tasks/${id}`);
        if (cancelled) return;
        setTask(t);
        setTitle(t.title);
        setDescription(t.description ?? '');
        setStatus(t.status);
        setDueDate(
          t.dueDate
            ? new Date(t.dueDate).toISOString().slice(0, 16)
            : '',
        );
        setAssigneeId(t.assigneeId ?? '');
        if (canWrite) {
          const [a, list] = await Promise.all([
            apiFetch<Assignable[]>('/users/assignable'),
            apiFetch<{ id: string; title: string }[]>('/tasks'),
          ]);
          if (!cancelled) {
            setAssignables(a);
            setAllTasks(list.filter((x) => x.id !== id));
          }
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Erro');
      }
    };
    void load();
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
      await apiFetch(`/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title,
          description: description.trim() || undefined,
          status,
          dueDate: dueDate === '' ? null : new Date(dueDate).toISOString(),
          assigneeId: assigneeId === '' ? null : assigneeId,
        }),
      });
      const t = await apiFetch<TaskDetail>(`/tasks/${id}`);
      setTask(t);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  async function addDependency() {
    if (!depId || !canWrite || !id) return;
    setError(null);
    try {
      await apiFetch(`/tasks/${id}/dependencies`, {
        method: 'POST',
        body: JSON.stringify({ dependsOnTaskId: depId }),
      });
      const t = await apiFetch<TaskDetail>(`/tasks/${id}`);
      setTask(t);
      setDepId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na dependência');
    }
  }

  if (!id) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-20 md:pb-8">
      <div>
        <Link href="/tasks" className="text-sm text-muted-foreground hover:text-foreground">
          ← Tarefas
        </Link>
        <h1 className="mt-1 text-2xl font-bold">Tarefa</h1>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!task && !error && <p className="text-sm text-muted-foreground">Carregando…</p>}

      {task && (
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
                  className="mt-1 min-h-[100px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:opacity-60"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={!canWrite}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Tipo: {task.type}
                {task.ticket && (
                  <>
                    {' '}
                    · Chamado:{' '}
                    <Link href={`/tickets/${task.ticket.id}`} className="text-primary underline">
                      {task.ticket.title}
                    </Link>
                  </>
                )}
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Status</label>
                  {canWrite ? (
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
                  ) : (
                    <p className="mt-1 text-sm">{task.status}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">Prazo</label>
                  {canWrite ? (
                    <Input
                      type="datetime-local"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {task.dueDate ? new Date(task.dueDate).toLocaleString('pt-BR') : '—'}
                    </p>
                  )}
                </div>
              </div>
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
                        {u.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">{task.assignee?.name ?? '—'}</p>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Equip.:{' '}
                {task.equipment
                  ? `${task.equipment.patrimonyNumber} · ${task.equipment.name}`
                  : '—'}
              </p>
              {canWrite && (
                <Button type="submit" disabled={saving}>
                  {saving ? 'Salvando…' : 'Salvar'}
                </Button>
              )}
            </CardContent>
          </Card>
        </form>
      )}

      {task && task.outgoingDeps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Depende de</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {task.outgoingDeps.map((d) => (
              <Link
                key={d.dependsOn.id}
                href={`/tasks/${d.dependsOn.id}`}
                className="block rounded border border-border px-2 py-1 hover:bg-muted/50"
              >
                {d.dependsOn.title} · {d.dependsOn.status}
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {task && canWrite && (
        <Card>
          <CardHeader>
            <CardTitle>Adicionar dependência</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="text-sm font-medium">Tarefa pré-requisito</label>
              <select
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={depId}
                onChange={(e) => setDepId(e.target.value)}
              >
                <option value="">— Escolher —</option>
                {allTasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
            <Button type="button" variant="outline" onClick={addDependency} disabled={!depId}>
              Vincular
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
