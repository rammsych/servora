'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/libs/supabaseClient';

export default function GuidesPage() {
  const router = useRouter();
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);


  const loadGuides = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('service_guides')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      setGuides([]);
    } else {
      setGuides(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadGuides();
  }, []);

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="bg-slate-950 text-white px-5 py-4">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-sm text-slate-300 mb-2"
        >
          ← Volver
        </button>

        <h1 className="text-xl font-bold">Guías de servicio</h1>
        <p className="text-xs text-slate-300">
          Listado de guías registradas
        </p>
      </header>

      <section className="p-5">
        <button
          onClick={() => router.push('/guides/new')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl py-4 mb-5"
        >
          + Nueva guía
        </button>

        {loading && (
          <p className="text-slate-500 text-sm">Cargando guías...</p>
        )}

        {!loading && guides.length === 0 && (
          <div className="bg-white rounded-2xl p-5 text-center text-slate-500">
            No hay guías registradas.
          </div>
        )}

        <div className="space-y-4">
          {guides.map((guide) => (
            <div
              key={guide.id}
              className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
            >
              <div className="flex justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500">Guía</p>
                  <h2 className="text-lg font-bold text-slate-900">
                    N° {guide.guide_number}
                  </h2>
                </div>

                <StatusBadge status={guide.status} />
              </div>

              <div className="mt-4 text-sm text-slate-600 space-y-1">
                <p>
                  <strong>Fecha:</strong> {guide.service_date || '-'}
                </p>
                <p>
                  <strong>Mantenimiento:</strong>{' '}
                  {getMaintenanceLabel(guide.maintenance_type)}
                </p>
                <p>
                  <strong>Cliente:</strong> {guide.customer_name || '-'}
                </p>
                <p>
                  <strong>Actividad:</strong>{' '}
                  {guide.activity_description
                    ? guide.activity_description.slice(0, 80)
                    : '-'}
                </p>
              </div>

              <button
                onClick={() => router.push(`/guides/${guide.id}`)}
                className="mt-4 w-full border border-slate-300 rounded-xl py-3 font-semibold text-slate-700"
              >
                Ver detalle
              </button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function StatusBadge({ status }) {
  const labels = {
    draft: 'Borrador',
    submitted: 'Enviada',
    approved: 'Aprobada',
    rejected: 'Rechazada',
  };

  const styles = {
    draft: 'bg-slate-100 text-slate-700',
    submitted: 'bg-blue-100 text-blue-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${
        styles[status] || styles.draft
      }`}
    >
      {labels[status] || status}
    </span>
  );
}

function getMaintenanceLabel(value) {
  const labels = {
    preventive: 'Preventiva',
    corrective: 'Correctiva',
    emergency: 'Emergencia',
  };

  return labels[value] || '-';
}