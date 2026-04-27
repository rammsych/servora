'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/libs/supabaseClient';
import PhotoUploader from '@/components/PhotoUploader';

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

    setLoading(false);

    const { data: photosData, error: photosError } = await supabase
      .from('service_guide_photos')
      .select('*')
      .eq('guide_id', id)
      .order('created_at', { ascending: true });

    if (!photosError) {
      setPhotos(photosData || []);
}






  };

  useEffect(() => {
    if (id) loadGuide();
  }, [id]);

  if (loading) {
    return <main className="p-5">Cargando guía...</main>;
  }

  if (!guide) {
    return <main className="p-5">No se encontró la guía.</main>;
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="bg-slate-950 text-white px-5 py-4">
        <button
          onClick={() => router.push('/guides')}
          className="text-sm text-slate-300 mb-2"
        >
          ← Volver
        </button>

        <h1 className="text-xl font-bold">
          Guía N° {guide.guide_number}
        </h1>
        <p className="text-xs text-slate-300">
          Detalle de guía de servicio
        </p>
      </header>

      <section className="p-5 space-y-4">
        <Card title="Información general">
          <Row label="Fecha" value={guide.service_date} />
          <Row label="Hora ingreso" value={guide.start_time} />
          <Row label="Hora término" value={guide.end_time} />
          <Row label="Estado" value={guide.status} />
          <Row label="Tipo mantenimiento" value={guide.maintenance_type} />
          <Row label="Tipo actividad" value={guide.activity_type} />
          <Row label="Instalación" value={guide.installation_type} />
        </Card>

        <Card title="Equipo intervenido">
          <Row label="N° serie" value={guide.equipment_serial} />
          <Row label="Modelo" value={guide.equipment_model} />
          <Row label="Marca" value={guide.equipment_brand} />
          <Row label="Color" value={guide.equipment_color} />
        </Card>

        <Card title="Parámetros">
          <Row label="Voltaje" value={guide.electrical_voltage} />
          <Row label="Presión / parámetro" value={guide.electrical_pressure} />
        </Card>

        <Card title="Actividad realizada">
          <Text value={guide.activity_description} />
        </Card>

        <Card title="Cambio de componentes">
          <Text value={guide.component_changes} />
        </Card>

        <Card title="Observaciones">
          <Text value={guide.observations} />
        </Card>

        <Card title="Cliente">
          <Row label="Nombre" value={guide.customer_name} />
          <Row label="RUT" value={guide.customer_rut} />
        </Card>

        <Card title="Ubicación registrada">
          <Row label="Latitud" value={guide.latitude} />
          <Row label="Longitud" value={guide.longitude} />
          <Row label="Precisión" value={guide.location_accuracy ? `${guide.location_accuracy} m` : '-'} />

          {guide.latitude && guide.longitude && (
            <a
              href={`https://www.google.com/maps?q=${guide.latitude},${guide.longitude}`}
              target="_blank"
              className="block mt-3 text-blue-600 font-semibold"
            >
              Ver ubicación en Google Maps
            </a>
          )}
        </Card>
        <PhotoUploader guideId={guide.id} onUploaded={loadGuide} />
      </section>
      <Card title="Fotos del servicio">
        {photos.length === 0 ? (
          <p className="text-sm text-slate-500">No hay fotos registradas.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {photos.map((photo) => (
              <a
                key={photo.id}
                href={photo.photo_url}
                target="_blank"
                rel="noreferrer"
              >
                <img
                  src={photo.photo_url}
                  alt="Foto del servicio"
                  className="w-full h-32 object-cover rounded-xl border"
                />
              </a>
            ))}
          </div>
        )}
      </Card>
    </main>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900 mb-4">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 text-sm border-b border-slate-100 pb-2">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800 text-right">{value || '-'}</span>
    </div>
  );
}

function Text({ value }) {
  return <p className="text-sm text-slate-700 whitespace-pre-wrap">{value || '-'}</p>;
}