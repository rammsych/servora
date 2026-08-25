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

export default function NewGuidePage({ adminMode = false }) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [signature, setSignature] = useState(null);
  const [services, setServices] = useState([
    {
      id: 'service-1',
      beforeDescription: '',
      beforePhoto: null,
      beforePreview: '',
      afterDescription: '',
      afterPhoto: null,
      afterPreview: '',
      observations: '',
    },
  ]);

  const [holdingCompanies, setHoldingCompanies] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);

  const [form, setForm] = useState({
    holding_company_id: '',
    project_id: '',
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

  useEffect(() => {
    const loadHoldingCompanies = async () => {
      const { data, error } = await supabase
        .from('holding_companies')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error cargando empresas holding:', error);
        return;
      }

      setHoldingCompanies(data || []);
    };

    loadHoldingCompanies();
  }, []);

  useEffect(() => {
    const loadProjects = async () => {
      if (!form.holding_company_id) {
        setProjects([]);
        setSelectedClient(null);
        setForm((prev) => ({
          ...prev,
          project_id: '',
          customer_name: '',
          customer_rut: '',
        }));
        return;
      }

      const { data, error } = await supabase
        .from('projects')
        .select(`
        *,
        quotation_clients (
          id,
          name,
          rut,
          email,
          phone,
          address,
          contact_name
        )
      `)
        .eq('holding_company_id', form.holding_company_id)
        .eq('is_active', true)
        .order('project_name', { ascending: true });

      if (error) {
        console.error('Error cargando proyectos:', error);
        return;
      }

      setProjects(data || []);
    };

    loadProjects();
  }, [form.holding_company_id]);

  // const handleChange = (e) => {
  //   const { name, value } = e.target;

  //   setForm((prev) => ({
  //     ...prev,
  //     [name]: value,
  //   }));
  // };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'holding_company_id') {
      setForm((prev) => ({
        ...prev,
        holding_company_id: value,
        project_id: '',
        customer_name: '',
        customer_rut: '',
      }));

      setSelectedClient(null);
      return;
    }

    if (name === 'project_id') {
      const selectedProject = projects.find((project) => project.id === value);
      const client = selectedProject?.quotation_clients || null;

      setSelectedClient(client);

      setForm((prev) => ({
        ...prev,
        project_id: value,
        customer_name: client?.contact_name || client?.name || '',
        customer_rut: client?.rut || '',
      }));

      return;
    }

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

  const updateService = (serviceId, field, value) => {
    setServices((prev) =>
      prev.map((service) =>
        service.id === serviceId
          ? { ...service, [field]: value }
          : service
      )
    );
  };

  const handleServicePhoto = (serviceId, type, file) => {
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);

    setServices((prev) =>
      prev.map((service) => {
        if (service.id !== serviceId) return service;

        if (type === 'before') {
          if (service.beforePreview) {
            URL.revokeObjectURL(service.beforePreview);
          }

          return {
            ...service,
            beforePhoto: file,
            beforePreview: previewUrl,
          };
        }

        if (service.afterPreview) {
          URL.revokeObjectURL(service.afterPreview);
        }

        return {
          ...service,
          afterPhoto: file,
          afterPreview: previewUrl,
        };
      })
    );
  };

  const addService = () => {
    setServices((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        beforeDescription: '',
        beforePhoto: null,
        beforePreview: '',
        afterDescription: '',
        afterPhoto: null,
        afterPreview: '',
        observations: '',
      },
    ]);
  };

  const removeService = (serviceId) => {
    setServices((prev) => {
      if (prev.length === 1) return prev;

      const serviceToRemove = prev.find(
        (service) => service.id === serviceId
      );

      if (serviceToRemove?.beforePreview) {
        URL.revokeObjectURL(serviceToRemove.beforePreview);
      }

      if (serviceToRemove?.afterPreview) {
        URL.revokeObjectURL(serviceToRemove.afterPreview);
      }

      return prev.filter((service) => service.id !== serviceId);
    });
  };

  const uploadServicePhoto = async (guideId, serviceOrder, type, file) => {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const filePath = `${guideId}/services/${serviceOrder}-${type}-${crypto.randomUUID()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('service-guide-photos')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage
      .from('service-guide-photos')
      .getPublicUrl(filePath);

    return {
      url: publicUrlData.publicUrl,
      path: filePath,
    };
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

    if (!form.holding_company_id) {
      setMessage('Debes seleccionar una empresa del holding.');
      setLoading(false);
      return;
    }

    if (!form.project_id) {
      setMessage('Debes seleccionar un proyecto.');
      setLoading(false);
      return;
    }

    const incompleteServiceIndex = services.findIndex(
      (service) =>
        !service.beforePhoto ||
        !service.beforeDescription.trim() ||
        !service.afterPhoto ||
        !service.afterDescription.trim()
    );

    if (incompleteServiceIndex !== -1) {
      setMessage(
        `Completa la foto y descripción de Antes y Después en el Servicio ${incompleteServiceIndex + 1}.`
      );
      setLoading(false);
      return;
    }

    const location = await getLocation();

    const legacyActivityDescription = services
      .map(
        (service, index) =>
          `Servicio ${index + 1}
Trabajo a realizar: ${service.beforeDescription.trim()}
Trabajo realizado: ${service.afterDescription.trim()}`
      )
      .join('\n\n');

    const legacyObservations = services
      .map((service, index) => {
        const text = service.observations.trim();
        return text ? `Servicio ${index + 1}: ${text}` : '';
      })
      .filter(Boolean)
      .join('\n\n');

    const guidePayload = {
      operator_id: user.id,
      project_id: form.project_id || null,
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
      activity_description: legacyActivityDescription,
      component_changes: '',
      observations: legacyObservations,
      customer_name: form.customer_name,
      customer_rut: form.customer_rut,
      latitude: location.latitude,
      longitude: location.longitude,
      location_accuracy: location.location_accuracy,
      status: 'submitted',
    };

    const { data: createdGuide, error } = await supabase
      .from('service_guides')
      .insert(guidePayload)
      .select('id, guide_number')
      .single();

    if (error) {
      console.error(error);
      setMessage('Error al guardar la guía.');
      setLoading(false);
      return;
    }


    // Crear aprobaciones ISO automáticamente
    const approvalsPayload = ['JEO', 'AI', 'GP'].map((type) => ({
      guide_id: createdGuide.id,
      approval_type: type,
      status: 'pending',
    }));

    const { error: approvalsError } = await supabase
      .from('guide_approvals')
      .insert(approvalsPayload);

    if (approvalsError) {
      console.error('Error creando aprobaciones ISO:', approvalsError);
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

    const savedServices = [];

    try {
      for (let index = 0; index < services.length; index += 1) {
        const service = services[index];
        const serviceOrder = index + 1;

        const beforeImage = await uploadServicePhoto(
          createdGuide.id,
          serviceOrder,
          'before',
          service.beforePhoto
        );

        const afterImage = await uploadServicePhoto(
          createdGuide.id,
          serviceOrder,
          'after',
          service.afterPhoto
        );

        const servicePayload = {
          guide_id: createdGuide.id,
          service_order: serviceOrder,
          before_description: service.beforeDescription.trim(),
          before_photo_url: beforeImage.url,
          before_photo_path: beforeImage.path,
          after_description: service.afterDescription.trim(),
          after_photo_url: afterImage.url,
          after_photo_path: afterImage.path,
          observations: service.observations.trim() || null,
        };

        const { data: savedService, error: serviceError } = await supabase
          .from('service_guide_services')
          .insert(servicePayload)
          .select('*')
          .single();

        if (serviceError) {
          throw serviceError;
        }

        savedServices.push(savedService);

        // Compatibilidad temporal con las guías/PDF actuales.
        // Cuando migremos el PDF a service_guide_services podremos retirar este bloque.
        const { error: legacyPhotosError } = await supabase
          .from('service_guide_photos')
          .insert([
            {
              guide_id: createdGuide.id,
              photo_url: beforeImage.url,
              photo_path: beforeImage.path,
              description: `Servicio ${serviceOrder} - Antes: ${service.beforeDescription.trim()}`,
            },
            {
              guide_id: createdGuide.id,
              photo_url: afterImage.url,
              photo_path: afterImage.path,
              description: `Servicio ${serviceOrder} - Después: ${service.afterDescription.trim()}`,
            },
          ]);

        if (legacyPhotosError) {
          console.error(
            'No fue posible registrar las fotos en la estructura anterior:',
            legacyPhotosError
          );
        }
      }
    } catch (serviceSaveError) {
      console.error('Error guardando detalle del trabajo:', serviceSaveError);
      setMessage(
        'La guía fue creada, pero ocurrió un error al guardar el detalle del trabajo.'
      );
      setLoading(false);
      return;
    }

    try {
      const emailResponse = await fetch('/api/guides/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          guide: {
            id: createdGuide.id,
            guide_number: createdGuide.guide_number,
            holding_company_id: form.holding_company_id,
            ...guidePayload,
            services: savedServices,
          },
          operatorEmail: user.email,
        }),



      });

      const emailResult = await emailResponse.json();

      if (!emailResponse.ok || !emailResult.ok) {
        console.error('Error enviando correo:', emailResult);
        setMessage('Guía guardada, pero ocurrió un problema al enviar el correo.');
      } else {
        setMessage('Guía guardada y correo enviado correctamente.');
      }
    } catch (emailError) {
      console.error('Error enviando correo:', emailError);
      setMessage('Guía guardada, pero ocurrió un problema al enviar el correo.');
    }

    setLoading(false);

    setTimeout(() => {
      router.push(adminMode ? '/admin/guides' : '/guides');
    }, 1500);

  };

  return (
    <AppShell>
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="rounded-3xl border border-white/10 bg-[#0f172a] px-8 py-7 text-center shadow-2xl">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-cyan-400/30 border-t-cyan-300" />
            <p className="text-lg font-semibold text-white">
              Generando guía
            </p>
            <p className="mt-1 text-sm text-gray-400">
              Guardando datos, generando PDF y enviando correo...
            </p>
          </div>
        </div>
      )}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => router.push(adminMode ? '/admin/guides' : '/dashboard')}
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
            className={`rounded-2xl border px-4 py-3 text-sm ${message.includes('Error')
              ? 'border-red-500/30 bg-red-500/10 text-red-300'
              : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
              }`}
          >
            {message}
          </div>
        )}



        <Card>
          <SectionTitle
            title="Información de operación"
            description="Selecciona la empresa del holding y el proyecto asociado al servicio."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Empresa del holding"
              name="holding_company_id"
              value={form.holding_company_id}
              onChange={handleChange}
            >
              <option value="">Seleccionar empresa...</option>
              {holdingCompanies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name || company.company_name || company.business_name || 'Empresa sin nombre'}
                </option>
              ))}
            </Select>

            <Select
              label="Proyecto"
              name="project_id"
              value={form.project_id}
              onChange={handleChange}
            >
              <option value="">Seleccionar proyecto...</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.project_code} - {project.project_name}
                </option>
              ))}
            </Select>
          </div>
        </Card>

        <Card>
          <SectionTitle
            title="Información del cliente"
            description="Datos obtenidos automáticamente desde el proyecto seleccionado."
          />

          {selectedClient ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <InfoBox label="Cliente / Institución" value={selectedClient.name} />
              <InfoBox label="RUT" value={selectedClient.rut} />
              <InfoBox label="Contacto" value={selectedClient.contact_name} />
              <InfoBox label="Correo" value={selectedClient.email} />
              <InfoBox label="Teléfono" value={selectedClient.phone} />
              <InfoBox label="Dirección" value={selectedClient.address} />
            </div>
          ) : (
            <p className="rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-4 text-sm text-gray-400">
              Selecciona un proyecto para cargar la información del cliente.
            </p>
          )}
        </Card>

        <Card>
          <SectionTitle
            title="Información general"
            description="Fecha y horario del servicio realizado."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            title="Detalle del trabajo"
            description="Registra la evidencia antes y después de cada servicio realizado."
          />

          <div className="space-y-6">
            {services.map((service, index) => (
              <div
                key={service.id}
                className="rounded-2xl border border-white/10 bg-[#0f172a] p-5"
              >
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">
                      Detalle del trabajo
                    </p>
                    <h4 className="mt-1 text-base font-semibold text-white">
                      Servicio {index + 1}
                    </h4>
                  </div>

                  {services.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeService(service.id)}
                      className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/20"
                    >
                      Eliminar
                    </button>
                  )}
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-cyan-300">
                      Antes
                    </p>

                    <label className="block">
                      <span className="flex min-h-32 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-cyan-400/30 bg-[#020617] px-4 py-6 text-center transition hover:bg-cyan-400/5">
                        {service.beforePreview ? (
                          <img
                            src={service.beforePreview}
                            alt={`Antes servicio ${index + 1}`}
                            className="max-h-64 w-full rounded-xl object-contain"
                          />
                        ) : (
                          <>
                            <span className="mb-2 text-3xl">📷</span>
                            <span className="text-sm font-semibold text-white">
                              + Agregar foto antes
                            </span>
                            <span className="mt-1 text-xs text-gray-400">
                              Cámara o galería del dispositivo
                            </span>
                          </>
                        )}
                      </span>

                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          handleServicePhoto(
                            service.id,
                            'before',
                            e.target.files?.[0]
                          );
                          e.target.value = '';
                        }}
                      />
                    </label>

                    <label className="mt-4 block">
                      <span className="mb-2 block text-sm font-medium text-gray-300">
                        Breve descripción del trabajo a realizar
                      </span>
                      <textarea
                        rows={4}
                        required
                        value={service.beforeDescription}
                        onChange={(e) =>
                          updateService(
                            service.id,
                            'beforeDescription',
                            e.target.value
                          )
                        }
                        placeholder="Describe brevemente el trabajo que se realizará..."
                        className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-white outline-none placeholder:text-gray-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
                      />
                    </label>
                  </div>

                  <div className="border-t border-white/10" />

                  <div>
                    <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-emerald-300">
                      Después
                    </p>

                    <label className="block">
                      <span className="flex min-h-32 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-400/30 bg-[#020617] px-4 py-6 text-center transition hover:bg-emerald-400/5">
                        {service.afterPreview ? (
                          <img
                            src={service.afterPreview}
                            alt={`Después servicio ${index + 1}`}
                            className="max-h-64 w-full rounded-xl object-contain"
                          />
                        ) : (
                          <>
                            <span className="mb-2 text-3xl">📷</span>
                            <span className="text-sm font-semibold text-white">
                              + Agregar foto después
                            </span>
                            <span className="mt-1 text-xs text-gray-400">
                              Cámara o galería del dispositivo
                            </span>
                          </>
                        )}
                      </span>

                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          handleServicePhoto(
                            service.id,
                            'after',
                            e.target.files?.[0]
                          );
                          e.target.value = '';
                        }}
                      />
                    </label>

                    <label className="mt-4 block">
                      <span className="mb-2 block text-sm font-medium text-gray-300">
                        Detalle del trabajo realizado
                      </span>
                      <textarea
                        rows={4}
                        required
                        value={service.afterDescription}
                        onChange={(e) =>
                          updateService(
                            service.id,
                            'afterDescription',
                            e.target.value
                          )
                        }
                        placeholder="Describe detalladamente el trabajo realizado..."
                        className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-white outline-none placeholder:text-gray-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
                      />
                    </label>
                  </div>

                  <div className="border-t border-white/10" />

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-gray-300">
                      Observaciones
                    </span>
                    <textarea
                      rows={4}
                      value={service.observations}
                      onChange={(e) =>
                        updateService(
                          service.id,
                          'observations',
                          e.target.value
                        )
                      }
                      placeholder="Observaciones adicionales del servicio..."
                      className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-white outline-none placeholder:text-gray-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
                    />
                  </label>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addService}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-cyan-400/40 bg-cyan-400/5 px-5 py-4 text-sm font-semibold text-cyan-300 transition hover:border-cyan-300 hover:bg-cyan-400/10 hover:text-white"
            >
              <span className="text-xl">+</span>
              Agregar otro servicio
            </button>
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
              onClick={() => router.push(adminMode ? '/admin/guides' : '/dashboard')}
              className="w-full sm:w-auto"
            >
              Cancelar
            </ButtonSecondary>

            <ButtonPrimary
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Guardando y enviando...
                </span>
              ) : (
                'Guardar guía'
              )}
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


function InfoBox({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0f172a] px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-white">
        {value || '-'}
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

