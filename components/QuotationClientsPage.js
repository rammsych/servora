'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/libs/supabaseClient';

export default function QuotationClientsPage() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const [form, setForm] = useState({
        name: '',
        rut: '',
        email: '',
        phone: '',
        address: '',
        contact_name: '',
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

    const handleSave = async () => {
        if (!form.name.trim()) {
            alert('Debe ingresar el nombre del cliente');
            return;
        }

        const { error } = await supabase
            .from('quotation_clients')
            .insert([
                {
                    name: form.name,
                    rut: form.rut || null,
                    email: form.email || null,
                    phone: form.phone || null,
                    address: form.address || null,
                    contact_name: form.contact_name || null,
                },
            ]);

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
        });

        setShowModal(false);

        await loadClients();
    };

    return (
        <section className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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
                    onClick={() => setShowModal(true)}
                    className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-bold text-[#0a0f1c] hover:bg-cyan-300"
                >
                    + Agregar cliente
                </button>
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
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="px-3 py-3">Cliente</th>
                                    <th className="px-3 py-3">RUT</th>
                                    <th className="px-3 py-3">Correo</th>
                                    <th className="px-3 py-3">Teléfono</th>
                                    <th className="px-3 py-3">Contacto</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-white/10">
                                {clients.map((client) => (
                                    <tr key={client.id}>
                                        <td className="px-3 py-3 font-semibold text-white">
                                            {client.name}
                                        </td>

                                        <td className="px-3 py-3 text-gray-300">
                                            {client.rut || '-'}
                                        </td>

                                        <td className="px-3 py-3 text-gray-300">
                                            {client.email || '-'}
                                        </td>

                                        <td className="px-3 py-3 text-gray-300">
                                            {client.phone || '-'}
                                        </td>

                                        <td className="px-3 py-3 text-gray-300">
                                            {client.contact_name || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>


            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
                    <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-[#0f172a] p-6 shadow-2xl">
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-cyan-300">Cotizaciones</p>
                                <h2 className="text-xl font-bold text-white">Nuevo cliente</h2>
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
                                Guardar cliente
                            </button>
                        </div>
                    </div>
                </div>
            )}




        </section>
    );
}