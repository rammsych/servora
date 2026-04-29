'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/libs/supabaseClient';
import AppShell from '@/components/AppShell';
import { Card, ButtonPrimary, ButtonSecondary } from '@/components/ui.js';

export default function DashboardPage() {
  const router = useRouter();

  const [stats, setStats] = useState({
    today: 0,
    pending: 0,
    approved: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const today = new Date().toISOString().slice(0, 10);

    const { count: todayCount } = await supabase
      .from('service_guides')
      .select('*', { count: 'exact', head: true })
      .eq('service_date', today);

    const { count: pendingCount } = await supabase
      .from('service_guides')
      .select('*', { count: 'exact', head: true })
      .in('status', ['draft', 'submitted']);

    const { count: approvedCount } = await supabase
      .from('service_guides')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved');

    setStats({
      today: todayCount || 0,
      pending: pendingCount || 0,
      approved: approvedCount || 0,
    });
  };

  return (
    <AppShell>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <Card>
          <p className="text-gray-400 text-sm">Guías creadas hoy</p>
          <p className="text-4xl font-bold mt-2 bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            {stats.today}
          </p>
        </Card>

        <Card>
          <p className="text-gray-400 text-sm">Pendientes</p>
          <p className="text-4xl font-bold mt-2 bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            {stats.pending}
          </p>
        </Card>

        <Card>
          <p className="text-gray-400 text-sm">Aprobadas</p>
          <p className="text-4xl font-bold mt-2 bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            {stats.approved}
          </p>
        </Card>
      </div>

      <Card>
        <h2 className="text-xl font-bold mb-2">Acciones rápidas</h2>
        <p className="text-gray-400 mb-5">
          Gestiona tus guías de forma rápida.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <ButtonPrimary onClick={() => router.push('/guides/new')}>
            + Crear guía de servicio
          </ButtonPrimary>

          <ButtonSecondary onClick={() => router.push('/guides')}>
            Ver guías generadas
          </ButtonSecondary>
        </div>
      </Card>
    </AppShell>
  );
}