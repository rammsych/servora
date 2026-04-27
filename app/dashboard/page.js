'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/libs/supabaseClient';

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="bg-slate-950 text-white px-5 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Servora</h1>
          <p className="text-xs text-slate-300">
            Gestión inteligente de guías de servicio
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg text-sm"
        >
          Salir
        </button>
      </header>

      <section className="p-5">
        <h2 className="text-2xl font-bold text-slate-900">
          Dashboard
        </h2>

        <div className="grid grid-cols-1 gap-4 mt-5">
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-slate-500">Guías creadas hoy</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {stats.today}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-slate-500">Pendientes de revisión</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {stats.pending}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-slate-500">Aprobadas</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">
              {stats.approved}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 mt-6">
          <button
            onClick={() => router.push('/guides/new')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl py-4"
          >
            + Crear guía de servicio
          </button>

          <button
            onClick={() => router.push('/guides')}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl py-4"
          >
            Ver guías generadas
          </button>
        </div>
      </section>
    </main>
  );
}