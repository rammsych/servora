'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/libs/supabaseClient';
import { UsersRound, Plus, Pencil, Power } from 'lucide-react';

export default function QuotationClientsPage() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingClient, setEditingClient] = useState(null);

    const [form, setForm] = useState({
        name: '',
        rut: '',
        email: '',
        phone: '',
        address: '',
        contact_name: '',
        is_active: true,
    });

    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = async () => {
        setLoading(true);

        const { data, error } = await supabase
            .from('quotation_clients')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error(error);
            setLoading(false);
            return;
        }

        setClients(data || []);
        setLoading(false);
    };

    const handleChange = (field, value) => {
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    // const handleSave = async () => {
    //     if (!form.name.trim()) {
    //         alert('Debe ingresar el nombre del cliente');
    //         return;
    //     }

    //     const { error } = await supabase
    //         .from('quotation_clients')
    //         .insert([
    //             {
    //                 name: form.name,
    //                 rut: form.rut || null,
    //                 email: form.email || null,
    //                 phone: form.phone || null,
    //                 address: form.address || null,
    //                 contact_name: form.contact_name || null,
    //             },
    //         ]);

    //     if (error) {
    //         console.error(error);
    //         alert('No se pudo guardar');
    //         return;
    //     }

    //     setForm({
    //         name: '',
    //         rut: '',
    //         email: '',
    //         phone: '',
    //         address: '',
    //         contact_name: '',
    //     });

    //     setShowModal(false);

    //     await loadClients();
    // };


    const handleSave = async () => {
        if (!form.name.trim()) {
            alert('Debe ingresar el nombre del cliente');
            return;
        }

        const payload = {
            name: form.name,
            rut: form.rut || null,
            email: form.email || null,
            phone: form.phone || null,
            address: form.address || null,
            contact_name: form.contact_name || null,
            is_active: form.is_active,
        };

        const { error } = editingClient
            ? await supabase
                .from('quotation_clients')
                .update(payload)
                .eq('id', editingClient.id)
            : await supabase
                .from('quotation_clients')
                .insert([payload]);

        if (error) {
            console.error(error);
            alert('No se pudo guardar');
            return;
        }

        setForm({
            name: '',
            rut: '',
            email: '',
            phone: '',
            address: '',
            contact_name: '',
            is_active: true,
        });

        setEditingClient(null);
        setShowModal(false);

        await loadClients();
    };

    const handleEdit = (client) => {
        setEditingClient(client);

        setForm({
            name: client.name || '',
            rut: client.rut || '',
            email: client.email || '',
            phone: client.phone || '',
            address: client.address || '',
            contact_name: client.contact_name || '',
            is_active: client.is_active ?? true,
        });

        setShowModal(true);
    };


    const handleToggleStatus = async (client) => {
        const newStatus = !(client.is_active ?? true);

        const { error } = await supabase
            .from('quotation_clients')
            .update({ is_active: newStatus })
            .eq('id', client.id);

        if (error) {
            console.error(error);
            alert('No se pudo actualizar el estado');
            return;
        }

        await loadClients();
    };

    return (
        <section className="space-y-6">
            {/* <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <p className="text-sm text-cyan-300">
                        Cotizaciones
                    </p>

                    <h1 className="text-2xl font-bold text-white">
                        Clientes
                    </h1>

                    <p className="mt-1 text-sm text-gray-400">
                        Administración de clientes para cotizaciones.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        setEditingClient(null);
                        setForm({
                            name: '',
                            rut: '',
                            email: '',
                            phone: '',
                            address: '',
                            contact_name: '',
                            is_active: true,
                        });
                        setShowModal(true);
                    }}
                    className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-bold text-[#0a0f1c] hover:bg-cyan-300"
                >
                    + Agregar cliente
                </button>
            </div> */}



            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-6 shadow-2xl">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
                            <UsersRound className="h-6 w-6" />
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold text-white">
                                Clientes
                            </h1>

                            <p className="mt-1 text-sm text-gray-400">
                                Administra los clientes que podrán ser utilizados en cotizaciones.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setEditingClient(null);
                            setForm({
                                name: '',
                                rut: '',
                                email: '',
                                phone: '',
                                address: '',
                                contact_name: '',
                                is_active: true,
                            });
                            setShowModal(true);
                        }}
                        className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-bold text-[#0a0f1c] hover:bg-cyan-300"
                    >
                        + Agregar cliente
                    </button>
                </div>
            </div>





















            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-2xl">
                <h2 className="mb-4 text-lg font-bold text-white">
                    Clientes registrados
                </h2>

                {loading ? (
                    <p className="text-sm text-gray-400">
                        Cargando clientes...
                    </p>
                ) : clients.length === 0 ? (
                    <p className="text-sm text-gray-400">
                        No hay clientes registrados.
                    </p>
                ) : (

                    <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-[#151b2b] text-xs uppercase tracking-[0.18em] text-slate-500">
                                    <tr>
                                        <th className="px-5 py-4">Cliente</th>
                                        <th className="px-5 py-4">RUT</th>
                                        <th className="px-5 py-4">Contacto</th>
                                        <th className="px-5 py-4">Dirección</th>
                                        <th className="px-5 py-4">Estado</th>
                                        <th className="px-5 py-4 text-right">Acciones</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-white/10">
                                    {clients.map((client) => (
                                        <tr key={client.id}>
                                            <td className="px-5 py-4 font-semibold text-white">
                                                {client.name}
                                            </td>

                                            <td className="px-5 py-4 text-gray-300">
                                                {client.rut || '-'}
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="text-gray-300">{client.email || '-'}</div>
                                                <div className="text-xs text-slate-500">{client.phone || '-'}</div>
                                                <div className="text-xs text-slate-500">{client.contact_name || '-'}</div>
                                            </td>

                                            <td className="px-5 py-4 text-gray-300">
                                                {client.address || '-'}
                                            </td>

                                            <td className="px-5 py-4">
                                                <span className={`rounded-full px-3 py-1 text-xs font-bold ${client.is_active ?? true
                                                    ? 'bg-emerald-500/15 text-emerald-400'
                                                    : 'bg-red-500/15 text-red-400'
                                                    }`}>
                                                    {(client.is_active ?? true) ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleEdit(client)}
                                                        className="rounded-xl border border-white/10 px-3 py-2 text-sm text-gray-300 hover:border-cyan-400 hover:text-cyan-300"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleStatus(client)}
                                                        className="rounded-xl border border-red-400/40 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10"
                                                    >
                                                       <Power className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        
                    </div>

                )}
            </div>

            <div className="space-y-4 md:hidden">
                {clients.map((client) => (
                    <div
                        key={client.id}
                        className="rounded-2xl border border-white/10 bg-[#0f172a] p-4"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className="text-base font-bold text-white">
                                    {client.name}
                                </h3>

                                <p className="mt-1 text-sm text-slate-400">
                                    {client.rut || '-'}
                                </p>
                            </div>

                            <span
                                className={`rounded-full px-3 py-1 text-xs font-bold ${client.is_active ?? true
                                        ? 'bg-emerald-500/15 text-emerald-400'
                                        : 'bg-red-500/15 text-red-400'
                                    }`}
                            >
                                {(client.is_active ?? true)
                                    ? 'Activo'
                                    : 'Inactivo'}
                            </span>
                        </div>

                        <div className="mt-4 space-y-2 text-sm">
                            <div>
                                <p className="text-xs uppercase tracking-wider text-slate-500">
                                    Correo
                                </p>

                                <p className="text-slate-200">
                                    {client.email || '-'}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs uppercase tracking-wider text-slate-500">
                                    Teléfono
                                </p>

                                <p className="text-slate-200">
                                    {client.phone || '-'}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs uppercase tracking-wider text-slate-500">
                                    Contacto
                                </p>

                                <p className="text-slate-200">
                                    {client.contact_name || '-'}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs uppercase tracking-wider text-slate-500">
                                    Dirección
                                </p>

                                <p className="text-slate-200">
                                    {client.address || '-'}
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => handleEdit(client)}
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-gray-300 hover:border-cyan-400 hover:text-cyan-300"
                            >
                                <Pencil className="h-4 w-4" />
                            </button>

                            <button
                                type="button"
                                onClick={() => handleToggleStatus(client)}
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-400/40 text-red-300 hover:bg-red-500/10"
                            >
                                <Power className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>


            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
                    <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-[#0f172a] p-6 shadow-2xl">
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-cyan-300">Cotizaciones</p>
                                <h2 className="text-xl font-bold text-white">
                                    {editingClient ? 'Editar cliente' : 'Nuevo cliente'}
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="rounded-xl border border-white/10 px-3 py-2 text-sm text-gray-300 hover:bg-white/5"
                            >
                                Cerrar
                            </button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <input
                                value={form.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                placeholder="Nombre cliente"
                                className="rounded-2xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                            />

                            <input
                                value={form.rut}
                                onChange={(e) => handleChange('rut', e.target.value)}
                                placeholder="RUT"
                                className="rounded-2xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                            />

                            <input
                                value={form.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                placeholder="Correo"
                                className="rounded-2xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                            />

                            <input
                                value={form.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                placeholder="Teléfono"
                                className="rounded-2xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                            />

                            <input
                                value={form.contact_name}
                                onChange={(e) => handleChange('contact_name', e.target.value)}
                                placeholder="Nombre contacto"
                                className="rounded-2xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                            />

                            <input
                                value={form.address}
                                onChange={(e) => handleChange('address', e.target.value)}
                                placeholder="Dirección"
                                className="rounded-2xl border border-white/10 bg-[#020617] px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                            />
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-bold text-gray-300 hover:bg-white/5"
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                onClick={handleSave}
                                className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-bold text-[#0a0f1c] hover:bg-cyan-300"
                            >
                                {editingClient ? 'Guardar cambios' : 'Guardar cliente'}
                            </button>
                        </div>
                    </div>
                </div>
            )}




        </section>
    );
}