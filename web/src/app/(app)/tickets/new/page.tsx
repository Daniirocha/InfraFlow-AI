'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';

type AiResult = {
  priority: string;
  category: string;
  estimatedMinutes: number;
  source: string;
};

export default function NewTicketPage() {
  const { user } = useAuth();
  const router = useRouter();
  const canWrite = user?.role === 'ADMIN' || user?.role === 'TECHNICIAN';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [equipmentId, setEquipmentId] = useState('');
  const [applyAi, setApplyAi] = useState(true);
  const [ai, setAi] = useState<AiResult | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canWrite) {
    return <p className="text-sm text-muted-foreground">Sem permissão para abrir chamados.</p>;
  }

  async function runAi() {
    setLoadingAi(true);
    setError(null);
    try {
      const res = await apiFetch<AiResult>('/ai/analyze-ticket', {
        method: 'POST',
        body: JSON.stringify({ description }),
      });
      setAi(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha na IA');
    } finally {
      setLoadingAi(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await apiFetch('/tickets', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          equipmentId: equipmentId || undefined,
          applyAi,
        }),
      });
      router.push('/tickets');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar');
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Novo chamado</h1>
        <p className="text-sm text-muted-foreground">
          Descreva o problema; a IA sugere prioridade e categoria (Gemini ou modo local sem chave).
        </p>
      </div>

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
                required
                className="mt-1 min-h-[120px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">ID do equipamento (opcional)</label>
              <Input
                placeholder="cole o ID do Prisma / equipamento"
                value={equipmentId}
                onChange={(e) => setEquipmentId(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={applyAi} onChange={(e) => setApplyAi(e.target.checked)} />
              Aplicar sugestões da IA ao salvar
            </label>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={runAi} disabled={loadingAi || description.length < 5}>
                {loadingAi ? 'Analisando…' : 'Pré-visualizar IA'}
              </Button>
              <Button type="submit">Abrir chamado</Button>
            </div>
            {ai && (
              <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
                <p className="font-medium">Sugestão ({ai.source})</p>
                <p>
                  Prioridade: {ai.priority} · Categoria: {ai.category} · Estimativa: {ai.estimatedMinutes} min
                </p>
              </div>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
