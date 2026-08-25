'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/libs/supabaseClient';
import AppShell from '@/components/AppShell';
import { Card, ButtonSecondary } from '@/components/ui';

export default function GuideDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const searchParams = useSearchParams();
  const backUrl = searchParams.get('back') || '/guides';

  const [guide, setGuide] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadGuide = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('service_guides')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error cargando guía:', error);
      setGuide(null);
      setServices([]);
      setLoading(false);
      return;
    }

    setGuide(data);

    const { data: servicesData, error: servicesError } = await supabase
      .from('service_guide_services')
      .select('*')
      .eq('guide_id', id)
      .order('service_order', { ascending: true });

    if (servicesError) {
      console.error('Error cargando detalle del trabajo:', servicesError);
      setServices([]);
    } else {
      setServices(servicesData || []);
    }

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
          type="button"
          onClick={() => router.push(backUrl || '/admin/guides')}
          className="mb-6 inline-flex items-center gap-3 rounded-2xl border border-cyan-400/30 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 px-6 py-3 text-sm font-bold tracking-wide text-cyan-200 shadow-xl shadow-cyan-500/10 backdrop-blur-sm transition-all hover:scale-[1.02] hover:border-cyan-300 hover:text-white"
        >
          <span className="text-xl">←</span>
          Volver al Dashboard Admin
        </button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
          <SectionTitle title="Detalle del trabajo" />

          {services.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-5">
              <p className="text-sm text-gray-400">
                Esta guía no tiene servicios registrados en la nueva estructura.
              </p>

              {guide.activity_description && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Actividad registrada anteriormente
                  </p>
                  <Text value={guide.activity_description} />
                </div>
              )}

              {guide.observations && (
                <div className="mt-4 border-t border-white/10 pt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Observaciones
                  </p>
                  <Text value={guide.observations} />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {services.map((service, index) => (
                <div
                  key={service.id}
                  className="rounded-2xl border border-white/10 bg-[#0f172a] p-5"
                >
                  <div className="mb-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">
                      Detalle del trabajo
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-white">
                      Servicio {service.service_order || index + 1}
                    </h3>
                  </div>

                  <div className="space-y-6">
                    <section>
                      <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-cyan-300">
                        Antes
                      </p>

                      <ServicePhoto
                        url={service.before_photo_url}
                        alt={`Antes servicio ${service.service_order || index + 1}`}
                      />

                      <div className="mt-4">
                        <p className="mb-2 text-sm font-medium text-gray-300">
                          Breve descripción del trabajo a realizar
                        </p>
                        <TextBlock value={service.before_description} />
                      </div>
                    </section>

                    <div className="border-t border-white/10" />

                    <section>
                      <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-emerald-300">
                        Después
                      </p>

                      <ServicePhoto
                        url={service.after_photo_url}
                        alt={`Después servicio ${service.service_order || index + 1}`}
                      />

                      <div className="mt-4">
                        <p className="mb-2 text-sm font-medium text-gray-300">
                          Detalle del trabajo realizado
                        </p>
                        <TextBlock value={service.after_description} />
                      </div>
                    </section>

                    <div className="border-t border-white/10" />

                    <section>
                      <p className="mb-2 text-sm font-medium text-gray-300">
                        Observaciones
                      </p>
                      <TextBlock value={service.observations} />
                    </section>
                  </div>
                </div>
              ))}
            </div>
          )}
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
              rel="noreferrer"
              className="mt-4 inline-block text-sm text-cyan-300 hover:underline"
            >
              Ver en Google Maps
            </a>
          )}
        </Card>

        <div className="flex justify-end">
          <ButtonSecondary onClick={() => router.push(backUrl)}>
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
    <h2 className="mb-4 text-lg font-semibold text-white">
      {title}
    </h2>
  );
}

function Grid({ children }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {children}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-gray-200">
        {value || '-'}
      </p>
    </div>
  );
}

function Text({ value }) {
  return (
    <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
      {value || '-'}
    </p>
  );
}

function TextBlock({ value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#020617] px-4 py-3">
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
        {value || '-'}
      </p>
    </div>
  );
}

function ServicePhoto({ url, alt }) {
  if (!url) {
    return (
      <div className="flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#020617] px-4 py-6 text-center">
        <p className="text-sm text-gray-500">Sin fotografía registrada.</p>
      </div>
    );
  }

  return (
    <a href={url} target="_blank" rel="noreferrer" className="block">
      <img
        src={url}
        alt={alt}
        className="max-h-[420px] w-full rounded-2xl border border-white/10 bg-[#020617] object-contain"
      />
    </a>
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
      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
        styles[status] || styles.draft
      }`}
    >
      {status || 'draft'}
    </span>
  );
}
