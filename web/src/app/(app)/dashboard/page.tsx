'use client';

import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Pie,
  PieChart,
  Cell,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiFetch } from '@/lib/api';

type Stats = {
  ticketsByStatus: { status: string; count: number }[];
  equipmentBySector: { sector: string; count: number }[];
  overdueTasks: number;
  openTickets: number;
  equipmentTotal: number;
  updatedAt: string;
};

const COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#8b5cf6'];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Stats>('/dashboard/stats')
      .then(setStats)
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro ao carregar'));
  }, []);

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (!stats) {
    return <p className="text-muted-foreground">Carregando métricas…</p>;
  }

  const ticketChart = stats.ticketsByStatus.map((t) => ({
    name: t.status.replace('_', ' '),
    total: t.count,
  }));

  const sectorChart = stats.equipmentBySector.map((s) => ({
    name: s.sector,
    value: s.count,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard operacional</h1>
        <p className="text-sm text-muted-foreground">
          Atualizado em {new Date(stats.updatedAt).toLocaleString('pt-BR')}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Chamados abertos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.openTickets}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Equipamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.equipmentTotal}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Tarefas atrasadas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">{stats.overdueTasks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Setores mapeados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.equipmentBySector.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Chamados por status</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ticketChart}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Equipamentos por setor</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sectorChart} dataKey="value" nameKey="name" outerRadius={90} label>
                  {sectorChart.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
