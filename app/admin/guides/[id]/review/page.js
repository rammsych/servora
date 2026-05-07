'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminShell from '@/components/AdminShell';
import { supabase } from '@/libs/supabaseClient';
import { Card, ButtonPrimary, ButtonSecondary, Input } from '@/components/ui';

export default function ReviewGuidePage() {
  const { id } = useParams();
  const router = useRouter();

  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadGuide = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('service_guides')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(error);
      setGuide(null);
    } else {

      if (data.status === 'approved') {
        alert('La guía ya fue aprobada y no puede editarse.');
        router.push('/admin/guides');
        return;
      }

      setGuide(data);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (id) loadGuide();
  }, [id]);

  const handleChange = (field, value) => {
    setGuide((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveGuide = async () => {

    if (guide.status === 'approved') {
      alert('La guía aprobada no puede modificarse.');
      return;
    }

    setSaving(true);

    const payload = {
        service_date: guide.service_date || null,
        start_time: guide.start_time || null,
        end_time: guide.end_time || null,
        customer_name: guide.customer_name || null,
        customer_rut: guide.customer_rut || null,
        maintenance_type: guide.maintenance_type || null,
        activity_type: guide.activity_type || null,
        installation_type: guide.installation_type || null,
        equipment_serial: guide.equipment_serial || null,
        equipment_model: guide.equipment_model || null,
        equipment_brand: guide.equipment_brand || null,
        equipment_color: guide.equipment_color || null,
        electrical_voltage: guide.electrical_voltage || null,
        electrical_pressure: guide.electrical_pressure || null,
        activity_description: guide.activity_description || null,
        component_changes: guide.component_changes || null,
        observations: guide.observations || null,
        updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('service_guides')
      .update(payload)
      .eq('id', id);

    if (error) {
      console.error(error);
      alert('No se pudo guardar la guía.');
    } else {
      router.push('/admin/guides');
    }

    setSaving(false);
  };

  return (
    <AdminShell>
      <div className="mb-6">
        <p className="text-sm text-gray-400">SERVORA / Back Office</p>
        <h1 className="mt-1 text-3xl font-bold text-white">
          Editar guía
        </h1>
      </div>

      {loading && (
        <Card>
          <p className="text-sm text-gray-400">Cargando guía...</p>
        </Card>
      )}

      {!loading && !guide && (
        <Card>
          <p className="text-sm text-red-300">No se encontró la guía.</p>
        </Card>
      )}

      {!loading && guide && (
        <Card>
          <div className="mb-5">
            <p className="text-sm text-gray-400">
              Folio
            </p>
            <p className="text-xl font-bold text-white">
              N° {guide.guide_number || 'Sin número'}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Fecha" type="date" value={guide.service_date} onChange={(v) => handleChange('service_date', v)} />
            <Field label="Hora inicio" type="time" value={guide.start_time} onChange={(v) => handleChange('start_time', v)} />
            <Field label="Hora término" type="time" value={guide.end_time} onChange={(v) => handleChange('end_time', v)} />
            <Field label="Cliente" value={guide.customer_name} onChange={(v) => handleChange('customer_name', v)} />
            <Field label="Institución" value={guide.institution_name} onChange={(v) => handleChange('institution_name', v)} />
            <Field label="Tipo mantención" value={guide.maintenance_type} onChange={(v) => handleChange('maintenance_type', v)} />
            <Field label="Tipo actividad" value={guide.activity_type} onChange={(v) => handleChange('activity_type', v)} />
            <Field label="Tipo instalación" value={guide.installation_type} onChange={(v) => handleChange('installation_type', v)} />
            <Field label="Serie equipo" value={guide.equipment_serial} onChange={(v) => handleChange('equipment_serial', v)} />
            <Field label="Modelo equipo" value={guide.equipment_model} onChange={(v) => handleChange('equipment_model', v)} />
            <Field label="Marca equipo" value={guide.equipment_brand} onChange={(v) => handleChange('equipment_brand', v)} />
            <Field label="Color equipo" value={guide.equipment_color} onChange={(v) => handleChange('equipment_color', v)} />
            <Field label="Voltaje" value={guide.electrical_voltage} onChange={(v) => handleChange('electrical_voltage', v)} />
            <Field label="Presión" value={guide.electrical_pressure} onChange={(v) => handleChange('electrical_pressure', v)} />
          </div>

          <div className="mt-4">
            <TextArea
            label="Descripción de actividad"
            value={guide.activity_description}
            onChange={(v) => handleChange('activity_description', v)}
            />
          </div>
          <div className="mt-4">
            <TextArea
                label="Cambios de componentes"
                value={guide.component_changes}
                onChange={(v) => handleChange('component_changes', v)}
            />
          </div>

          <div className="mt-4">
            <TextArea label="Observaciones" value={guide.observations} onChange={(v) => handleChange('observations', v)} />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <ButtonSecondary type="button" onClick={() => router.push('/admin/guides')}>
              Cancelar
            </ButtonSecondary>

            <ButtonPrimary type="button" disabled={saving} onClick={saveGuide}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </ButtonPrimary>
          </div>
        </Card>
      )}
    </AdminShell>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-gray-400">
        {label}
      </p>
      <Input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function TextArea({ label, value, onChange }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-gray-400">
        {label}
      </p>
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-28 w-full rounded-xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}