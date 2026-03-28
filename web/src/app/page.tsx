import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted px-4 py-16">
      <div className="mx-auto max-w-5xl space-y-10">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">InfraFlow AI</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            Gestão inteligente de infraestrutura e chamados de TI
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Organize patrimônio, suporte e tarefas da equipe com dashboards, auditoria e sugestões de prioridade
            via Google Gemini.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/login">
              <Button>Entrar</Button>
            </Link>
            <Link href="/register">
              <Button variant="outline">Criar conta</Button>
            </Link>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: 'Chamados com IA',
              body: 'Prioridade, categoria e tempo estimado a partir da descrição.',
            },
            {
              title: 'Equipamentos e manutenções',
              body: 'Patrimônio, setor, status e histórico de manutenção.',
            },
            {
              title: 'Operação em tempo real',
              body: 'Métricas, relatórios exportáveis e notificações da equipe.',
            },
          ].map((c) => (
            <Card key={c.title}>
              <CardHeader>
                <CardTitle className="text-base">{c.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{c.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
