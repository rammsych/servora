'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  Building2,
  Users,
  FolderKanban,
  CalendarDays,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
} from 'lucide-react';
import { supabase } from '@/libs/supabaseClient';

const emptyForm = {
  project_name: '',
  project_code: '',
  description: '',
  holding_company_id: '',
  client_id: '',
  service_type: '',
  project_type: '',
  contract_number: '',
  purchase_order: '',
  start_date: '',
  end_date: '',
  status: 'active',
  location: '',
  commune: '',
  region: '',
  project_manager: '',
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  estimated_budget: '',
  currency: 'CLP',
  notes: '',
  is_active: true,
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [clients, setClients] = useState([]);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [error, setError] = useState('');
  const [openClientModal, setOpenClientModal] = useState(false);
  const [savingClient, setSavingClient] = useState(false);

  const [clientForm, setClientForm] = useState({
    name: '',
    rut: '',
    email: '',
    phone: '',
    address: '',
    contact_name: '',
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    setError('');

    try {
      const [projectsRes, companiesRes, clientsRes] = await Promise.all([
        supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false }),

        supabase
          .from('holding_companies')
          .select('*'),

        supabase
          .from('quotation_clients')
          .select('*'),
      ]);

      if (projectsRes.error) throw projectsRes.error;
      if (companiesRes.error) throw companiesRes.error;
      if (clientsRes.error) throw clientsRes.error;

      setProjects(projectsRes.data || []);
      setCompanies(companiesRes.data || []);
      setClients(clientsRes.data || []);
    } catch (err) {
      console.error('ERROR PROYECTOS:', err);
      setError(err.message || 'No se pudieron cargar los proyectos.');
    } finally {
      setLoading(false);
    }
  };

  const getCompanyName = (companyId) => {
    const company = companies.find((item) => item.id === companyId);

    return (
      company?.company_name ||
      company?.business_name ||
      company?.razon_social ||
      company?.fantasy_name ||
      company?.name ||
      company?.rut ||
      'Sin empresa'
    );
  };

  const getClientName = (clientId) => {
    const client = clients.find((item) => item.id === clientId);

    return (
      client?.client_name ||
      client?.business_name ||
      client?.razon_social ||
      client?.fantasy_name ||
      client?.name ||
      client?.rut ||
      'Sin cliente'
    );
  };

  const getStatusLabel = (status) => {
    const labels = {
      active: 'Activo',
      inactive: 'Inactivo',
      pending: 'Pendiente',
      completed: 'Finalizado',
    };

    return labels[status] || 'Activo';
  };

  const filteredProjects = useMemo(() => {
    const term = search.toLowerCase().trim();

    if (!term) return projects;

    return projects.filter((project) => {
      const companyName = getCompanyName(project.holding_company_id);
      const clientName = getClientName(project.client_id);

      return [
        project.project_name,
        project.project_code,
        project.service_type,
        project.project_type,
        project.contract_number,
        project.purchase_order,
        project.status,
        project.description,
        project.location,
        project.commune,
        project.region,
        project.project_manager,
        project.contact_name,
        project.contact_email,
        companyName,
        clientName,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [projects, search, companies, clients]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const openCreateModal = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError('');
    setOpenModal(true);
  };

  const openEditModal = (project) => {
    setForm({
      project_name: project.project_name || '',
      project_code: project.project_code || '',
      description: project.description || '',
      holding_company_id: project.holding_company_id || '',
      client_id: project.client_id || '',
      service_type: project.service_type || '',
      project_type: project.project_type || '',
      contract_number: project.contract_number || '',
      purchase_order: project.purchase_order || '',
      start_date: project.start_date || '',
      end_date: project.end_date || '',
      status: project.status || 'active',
      location: project.location || '',
      commune: project.commune || '',
      region: project.region || '',
      project_manager: project.project_manager || '',
      contact_name: project.contact_name || '',
      contact_email: project.contact_email || '',
      contact_phone: project.contact_phone || '',
      estimated_budget: project.estimated_budget || '',
      currency: project.currency || 'CLP',
      notes: project.notes || '',
      is_active: project.is_active ?? true,
    });

    setEditingId(project.id);
    setError('');
    setOpenModal(true);
  };

  const closeModal = () => {
    setOpenModal(false);
    setEditingId(null);
    setForm(emptyForm);
    setError('');
  };

  const validateForm = () => {
    if (!form.project_name.trim()) return 'El nombre del proyecto es obligatorio.';
    if (!form.project_code.trim()) return 'El código del proyecto es obligatorio.';
    if (!form.holding_company_id) return 'Debes seleccionar una empresa holding.';
    if (!form.client_id) return 'Debes seleccionar un cliente.';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      project_name: form.project_name.trim(),
      project_code: form.project_code.trim(),
      description: form.description.trim() || null,
      holding_company_id: form.holding_company_id,
      client_id: form.client_id,
      service_type: form.service_type.trim() || null,
      project_type: form.project_type.trim() || null,
      contract_number: form.contract_number.trim() || null,
      purchase_order: form.purchase_order.trim() || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      status: form.status,
      location: form.location.trim() || null,
      commune: form.commune.trim() || null,
      region: form.region.trim() || null,
      project_manager: form.project_manager.trim() || null,
      contact_name: form.contact_name.trim() || null,
      contact_email: form.contact_email.trim() || null,
      contact_phone: form.contact_phone.trim() || null,
      estimated_budget: form.estimated_budget ? Number(form.estimated_budget) : null,
      currency: form.currency.trim() || 'CLP',
      notes: form.notes.trim() || null,
      is_active: form.is_active,
      updated_at: new Date().toISOString(),
    };

    try {
      const response = editingId
        ? await supabase.from('projects').update(payload).eq('id', editingId)
        : await supabase.from('projects').insert(payload);

      if (response.error) throw response.error;

      await loadInitialData();
      closeModal();
    } catch (err) {
      console.error('ERROR GUARDANDO PROYECTO:', err);
      setError(err.message || 'No se pudo guardar el proyecto.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (projectId) => {
    const confirmed = window.confirm('¿Seguro que deseas eliminar este proyecto?');

    if (!confirmed) return;

    try {
      const { error: deleteError } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (deleteError) throw deleteError;

      await loadInitialData();
    } catch (err) {
      console.error('ERROR ELIMINANDO PROYECTO:', err);
      setError(err.message || 'No se pudo eliminar el proyecto.');
    }
  };




  const openCreateClientModal = () => {
    setClientForm({
      name: '',
      rut: '',
      email: '',
      phone: '',
      address: '',
      contact_name: '',
    });

    setError('');
    setOpenClientModal(true);
  };

  const closeClientModal = () => {
    setOpenClientModal(false);
    setClientForm({
      name: '',
      rut: '',
      email: '',
      phone: '',
      address: '',
      contact_name: '',
    });
  };

  const handleClientChange = (e) => {
    const { name, value } = e.target;

    setClientForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();

    if (!clientForm.name.trim()) {
      setError('El nombre del cliente es obligatorio.');
      return;
    }

    setSavingClient(true);
    setError('');

    try {
      const payload = {
        name: clientForm.name.trim(),
        rut: clientForm.rut.trim() || null,
        email: clientForm.email.trim() || null,
        phone: clientForm.phone.trim() || null,
        address: clientForm.address.trim() || null,
        contact_name: clientForm.contact_name.trim() || null,
        is_active: true,
      };

      const { data, error: insertError } = await supabase
        .from('quotation_clients')
        .insert(payload)
        .select('*')
        .single();

      if (insertError) throw insertError;

      const { data: refreshedClients, error: clientsError } = await supabase
        .from('quotation_clients')
        .select('*');

      if (clientsError) throw clientsError;

      setClients(refreshedClients || []);

      setForm((prev) => ({
        ...prev,
        client_id: data.id,
      }));

      closeClientModal();
    } catch (err) {
      console.error('ERROR CREANDO CLIENTE:', err);
      setError(err.message || 'No se pudo crear el cliente.');
    } finally {
      setSavingClient(false);
    }
  };






  return (
    <div className="space-y-6 text-white">
      <div className="rounded-3xl border border-slate-700 bg-slate-900/70 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-950 text-cyan-300">
              <FolderKanban size={23} />
            </div>

            <div>
              <h1 className="text-xl font-bold text-white">Proyectos</h1>
              <p className="text-sm text-slate-400">
                Administración de proyectos asociados a empresas holding y clientes.
              </p>
            </div>
          </div>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-cyan-300"
          >
            <Plus size={18} />
            Agregar proyecto
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por proyecto, cliente, empresa, código..."
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
            />
          </div>

          <div className="text-sm text-slate-400">
            Total: <span className="font-semibold text-white">{filteredProjects.length}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="rounded-3xl border border-slate-700 bg-slate-900/70 p-5 shadow-sm">
        <h2 className="mb-5 text-lg font-bold text-white">
          Proyectos registrados
        </h2>

        {loading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 text-sm text-slate-400">
            Cargando proyectos...
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 text-sm text-slate-400">
            No hay proyectos registrados.
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead className="bg-slate-950/60 text-xs uppercase tracking-[0.25em] text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Proyecto</th>
                    <th className="px-5 py-4">Empresa</th>
                    <th className="px-5 py-4">Cliente</th>
                    <th className="px-5 py-4">Tipo</th>
                    <th className="px-5 py-4">Ubicación</th>
                    <th className="px-5 py-4">Estado</th>
                    <th className="px-5 py-4 text-right">Acciones</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-700">
                  {filteredProjects.map((project) => (
                    <tr key={project.id} className="transition hover:bg-slate-800/50">
                      <td className="px-5 py-4">
                        <div className="font-bold text-white">
                          {project.project_name}
                        </div>
                        <div className="text-xs text-slate-400">
                          {project.project_code}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-slate-300">
                        {getCompanyName(project.holding_company_id)}
                      </td>

                      <td className="px-5 py-4 text-slate-300">
                        {getClientName(project.client_id)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-slate-300">
                          {project.project_type || '-'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {project.service_type || '-'}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-slate-300">
                        {project.commune || project.location || '-'}
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-emerald-950 px-3 py-1 text-xs font-bold text-emerald-300">
                          {getStatusLabel(project.status)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditModal(project)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300"
                            title="Editar"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            onClick={() => handleDelete(project.id)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-500/40 text-red-300 transition hover:bg-red-950/40"
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 md:hidden">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="rounded-3xl border border-slate-700 bg-slate-950/60 p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-950 text-cyan-300">
                        <FolderKanban size={18} />
                      </div>

                      <div>
                        <h3 className="font-bold text-white">
                          {project.project_name}
                        </h3>
                        <p className="text-xs text-slate-400">
                          {project.project_code}
                        </p>
                      </div>
                    </div>

                    <span className="rounded-full bg-emerald-950 px-3 py-1 text-xs font-bold text-emerald-300">
                      {getStatusLabel(project.status)}
                    </span>
                  </div>

                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Building2 size={16} className="text-slate-500" />
                      <span>{getCompanyName(project.holding_company_id)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-300">
                      <Users size={16} className="text-slate-500" />
                      <span>{getClientName(project.client_id)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-300">
                      <MapPin size={16} className="text-slate-500" />
                      <span>{project.commune || project.location || 'Sin ubicación'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-300">
                      <CalendarDays size={16} className="text-slate-500" />
                      <span>
                        {project.start_date || 'Sin inicio'} / {project.end_date || 'Sin término'}
                      </span>
                    </div>

                    {project.contact_email && (
                      <div className="flex items-center gap-2 text-slate-300">
                        <Mail size={16} className="text-slate-500" />
                        <span>{project.contact_email}</span>
                      </div>
                    )}

                    {project.contact_phone && (
                      <div className="flex items-center gap-2 text-slate-300">
                        <Phone size={16} className="text-slate-500" />
                        <span>{project.contact_phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => openEditModal(project)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300"
                    >
                      <Pencil size={16} />
                      Editar
                    </button>

                    <button
                      onClick={() => handleDelete(project.id)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-red-500/40 px-3 py-2 text-sm font-medium text-red-300"
                    >
                      <Trash2 size={16} />
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-700 bg-slate-900 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {editingId ? 'Editar proyecto' : 'Agregar proyecto'}
                </h2>

                <p className="text-sm text-slate-400">
                  Completa la información principal del proyecto.
                </p>
              </div>

              <button
                onClick={closeModal}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5">
              {error && (
                <div className="flex items-center gap-2 rounded-2xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-300">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Nombre del proyecto *" name="project_name" value={form.project_name} onChange={handleChange} />
                <Input label="Código del proyecto *" name="project_code" value={form.project_code} onChange={handleChange} />

                <Select label="Empresa holding *" name="holding_company_id" value={form.holding_company_id} onChange={handleChange}>
                  <option value="">Seleccionar empresa</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {getCompanyName(company.id)}
                    </option>
                  ))}
                </Select>

                <div>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <label className="block text-sm font-medium text-slate-300">
                      Cliente *
                    </label>

                    <button
                      type="button"
                      onClick={openCreateClientModal}
                      className="rounded-xl border border-cyan-400/40 px-3 py-1 text-xs font-bold text-cyan-300 hover:bg-cyan-950/40"
                    >
                      + Nuevo cliente
                    </button>
                  </div>

                  <select
                    name="client_id"
                    value={form.client_id}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400"
                  >
                    <option value="">Seleccionar cliente</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {getClientName(client.id)}
                      </option>
                    ))}
                  </select>
                </div>

                <Input label="Tipo de servicio" name="service_type" value={form.service_type} onChange={handleChange} />
                <Input label="Tipo de proyecto" name="project_type" value={form.project_type} onChange={handleChange} />
                <Input label="N° contrato" name="contract_number" value={form.contract_number} onChange={handleChange} />
                <Input label="Orden de compra" name="purchase_order" value={form.purchase_order} onChange={handleChange} />

                <Input type="date" label="Fecha inicio" name="start_date" value={form.start_date} onChange={handleChange} />
                <Input type="date" label="Fecha término" name="end_date" value={form.end_date} onChange={handleChange} />

                <Select label="Estado" name="status" value={form.status} onChange={handleChange}>
                  <option value="active">Activo</option>
                  <option value="pending">Pendiente</option>
                  <option value="completed">Finalizado</option>
                  <option value="inactive">Inactivo</option>
                </Select>

                <Input label="Responsable" name="project_manager" value={form.project_manager} onChange={handleChange} />

                <Input label="Ubicación" name="location" value={form.location} onChange={handleChange} />
                <Input label="Comuna" name="commune" value={form.commune} onChange={handleChange} />
                <Input label="Región" name="region" value={form.region} onChange={handleChange} />
                <Input label="Nombre contacto" name="contact_name" value={form.contact_name} onChange={handleChange} />
                <Input label="Email contacto" name="contact_email" value={form.contact_email} onChange={handleChange} />
                <Input label="Teléfono contacto" name="contact_phone" value={form.contact_phone} onChange={handleChange} />
                <Input type="number" label="Presupuesto estimado" name="estimated_budget" value={form.estimated_budget} onChange={handleChange} />
                <Input label="Moneda" name="currency" value={form.currency} onChange={handleChange} />

                <Textarea label="Descripción" name="description" value={form.description} onChange={handleChange} />
                <Textarea label="Notas" name="notes" value={form.notes} onChange={handleChange} />
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-700 pt-5 md:flex-row md:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-2xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-2xl bg-cyan-400 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear proyecto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {openClientModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-700 bg-slate-900 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-700 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Nuevo cliente
                </h2>
                <p className="text-sm text-slate-400">
                  Crea un cliente sin salir del proyecto.
                </p>
              </div>

              <button
                type="button"
                onClick={closeClientModal}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-5 p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Nombre cliente *"
                  name="name"
                  value={clientForm.name}
                  onChange={handleClientChange}
                />

                <Input
                  label="RUT"
                  name="rut"
                  value={clientForm.rut}
                  onChange={handleClientChange}
                />

                <Input
                  label="Email"
                  name="email"
                  value={clientForm.email}
                  onChange={handleClientChange}
                />

                <Input
                  label="Teléfono"
                  name="phone"
                  value={clientForm.phone}
                  onChange={handleClientChange}
                />

                <Input
                  label="Dirección"
                  name="address"
                  value={clientForm.address}
                  onChange={handleClientChange}
                />

                <Input
                  label="Nombre contacto"
                  name="contact_name"
                  value={clientForm.contact_name}
                  onChange={handleClientChange}
                />

                <Input
                  label="Dirección"
                  name="address"
                  value={clientForm.address}
                  onChange={handleClientChange}
                />
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-700 pt-5 md:flex-row md:justify-end">
                <button
                  type="button"
                  onClick={closeClientModal}
                  className="rounded-2xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={savingClient}
                  className="rounded-2xl bg-cyan-400 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingClient ? 'Creando...' : 'Crear cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}





    </div>
  );
}

function Input({ label, name, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-300">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
      />
    </div>
  );
}

function Select({ label, name, value, onChange, children }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-300">
        {label}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400"
      >
        {children}
      </select>
    </div>
  );
}

function Textarea({ label, name, value, onChange }) {
  return (
    <div className="md:col-span-2">
      <label className="mb-1 block text-sm font-medium text-slate-300">
        {label}
      </label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={4}
        className="w-full resize-none rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
      />
    </div>
  );
}