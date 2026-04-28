'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/libs/supabaseClient';
import PhotoUploader from '@/components/PhotoUploader';
import AppShell from '@/components/AppShell';
import { Card, ButtonSecondary } from '@/components/ui';

export default function GuideDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState([]);

  const loadGuide = async () => {
    const { data, error } = await supabase
      .from('service_guides')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(error);
      setGuide(null);
    } else {
      setGuide(data);
    }

    const { data: photosData } = await supabase
      .from('service_guide_photos')
      .select('*')
      .eq('guide_id', id)
      .order('created_at', { ascending: true });

    setPhotos(photosData || []);
    setLoading(false);
  };

  useEffect(() => {
    if (id) loadGuide();
  }, [id]);

  if (loading) {
    return (
      <AppShell>
        <Card>
          <p className="text-sm text-gray-400">Cargando guía...</p>
        </Card>
      </AppShell>
    );
  }

  if (!guide) {
    return (
      <AppShell>
        <Card>
          <p className="text-sm text-red-400">No se encontró la guía.</p>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-6">
        <button
          onClick={() => router.push('/guides')}
          className="text-sm text-gray-400 hover:text-cyan-300 mb-3"
        >
          ← Volver
        </button>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <p className="text-sm text-gray-400">SERVORA / Guía</p>

            <h1 className="text-2xl font-bold text-white">
              Guía N° {guide.guide_number || 'Sin número'}
            </h1>

            <p className="text-sm text-gray-400">
              Detalle completo del servicio realizado
            </p>
          </div>

          <StatusBadge status={guide.status} />
        </div>
      </div>

      <div className="space-y-5 pb-10">

        <Card>
          <SectionTitle title="Información general" />
          <Grid>
            <Info label="Fecha" value={guide.service_date} />
            <Info label="Hora ingreso" value={guide.start_time} />
            <Info label="Hora término" value={guide.end_time} />
            <Info label="Tipo mantenimiento" value={guide.maintenance_type} />
            <Info label="Tipo actividad" value={guide.activity_type} />
            <Info label="Instalación" value={guide.installation_type} />
          </Grid>
        </Card>

        <Card>
          <SectionTitle title="Equipo intervenido" />
          <Grid>
            <Info label="N° serie" value={guide.equipment_serial} />
            <Info label="Modelo" value={guide.equipment_model} />
            <Info label="Marca" value={guide.equipment_brand} />
            <Info label="Color" value={guide.equipment_color} />
          </Grid>
        </Card>

        <Card>
          <SectionTitle title="Parámetros técnicos" />
          <Grid>
            <Info label="Voltaje" value={guide.electrical_voltage} />
            <Info label="Presión" value={guide.electrical_pressure} />
          </Grid>
        </Card>

        <Card>
          <SectionTitle title="Actividad realizada" />
          <Text value={guide.activity_description} />
        </Card>

        <Card>
          <SectionTitle title="Cambio de componentes" />
          <Text value={guide.component_changes} />
        </Card>

        <Card>
          <SectionTitle title="Observaciones" />
          <Text value={guide.observations} />
        </Card>

        <Card>
          <SectionTitle title="Cliente" />
          <Grid>
            <Info label="Nombre" value={guide.customer_name} />
            <Info label="RUT" value={guide.customer_rut} />
          </Grid>
        </Card>

        <Card>
          <SectionTitle title="Ubicación" />
          <Grid>
            <Info label="Latitud" value={guide.latitude} />
            <Info label="Longitud" value={guide.longitude} />
            <Info
              label="Precisión"
              value={
                guide.location_accuracy
                  ? `${guide.location_accuracy} m`
                  : '-'
              }
            />
          </Grid>

          {guide.latitude && guide.longitude && (
            <a
              href={`https://www.google.com/maps?q=${guide.latitude},${guide.longitude}`}
              target="_blank"
              className="inline-block mt-4 text-sm text-cyan-300 hover:underline"
            >
              Ver en Google Maps
            </a>
          )}
        </Card>

        <Card>
          <SectionTitle title="Fotos del servicio" />

          {photos.length === 0 ? (
            <p className="text-sm text-gray-400">
              No hay fotos registradas.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {photos.map((photo) => (
                <a key={photo.id} href={photo.photo_url} target="_blank">
                  <img
                    src={photo.photo_url}
                    className="w-full h-32 object-cover rounded-2xl border border-white/10"
                  />
                </a>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle title="Agregar más fotos" />
          <PhotoUploader guideId={guide.id} onUploaded={loadGuide} />
        </Card>

        <div className="flex justify-end">
          <ButtonSecondary onClick={() => router.push('/guides')}>
            Volver al listado
          </ButtonSecondary>
        </div>
      </div>
    </AppShell>
  );
}

/* COMPONENTES UI */

function SectionTitle({ title }) {
  return (
    <h2 className="text-lg font-semibold text-white mb-4">
      {title}
    </h2>
  );
}

function Grid({ children }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {children}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm text-gray-200 font-semibold mt-1">
        {value || '-'}
      </p>
    </div>
  );
}

function Text({ value }) {
  return (
    <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
      {value || '-'}
    </p>
  );
}

function StatusBadge({ status }) {
  const styles = {
    draft: 'bg-gray-500/10 text-gray-300 border-gray-500/30',
    submitted: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
    approved: 'bg-green-500/10 text-green-300 border-green-500/30',
    rejected: 'bg-red-500/10 text-red-300 border-red-500/30',
  };

  return (
    <span
      className={`px-3 py-1 rounded-full border text-xs font-semibold ${
        styles[status] || styles.draft
      }`}
    >
      {status || 'draft'}
    </span>
  );
}