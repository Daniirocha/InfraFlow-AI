'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';

type NotificationRow = {
  id: string;
  title: string;
  body: string | null;
  read: boolean;
  type: string;
  createdAt: string;
};

export default function NotificationsPage() {
  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const data = await apiFetch<NotificationRow[]>('/notifications');
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function markRead(id: string) {
    await apiFetch(`/notifications/${id}/read`, { method: 'PATCH' });
    load();
  }

  async function markAll() {
    await apiFetch('/notifications/read-all', { method: 'PATCH' });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notificações</h1>
          <p className="text-sm text-muted-foreground">Atribuições e alertas de atraso.</p>
        </div>
        <Button type="button" variant="outline" onClick={markAll}>
          Marcar todas como lidas
        </Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="space-y-3">
        {rows.map((n) => (
          <Card key={n.id} className={n.read ? 'opacity-70' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{n.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              {n.body && <p>{n.body}</p>}
              <p>
                {n.type} · {new Date(n.createdAt).toLocaleString('pt-BR')}
              </p>
              {!n.read && (
                <Button type="button" variant="outline" size="sm" onClick={() => markRead(n.id)}>
                  Marcar lida
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      {rows.length === 0 && !error && <p className="text-sm text-muted-foreground">Nenhuma notificação.</p>}
    </div>
  );
}
