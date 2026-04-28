'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/libs/supabaseClient';
import AppShell from '@/components/AppShell';
import { Card, ButtonPrimary, ButtonSecondary } from '@/components/ui';

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
    <AppShell>
      <div className="mb-6">
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="mb-4 text-sm text-gray-400 hover:text-cyan-300"
        >
          ← Volver al dashboard
        </button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-gray-400">SERVORA / Guías</p>
            <h2 className="text-2xl font-bold text-white mt-1">
              Guías de servicio
            </h2>
            <p className="text-sm text-gray-400 mt-2">
              Revisa, crea y administra las guías registradas.
            </p>
          </div>

          <ButtonPrimary
            type="button"
            onClick={() => router.push('/guides/new')}
            className="w-full sm:w-auto"
          >
            + Nueva guía
          </ButtonPrimary>
        </div>
      </div>

      {loading && (
        <Card>
          <div className="flex items-center gap-3 text-gray-400">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />
            <p className="text-sm">Cargando guías...</p>
          </div>
        </Card>
      )}

      {!loading && guides.length === 0 && (
        <Card>
          <div className="py-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-3xl">
              📄
            </div>

            <h3 className="text-lg font-semibold text-white">
              No hay guías registradas
            </h3>

            <p className="mt-2 text-sm text-gray-400">
              Crea tu primera guía de servicio para comenzar a usar SERVORA.
            </p>

            <ButtonPrimary
              type="button"
              onClick={() => router.push('/guides/new')}
              className="mt-5"
            >
              + Crear primera guía
            </ButtonPrimary>
          </div>
        </Card>
      )}

      {!loading && guides.length > 0 && (
        <div className="space-y-4">
          {guides.map((guide) => (
            <Card key={guide.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-400">Guía</p>
                  <h3 className="text-xl font-bold text-white">
                    N° {guide.guide_number || 'Sin número'}
                  </h3>
                </div>

                <StatusBadge status={guide.status} />
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                <InfoItem
                  label="Fecha"
                  value={guide.service_date || '-'}
                />

                <InfoItem
                  label="Mantenimiento"
                  value={getMaintenanceLabel(guide.maintenance_type)}
                />

                <InfoItem
                  label="Cliente"
                  value={guide.customer_name || '-'}
                />

                <InfoItem
                  label="Institución"
                  value={guide.institution_name || '-'}
                />
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-[#0f172a] p-4">
                <p className="text-xs text-gray-400 mb-1">
                  Actividad realizada
                </p>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {guide.activity_description
                    ? guide.activity_description.slice(0, 140)
                    : 'Sin descripción registrada.'}
                  {guide.activity_description &&
                  guide.activity_description.length > 140
                    ? '...'
                    : ''}
                </p>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <ButtonSecondary
                  type="button"
                  onClick={() => router.push(`/guides/${guide.id}`)}
                  className="w-full sm:w-auto"
                >
                  Ver detalle
                </ButtonSecondary>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-gray-200">
        {value}
      </p>
    </div>
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
    draft: 'border-gray-400/30 bg-gray-400/10 text-gray-300',
    submitted: 'border-blue-400/30 bg-blue-400/10 text-blue-300',
    approved: 'border-green-400/30 bg-green-400/10 text-green-300',
    rejected: 'border-red-400/30 bg-red-400/10 text-red-300',
  };

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
        styles[status] || styles.draft
      }`}
    >
      {labels[status] || status || 'Borrador'}
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