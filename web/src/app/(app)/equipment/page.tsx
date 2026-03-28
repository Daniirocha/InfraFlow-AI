'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';

type Equipment = {
  id: string;
  patrimonyNumber: string;
  name: string;
  type: string;
  status: string;
  sector: string;
  location: string | null;
  _count: { maintenances: number; tickets: number };
};

export default function EquipmentPage() {
  const { user } = useAuth();
  const canWrite = user?.role === 'ADMIN' || user?.role === 'TECHNICIAN';
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<Equipment[]>([]);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => (q ? `?q=${encodeURIComponent(q)}` : ''), [q]);

  useEffect(() => {
    apiFetch<Equipment[]>(`/equipment${query}`)
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro'));
  }, [query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Equipamentos</h1>
          <p className="text-sm text-muted-foreground">Patrimônio, setor e status.</p>
        </div>
        {canWrite && (
          <Link href="/equipment/new">
            <Button>Novo equipamento</Button>
          </Link>
        )}
      </div>
      <Input placeholder="Buscar por nome, patrimônio ou setor…" value={q} onChange={(e) => setQ(e.target.value)} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid gap-3 md:grid-cols-2">
        {rows.map((e) => (
          <Card key={e.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {e.name}{' '}
                <span className="text-sm font-normal text-muted-foreground">({e.patrimonyNumber})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">{e.sector}</span> · {e.type} · {e.status}
              </p>
              <p className="mt-1">
                Manutenções: {e._count.maintenances} · Chamados: {e._count.tickets}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      {rows.length === 0 && !error && <p className="text-sm text-muted-foreground">Nenhum equipamento encontrado.</p>}
    </div>
  );
}
