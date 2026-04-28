'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/libs/supabaseClient';
import SignaturePad from '@/components/SignaturePad';
import AppShell from '@/components/AppShell';
import { Card, ButtonPrimary, ButtonSecondary } from '@/components/ui';

const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().slice(0, 10);
};

const getCurrentTime = () => {
  const now = new Date();
  return now.toTimeString().slice(0, 5);
};

export default function NewGuidePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [photos, setPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [signature, setSignature] = useState(null);

  const [form, setForm] = useState({
    institution_name: '',
    service_date: getTodayDate(),
    start_time: getCurrentTime(),
    end_time: getCurrentTime(),
    maintenance_type: 'preventive',
    activity_type: '',
    installation_type: '',
    equipment_serial: '',
    equipment_model: '',
    equipment_brand: '',
    equipment_color: '',
    electrical_voltage: '',
    electrical_pressure: '',
    activity_description: '',
    component_changes: '',
    observations: '',
    customer_name: '',
    customer_rut: '',
  });

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      service_date: getTodayDate(),
      start_time: getCurrentTime(),
      end_time: getCurrentTime(),
    }));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const getLocation = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({
          latitude: null,
          longitude: null,
          location_accuracy: null,
        });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            location_accuracy: position.coords.accuracy,
          });
        },
        () => {
          resolve({
            latitude: null,
            longitude: null,
            location_accuracy: null,
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
        }
      );
    });
  };

  const handlePhotoChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);

    const newPhotos = selectedFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setPhotos((prev) => [...prev, ...newPhotos]);
    setPhotoPreviews((prev) => [...prev, ...newPhotos]);

    e.target.value = '';
  };

  const removePhoto = (photoId) => {
    setPhotos((prev) => prev.filter((photo) => photo.id !== photoId));
    setPhotoPreviews((prev) => prev.filter((photo) => photo.id !== photoId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    const location = await getLocation();

    const { data: createdGuide, error } = await supabase
      .from('service_guides')
      .insert({
        operator_id: user.id,
        service_date: form.service_date || new Date().toISOString().slice(0, 10),
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        maintenance_type: form.maintenance_type,
        activity_type: form.activity_type,
        installation_type: form.installation_type,
        equipment_serial: form.equipment_serial,
        equipment_model: form.equipment_model,
        equipment_brand: form.equipment_brand,
        equipment_color: form.equipment_color,
        electrical_voltage: form.electrical_voltage,
        electrical_pressure: form.electrical_pressure,
        activity_description: form.activity_description,
        component_changes: form.component_changes,
        observations: form.observations,
        customer_name: form.customer_name,
        customer_rut: form.customer_rut,
        latitude: location.latitude,
        longitude: location.longitude,
        location_accuracy: location.location_accuracy,
        status: 'draft',
      })
      .select('id')
      .single();

    if (error) {
      console.error(error);
      setMessage('Error al guardar la guía.');
      setLoading(false);
      return;
    }

    if (signature) {
      const blob = await (await fetch(signature)).blob();
      const filePath = `${createdGuide.id}/signature.png`;

      const { error: uploadError } = await supabase.storage
        .from('service-guide-signatures')
        .upload(filePath, blob, {
          contentType: 'image/png',
        });

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage
          .from('service-guide-signatures')
          .getPublicUrl(filePath);

        await supabase
          .from('service_guides')
          .update({
            customer_signature_url: publicUrlData.publicUrl,
          })
          .eq('id', createdGuide.id);
      }
    }

    for (const photo of photos) {
      const file = photo.file;
      const fileExt = file.name.split('.').pop();
      const filePath = `${createdGuide.id}/${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('service-guide-photos')
        .upload(filePath, file);

      if (uploadError) {
        console.error(uploadError);
        continue;
      }

      const { data: publicUrlData } = supabase.storage
        .from('service-guide-photos')
        .getPublicUrl(filePath);

      await supabase.from('service_guide_photos').insert({
        guide_id: createdGuide.id,
        photo_url: publicUrlData.publicUrl,
        photo_path: filePath,
      });
    }

    setMessage('Guía guardada correctamente.');
    setLoading(false);

    setTimeout(() => {
      router.push('/guides');
    }, 1000);
  };

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

        <p className="text-sm text-gray-400">SERVORA / Nueva guía</p>

        <h2 className="text-2xl font-bold text-white mt-1">
          Crear guía de servicio
        </h2>

        <p className="text-sm text-gray-400 mt-2">
          Registra los datos del servicio realizado, adjunta evidencias y firma del cliente.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 pb-28">
        {message && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              message.includes('Error')
                ? 'border-red-500/30 bg-red-500/10 text-red-300'
                : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
            }`}
          >
            {message}
          </div>
        )}

        <Card>
          <SectionTitle
            title="Información general"
            description="Datos principales del servicio."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Institución"
              name="institution_name"
              value={form.institution_name}
              onChange={handleChange}
            />

            <Input
              label="Fecha"
              name="service_date"
              type="date"
              value={form.service_date}
              onChange={handleChange}
            />

            <Input
              label="Hora ingreso"
              name="start_time"
              type="time"
              value={form.start_time}
              onChange={handleChange}
            />

            <Input
              label="Hora término"
              name="end_time"
              type="time"
              value={form.end_time}
              onChange={handleChange}
            />
          </div>
        </Card>

        <Card>
          <SectionTitle
            title="Tipo de servicio"
            description="Clasificación y contexto del mantenimiento."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Tipo de mantenimiento"
              name="maintenance_type"
              value={form.maintenance_type}
              onChange={handleChange}
            >
              <option value="preventive">Preventiva</option>
              <option value="corrective">Correctiva</option>
              <option value="emergency">Emergencia</option>
            </Select>

            <Input
              label="Tipo de actividad"
              name="activity_type"
              value={form.activity_type}
              onChange={handleChange}
            />

            <Input
              label="Instalación"
              name="installation_type"
              value={form.installation_type}
              onChange={handleChange}
            />
          </div>
        </Card>

        <Card>
          <SectionTitle
            title="Equipo intervenido"
            description="Información técnica del equipo o sistema."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Número de serie"
              name="equipment_serial"
              value={form.equipment_serial}
              onChange={handleChange}
            />

            <Input
              label="Modelo"
              name="equipment_model"
              value={form.equipment_model}
              onChange={handleChange}
            />

            <Input
              label="Marca"
              name="equipment_brand"
              value={form.equipment_brand}
              onChange={handleChange}
            />

            <Input
              label="Color"
              name="equipment_color"
              value={form.equipment_color}
              onChange={handleChange}
            />

            <Input
              label="Voltaje"
              name="electrical_voltage"
              value={form.electrical_voltage}
              onChange={handleChange}
            />

            <Input
              label="Presión / parámetro"
              name="electrical_pressure"
              value={form.electrical_pressure}
              onChange={handleChange}
            />
          </div>
        </Card>

        <Card>
          <SectionTitle
            title="Detalle del trabajo"
            description="Describe lo realizado y observaciones importantes."
          />

          <div className="space-y-4">
            <Textarea
              label="Actividad realizada"
              name="activity_description"
              value={form.activity_description}
              onChange={handleChange}
            />

            <Textarea
              label="Cambio de componentes"
              name="component_changes"
              value={form.component_changes}
              onChange={handleChange}
            />

            <Textarea
              label="Observaciones"
              name="observations"
              value={form.observations}
              onChange={handleChange}
            />
          </div>
        </Card>

        <Card>
          <SectionTitle
            title="Datos del cliente"
            description="Persona que recibe o valida el servicio."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre cliente"
              name="customer_name"
              value={form.customer_name}
              onChange={handleChange}
            />

            <Input
              label="RUT cliente"
              name="customer_rut"
              value={form.customer_rut}
              onChange={handleChange}
            />
          </div>
        </Card>

        <Card>
          <SectionTitle
            title="Fotos del servicio"
            description="Puedes tomar una foto con la cámara o adjuntar imágenes desde el celular."
          />

          <label className="block">
            <span className="flex min-h-28 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-cyan-400/30 bg-[#0f172a] px-4 py-6 text-center hover:bg-cyan-400/5">
              <span className="text-3xl mb-2">📷</span>
              <span className="text-sm font-semibold text-white">
                + Agregar foto
              </span>
              <span className="text-xs text-gray-400 mt-1">
                Cámara o galería del dispositivo
              </span>
            </span>

            <input
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={handlePhotoChange}
              className="hidden"
            />
          </label>

          {photoPreviews.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              {photoPreviews.map((photo) => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.previewUrl}
                    alt="Foto del servicio"
                    className="w-full h-32 object-cover rounded-2xl border border-white/10"
                  />

                  <button
                    type="button"
                    onClick={() => removePhoto(photo.id)}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-8 h-8 font-bold shadow-lg hover:bg-red-500"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle
            title="Firma del cliente"
            description="La firma es opcional. Puedes guardarla si aplica para el servicio."
          />

          <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-3">
            <SignaturePad onSave={(dataUrl) => setSignature(dataUrl)} />
          </div>

          {signature && (
            <p className="mt-3 text-sm text-cyan-300">
              Firma guardada correctamente en el formulario.
            </p>
          )}
        </Card>

        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-[#0a0f1c]/90 px-5 py-4 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:justify-end">
            <ButtonSecondary
              type="button"
              onClick={() => router.push('/dashboard')}
              className="w-full sm:w-auto"
            >
              Cancelar
            </ButtonSecondary>

            <ButtonPrimary
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Guardando...' : 'Guardar guía'}
            </ButtonPrimary>
          </div>
        </div>
      </form>
    </AppShell>
  );
}

function SectionTitle({ title, description }) {
  return (
    <div className="mb-5">
      <h3 className="text-lg font-semibold text-white">
        {title}
      </h3>
      <p className="text-sm text-gray-400 mt-1">
        {description}
      </p>
    </div>
  );
}

function Input({ label, name, value, onChange, type = 'text' }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-300 mb-2">
        {label}
      </span>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none placeholder:text-gray-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
      />
    </label>
  );
}

function Select({ label, name, value, onChange, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-300 mb-2">
        {label}
      </span>

      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
      >
        {children}
      </select>
    </label>
  );
}

function Textarea({ label, name, value, onChange }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-300 mb-2">
        {label}
      </span>

      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={4}
        className="w-full rounded-xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none placeholder:text-gray-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
      />
    </label>
  );
}