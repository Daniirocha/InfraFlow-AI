'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
};

const ROLES = ['ADMIN', 'TECHNICIAN', 'VIEWER'] as const;

export default function AdminUsersPage() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<string>('VIEWER');

  function load() {
    apiFetch<UserRow[]>('/users')
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro'));
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      await apiFetch('/users', {
        method: 'POST',
        body: JSON.stringify({ email, name, password, role }),
      });
      setEmail('');
      setName('');
      setPassword('');
      setRole('VIEWER');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
          ← Início
        </Link>
        <h1 className="mt-1 text-2xl font-bold">Usuários</h1>
        <p className="text-sm text-muted-foreground">Criação de contas e listagem (API /users).</p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Novo usuário</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={onCreate}>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium">E-mail</label>
              <Input
                type="email"
                required
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Nome</label>
              <Input required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Senha (mín. 8)</label>
              <Input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Papel</label>
              <select
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={creating}>
                {creating ? 'Criando…' : 'Criar'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm">
            {rows.map((u) => (
              <li
                key={u.id}
                className="flex flex-col gap-1 border-b border-border pb-3 last:border-0 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
              >
                <span className="font-medium">{u.name}</span>
                <span className="text-muted-foreground">{u.email}</span>
                <span className="text-xs uppercase tracking-wide">{u.role}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(u.createdAt).toLocaleString('pt-BR')}
                </span>
              </li>
            ))}
          </ul>
          {rows.length === 0 && <p className="text-sm text-muted-foreground">Nenhum usuário.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
