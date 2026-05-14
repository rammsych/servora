'use client';

import { useEffect, useState } from 'react';
import AdminShell from '@/components/AdminShell';
import { supabase } from '@/libs/supabaseClient';
import { Building2, Pencil, Power, Upload } from 'lucide-react';

const emptyForm = {
  business_name: '',
  rut: '',
  code: '',
  address: '',
  phone: '',
  contact_email: '',
  logo_url: '',
};

export default function CompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    const { data, error } = await supabase
      .from('holding_companies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      alert('Error al listar empresas');
      return;
    }

    setCompanies(data || []);
  };

  const uploadLogo = async () => {
    if (!logoFile) return form.logo_url;

    const extension = logoFile.name.split('.').pop();
    const fileName = `logos/empresas/${Date.now()}-${form.code}.${extension}`;

    const { error } = await supabase.storage
      .from('service-guide-photos')
      .upload(fileName, logoFile, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error(error);
      throw new Error('Error al subir logo');
    }

    const { data } = supabase.storage
      .from('service-guide-photos')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.business_name || !form.rut || !form.code) {
      alert('Razón social, RUT y código son obligatorios');
      return;
    }

    try {
      setLoading(true);

      const logoUrl = await uploadLogo();

      const payload = {
        ...form,
        logo_url: logoUrl,
        updated_at: new Date().toISOString(),
      };

      if (editingId) {
        const { error } = await supabase
          .from('holding_companies')
          .update(payload)
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('holding_companies')
          .insert([payload]);

        if (error) throw error;
      }

      // setForm(emptyForm);
      // setEditingId(null);
      // setLogoFile(null);
      // await fetchCompanies();

      setForm(emptyForm);
      setEditingId(null);
      setLogoFile(null);
      setIsModalOpen(false);
      await fetchCompanies();


    } catch (error) {
      console.error(error);
      alert(error.message || 'Error al guardar empresa');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (company) => {
    setEditingId(company.id);
    setLogoFile(null);

    setForm({
      business_name: company.business_name || '',
      rut: company.rut || '',
      code: company.code || '',
      address: company.address || '',
      phone: company.phone || '',
      contact_email: company.contact_email || '',
      logo_url: company.logo_url || '',
    });

    setIsModalOpen(true);
  };

  const handleToggleStatus = async (company) => {
    const ok = confirm(
      `¿Seguro que deseas ${company.is_active ? 'deshabilitar' : 'habilitar'} esta empresa?`
    );

    if (!ok) return;

    const { error } = await supabase
      .from('holding_companies')
      .update({
        is_active: !company.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', company.id);

    if (error) {
      console.error(error);
      alert('Error al cambiar estado');
      return;
    }

    await fetchCompanies();
  };

  const handleCancel = () => {
    setForm(emptyForm);
    setEditingId(null);
    setLogoFile(null);
    setIsModalOpen(false);
  };


  const handleOpenCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setLogoFile(null);
    setIsModalOpen(true);
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
                <Building2 size={24} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-white">Empresas del Holding</h1>
                <p className="text-sm text-gray-400">
                  Administra las empresas internas que podrán emitir guías de servicio.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenCreate}
              className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-bold text-[#0a0f1c] hover:bg-cyan-300"
            >
              + Agregar empresa
            </button>
          </div>
        </section>

        {/* <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
          <h2 className="mb-5 text-lg font-bold text-white">
            {editingId ? 'Editar empresa' : 'Nueva empresa'}
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Razón social" name="business_name" value={form.business_name} onChange={handleChange} />
              <Input label="RUT" name="rut" value={form.rut} onChange={handleChange} />
              <Input label="Código" name="code" value={form.code} onChange={handleChange} />
              <Input label="Teléfono" name="phone" value={form.phone} onChange={handleChange} />
              <Input label="Correo contacto" name="contact_email" value={form.contact_email} onChange={handleChange} />
              <Input label="Dirección" name="address" value={form.address} onChange={handleChange} />
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-sm font-semibold text-gray-300">
                Logo empresa
              </label>

              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-4 text-sm text-gray-400 hover:bg-white/[0.06]">
                <Upload size={18} />
                <span>{logoFile ? logoFile.name : 'Seleccionar imagen'}</span>

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                />
              </label>

              {form.logo_url && (
                <img
                  src={form.logo_url}
                  alt="Logo actual"
                  className="mt-3 h-14 rounded-xl border border-white/10 bg-white object-contain p-2"
                />
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-bold text-[#0a0f1c] hover:bg-cyan-300 disabled:opacity-60"
              >
                {loading ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear empresa'}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-bold text-gray-300 hover:bg-white/5"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section> */}

        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl">
          <div className="border-b border-white/10 p-5">
            <h2 className="text-lg font-bold text-white">Listado de empresas</h2>
          </div>
          {/* 
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-5 py-4">Logo</th>
                  <th className="px-5 py-4">Razón social</th>
                  <th className="px-5 py-4">RUT</th>
                  <th className="px-5 py-4">Código</th>
                  <th className="px-5 py-4">Contacto</th>
                  <th className="px-5 py-4">Estado</th>
                  <th className="px-5 py-4 text-right">Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10">
                {companies.map((company) => (
                  <tr key={company.id} className="text-gray-300">
                    <td className="px-5 py-4">
                      {company.logo_url ? (
                        <img
                          src={company.logo_url}
                          alt={company.business_name}
                          className="h-10 w-10 rounded-xl bg-white object-contain p-1"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-gray-500">
                          <Building2 size={18} />
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4 font-semibold text-white">{company.business_name}</td>
                    <td className="px-5 py-4">{company.rut}</td>
                    <td className="px-5 py-4">{company.code}</td>

                    <td className="px-5 py-4">
                      <div>{company.contact_email || '-'}</div>
                      <div className="text-xs text-gray-500">{company.phone || '-'}</div>
                    </td>

                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${company.is_active
                        ? 'bg-green-500/10 text-green-300'
                        : 'bg-red-500/10 text-red-300'
                        }`}>
                        {company.is_active ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(company)}
                          className="rounded-xl border border-white/10 p-2 text-gray-300 hover:bg-white/5"
                          title="Editar"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(company)}
                          className={`rounded-xl border p-2 ${company.is_active
                            ? 'border-red-400/20 text-red-300 hover:bg-red-500/10'
                            : 'border-green-400/20 text-green-300 hover:bg-green-500/10'
                            }`}
                          title={company.is_active ? 'Deshabilitar' : 'Habilitar'}
                        >
                          <Power size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {companies.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-5 py-10 text-center text-gray-500">
                      No hay empresas registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="md:hidden space-y-3 p-4">
              {companies.map((company) => (
                <div
                  key={company.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-white truncate">
                        {company.name}
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        RUT: {company.rut || "Sin RUT"}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${company.is_active
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-red-500/15 text-red-300"
                        }`}
                    >
                      {company.is_active ? "Activa" : "Inactiva"}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-2 text-xs text-slate-300">
                    <p className="break-words">
                      <span className="text-slate-500">Contacto:</span>{" "}
                      {company.contact_name || "Sin contacto"}
                    </p>

                    <p className="break-words">
                      <span className="text-slate-500">Email:</span>{" "}
                      {company.contact_email || "Sin email"}
                    </p>

                    <p>
                      <span className="text-slate-500">Teléfono:</span>{" "}
                      {company.contact_phone || "Sin teléfono"}
                    </p>
                  </div>

                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      onClick={() => openEditModal(company)}
                      className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800"
                    >
                      Editar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div> */}

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-5 py-4">Logo</th>
                  <th className="px-5 py-4">Razón social</th>
                  <th className="px-5 py-4">RUT</th>
                  <th className="px-5 py-4">Código</th>
                  <th className="px-5 py-4">Contacto</th>
                  <th className="px-5 py-4">Estado</th>
                  <th className="px-5 py-4 text-right">Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10">
                {companies.map((company) => (
                  <tr key={company.id} className="text-gray-300">
                    <td className="px-5 py-4">
                      {company.logo_url ? (
                        <img
                          src={company.logo_url}
                          alt={company.business_name}
                          className="h-10 w-10 rounded-xl bg-white object-contain p-1"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-gray-500">
                          <Building2 size={18} />
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4 font-semibold text-white">
                      {company.business_name}
                    </td>

                    <td className="px-5 py-4">{company.rut}</td>
                    <td className="px-5 py-4">{company.code}</td>

                    <td className="px-5 py-4">
                      <div>{company.contact_email || '-'}</div>
                      <div className="text-xs text-gray-500">
                        {company.phone || '-'}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${company.is_active
                            ? 'bg-green-500/10 text-green-300'
                            : 'bg-red-500/10 text-red-300'
                          }`}
                      >
                        {company.is_active ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(company)}
                          className="rounded-xl border border-white/10 p-2 text-gray-300 hover:bg-white/5"
                          title="Editar"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(company)}
                          className={`rounded-xl border p-2 ${company.is_active
                              ? 'border-red-400/20 text-red-300 hover:bg-red-500/10'
                              : 'border-green-400/20 text-green-300 hover:bg-green-500/10'
                            }`}
                          title={company.is_active ? 'Deshabilitar' : 'Habilitar'}
                        >
                          <Power size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {companies.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-5 py-10 text-center text-gray-500">
                      No hay empresas registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3 p-4">
            {companies.map((company) => (
              <div
                key={company.id}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-white">
                      {company.business_name}
                    </h3>

                    <p className="mt-1 text-xs text-gray-500">
                      RUT: {company.rut || 'Sin RUT'}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Código: {company.code || 'Sin código'}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${company.is_active
                      ? 'bg-green-500/10 text-green-300'
                      : 'bg-red-500/10 text-red-300'
                      }`}
                  >
                    {company.is_active ? 'Activa' : 'Inactiva'}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs text-gray-300">
                  <p className="break-words">
                    <span className="text-gray-500">Email:</span>{' '}
                    {company.contact_email || '-'}
                  </p>

                  <p>
                    <span className="text-gray-500">Teléfono:</span>{' '}
                    {company.phone || '-'}
                  </p>

                  <p className="break-words">
                    <span className="text-gray-500">Dirección:</span>{' '}
                    {company.address || '-'}
                  </p>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(company)}
                    className="rounded-xl border border-white/10 p-2 text-gray-300 hover:bg-white/5"
                    title="Editar"
                  >
                    <Pencil size={17} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleStatus(company)}
                    className={`rounded-xl border p-2 ${company.is_active
                      ? 'border-red-400/20 text-red-300 hover:bg-red-500/10'
                      : 'border-green-400/20 text-green-300 hover:bg-green-500/10'
                      }`}
                    title={company.is_active ? 'Deshabilitar' : 'Habilitar'}
                  >
                    <Power size={17} />
                  </button>
                </div>
              </div>
            ))}

            {companies.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center text-sm text-gray-500">
                No hay empresas registradas.
              </div>
            )}
          </div>



        </section>
      </div>



      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-white/10 bg-[#0a0f1c] p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {editingId ? 'Editar empresa' : 'Nueva empresa'}
                </h2>
                <p className="text-sm text-gray-400">
                  Completa los datos de la empresa del holding.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCancel}
                className="rounded-xl border border-white/10 px-3 py-2 text-sm font-bold text-gray-300 hover:bg-white/5"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Razón social" name="business_name" value={form.business_name} onChange={handleChange} />
                <Input label="RUT" name="rut" value={form.rut} onChange={handleChange} />
                <Input label="Código" name="code" value={form.code} onChange={handleChange} />
                <Input label="Teléfono" name="phone" value={form.phone} onChange={handleChange} />
                <Input label="Correo contacto" name="contact_email" value={form.contact_email} onChange={handleChange} />
                <Input label="Dirección" name="address" value={form.address} onChange={handleChange} />
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-semibold text-gray-300">
                  Logo empresa
                </label>

                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-4 text-sm text-gray-400 hover:bg-white/[0.06]">
                  <Upload size={18} />
                  <span>{logoFile ? logoFile.name : 'Seleccionar imagen'}</span>

                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                  />
                </label>

                {form.logo_url && (
                  <img
                    src={form.logo_url}
                    alt="Logo actual"
                    className="mt-3 h-14 rounded-xl border border-white/10 bg-white object-contain p-2"
                  />
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-bold text-gray-300 hover:bg-white/5"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-bold text-[#0a0f1c] hover:bg-cyan-300 disabled:opacity-60"
                >
                  {loading ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear empresa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}





    </AdminShell>
  );
}

function Input({ label, name, value, onChange }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-300">
        {label}
      </label>

      <input
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-cyan-400/40"
      />
    </div>
  );
}