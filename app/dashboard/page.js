'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/libs/supabaseClient';

export default function DashboardPage() {
  const router = useRouter();

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
            <p className="text-3xl font-bold text-slate-900 mt-2">0</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-slate-500">Pendientes de revisión</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">0</p>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-slate-500">Aprobadas</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">0</p>
          </div>
        </div>

        <button
          onClick={() => router.push('/guides/new')}
          className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl py-4"
        >
          + Crear guía de servicio
        </button>
      </section>
    </main>
  );
}