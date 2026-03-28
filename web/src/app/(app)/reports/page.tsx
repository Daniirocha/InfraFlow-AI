'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiFetch, API_BASE, getStoredAccess } from '@/lib/api';

type Weekly = {
  weekStart: string;
  weekEnd: string;
  metrics: { ticketCount: number; overdueTasks: number; byCategory: Record<string, number> };
  insights: string[];
  narrative: string;
};

type Reco = {
  recommendation: string;
  sectors: { sector: string; count: number }[];
};

export default function ReportsPage() {
  const [weekly, setWeekly] = useState<Weekly | null>(null);
  const [reco, setReco] = useState<Reco | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([apiFetch<Weekly>('/reports/weekly'), apiFetch<Reco>('/ai/recommendations')])
      .then(([w, r]) => {
        setWeekly(w);
        setReco(r);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro'));
  }, []);

  async function download(format: 'json' | 'csv') {
    const token = getStoredAccess();
    if (!token) return;
    const res = await fetch(`${API_BASE}/reports/export?format=${format}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `infraflow-export.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <p className="text-sm text-muted-foreground">Resumo semanal e exportação JSON/CSV.</p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {reco && (
        <Card>
          <CardHeader>
            <CardTitle>Recomendação automática</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p className="text-foreground">{reco.recommendation}</p>
            <ul className="list-disc pl-5">
              {reco.sectors.map((s) => (
                <li key={s.sector}>
                  {s.sector}: {s.count} chamado(s)
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {weekly && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo executivo (semana)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              {new Date(weekly.weekStart).toLocaleDateString('pt-BR')} —{' '}
              {new Date(weekly.weekEnd).toLocaleDateString('pt-BR')}
            </p>
            <p>
              Chamados: <strong>{weekly.metrics.ticketCount}</strong> · Tarefas atrasadas:{' '}
              <strong>{weekly.metrics.overdueTasks}</strong>
            </p>
            <ul className="list-disc pl-5 text-muted-foreground">
              {weekly.insights.map((i, idx) => (
                <li key={idx}>{i}</li>
              ))}
            </ul>
            <p className="rounded-lg border border-border bg-muted/30 p-3 text-foreground">{weekly.narrative}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Exportação</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <p className="w-full text-sm text-muted-foreground">
            Download autenticado com o token salvo no navegador (mesma sessão do app).
          </p>
          <Button type="button" variant="outline" onClick={() => download('json')}>
            Baixar JSON
          </Button>
          <Button type="button" variant="outline" onClick={() => download('csv')}>
            Baixar CSV
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
