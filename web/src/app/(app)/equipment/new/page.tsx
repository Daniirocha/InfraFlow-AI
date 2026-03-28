'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';

const statuses = ['ACTIVE', 'IN_MAINTENANCE', 'INACTIVE', 'RETIRED'] as const;

export default function NewEquipmentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const canWrite = user?.role === 'ADMIN' || user?.role === 'TECHNICIAN';
  const [form, setForm] = useState({
    patrimonyNumber: '',
    name: '',
    type: 'computer',
    status: 'ACTIVE',
    sector: '',
    location: '',
    notes: '',
  });
  const [error, setError] = useState<string | null>(null);

  if (!canWrite) {
    return <p className="text-sm text-muted-foreground">Sem permissão para criar equipamentos.</p>;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await apiFetch('/equipment', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          location: form.location || undefined,
          notes: form.notes || undefined,
        }),
      });
      router.push('/equipment');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    }
  }

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Novo equipamento</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={onSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Patrimônio</label>
              <Input
                required
                value={form.patrimonyNumber}
                onChange={(e) => setForm((f) => ({ ...f, patrimonyNumber: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tipo</label>
              <Input
                required
                placeholder="computer, printer…"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Nome</label>
            <Input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Setor</label>
              <Input required value={form.sector} onChange={(e) => setForm((f) => ({ ...f, sector: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <select
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Localização</label>
            <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
          </div>
          <div>
            <label className="text-sm font-medium">Observações</label>
            <Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit">Salvar</Button>
        </form>
      </CardContent>
    </Card>
  );
}
