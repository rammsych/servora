'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminShell from '@/components/AdminShell';
import { supabase } from '@/libs/supabaseClient';
import { Card, ButtonPrimary, ButtonSecondary, Input } from '@/components/ui';

const PAGE_SIZE = 10;

export default function AdminGuidesPage() {
  const router = useRouter();

  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const [customerFilter, setCustomerFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [page, setPage] = useState(1);
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [decision, setDecision] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const loadGuides = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('service_guides')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      setGuides([]);
    } else {
      setGuides(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadGuides();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [customerFilter, dateFilter, statusFilter]);

  const filteredGuides = useMemo(() => {
    return guides.filter((guide) => {
      const customer = `${guide.customer_name || ''} ${guide.institution_name || ''}`.toLowerCase();

      const matchCustomer =
        !customerFilter ||
        customer.includes(customerFilter.toLowerCase());

      const matchDate =
        !dateFilter ||
        guide.service_date === dateFilter;

      const normalizedStatus = guide.status || 'submitted';

      const matchStatus =
        statusFilter === 'all' ||
        normalizedStatus === statusFilter;

      return matchCustomer && matchDate && matchStatus;
    });
  }, [guides, customerFilter, dateFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredGuides.length / PAGE_SIZE));

  const paginatedGuides = filteredGuides.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const openEvaluateModal = (guide) => {
    setSelectedGuide(guide);
    setDecision('');
    setRejectionReason('');
  };

  const closeEvaluateModal = () => {
    setSelectedGuide(null);
    setDecision('');
    setRejectionReason('');
  };

  const submitEvaluation = async () => {
    if (!selectedGuide) return;

    if (!decision) {
      alert('Debes seleccionar aprobar o rechazar.');
      return;
    }

    if (decision === 'rejected' && !rejectionReason.trim()) {
      alert('Debes ingresar el motivo del rechazo.');
      return;
    }

    setUpdatingId(selectedGuide.id);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const payload =
      decision === 'approved'
        ? {
            status: 'approved',
            approved_at: new Date().toISOString(),
            approved_by: user?.id || null,
            rejected_at: null,
            rejected_by: null,
            rejection_reason: null,
          }
        : {
            status: 'rejected',
            rejected_at: new Date().toISOString(),
            rejected_by: user?.id || null,
            rejection_reason: rejectionReason.trim(),
          };

    const { error } = await supabase
      .from('service_guides')
      .update(payload)
      .eq('id', selectedGuide.id);

    if (error) {
      console.error(error);
      alert('No se pudo evaluar la guía.');
    } else {
      closeEvaluateModal();
      await loadGuides();
    }

    setUpdatingId(null);
  };

  const downloadPdf = (guideId) => {
    window.open(`/api/guides/${guideId}/pdf`, '_blank');
  };

  return (
    <AdminShell>
      <div className="mb-6">
        <p className="text-sm text-gray-400">SERVORA / Back Office 1.0.1</p>
        <h1 className="mt-1 text-3xl font-bold text-white">
          Dashboard guías
        </h1>
        <p className="mt-2 text-sm text-gray-400">
          Revisa, filtra, descarga y evalúa las guías emitidas por los operadores.
        </p>
      </div>

      <Card className="mb-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <p className="mb-2 text-xs font-semibold text-gray-400">
              Cliente / Institución
            </p>
            <Input
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              placeholder="Buscar cliente..."
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold text-gray-400">
              Fecha
            </p>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold text-gray-400">
              Estado
            </p>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos</option>
              <option value="submitted">Pendiente</option>
              <option value="approved">Aprobada</option>
              <option value="rejected">Rechazada</option>
            </select>
          </div>

          <div className="flex items-end">
            <ButtonSecondary
              type="button"
              className="w-full"
              onClick={() => {
                setCustomerFilter('');
                setDateFilter('');
                setStatusFilter('all');
              }}
            >
              Limpiar filtros
            </ButtonSecondary>
          </div>
        </div>
      </Card>

      {loading && (
        <Card>
          <div className="flex items-center gap-3 text-gray-400">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />
            <p className="text-sm">Cargando guías...</p>
          </div>
        </Card>
      )}

      {!loading && (
        <Card className="p-0">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <p className="text-sm text-gray-400">
              Mostrando {paginatedGuides.length} de {filteredGuides.length} guías
            </p>

            <ButtonSecondary type="button" onClick={loadGuides}>
              Refrescar
            </ButtonSecondary>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="border-b border-white/10 text-xs text-gray-400">
                <tr>
                  <th className="px-5 py-4">Folio</th>
                  <th className="px-5 py-4">Fecha</th>
                  <th className="px-5 py-4">Cliente</th>
                  <th className="px-5 py-4">Institución</th>
                  <th className="px-5 py-4">Estado</th>
                  <th className="px-5 py-4 text-right">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {paginatedGuides.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-5 py-8 text-center text-gray-400">
                      No hay guías para los filtros seleccionados.
                    </td>
                  </tr>
                )}

                {paginatedGuides.map((guide) => (
                  <tr key={guide.id} className="border-b border-white/5">
                    <td className="px-5 py-4 font-bold">
                      N° {guide.guide_number || 'Sin número'}
                    </td>

                    <td className="px-5 py-4">
                      {guide.service_date || '-'}
                    </td>

                    <td className="px-5 py-4">
                      {guide.customer_name || '-'}
                    </td>

                    <td className="px-5 py-4">
                      {guide.institution_name || '-'}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={guide.status || 'submitted'} />
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <ButtonSecondary
                          type="button"
                          onClick={() => router.push(`/guides/${guide.id}?back=/admin/guides`)}
                        >
                          Ver
                        </ButtonSecondary>

                        <ButtonSecondary
                          type="button"
                          onClick={() => downloadPdf(guide.id)}
                        >
                          Descargar PDF
                        </ButtonSecondary>

                        <ButtonPrimary
                          type="button"
                          disabled={updatingId === guide.id}
                          onClick={() => openEvaluateModal(guide)}
                        >
                          Evaluar
                        </ButtonPrimary>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-white/10 px-5 py-4">
            <p className="text-sm text-gray-400">
              Página {page} de {totalPages}
            </p>

            <div className="flex gap-2">
              <ButtonSecondary
                type="button"
                disabled={page === 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="disabled:opacity-40"
              >
                Anterior
              </ButtonSecondary>

              <ButtonSecondary
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                className="disabled:opacity-40"
              >
                Siguiente
              </ButtonSecondary>
            </div>
          </div>
        </Card>
      )}

      {selectedGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0a0f1c] p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white">
              Evaluar guía N° {selectedGuide.guide_number || 'Sin número'}
            </h2>

            <p className="mt-2 text-sm text-gray-400">
              Selecciona si la guía será aprobada o rechazada.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDecision('approved')}
                className={`rounded-2xl border px-4 py-4 text-sm font-bold ${
                  decision === 'approved'
                    ? 'border-green-400 bg-green-500/20 text-green-300'
                    : 'border-white/10 text-gray-300 hover:bg-white/5'
                }`}
              >
                Aprobar
              </button>

              <button
                type="button"
                onClick={() => setDecision('rejected')}
                className={`rounded-2xl border px-4 py-4 text-sm font-bold ${
                  decision === 'rejected'
                    ? 'border-red-400 bg-red-500/20 text-red-300'
                    : 'border-white/10 text-gray-300 hover:bg-white/5'
                }`}
              >
                Rechazar
              </button>
            </div>

            {decision === 'rejected' && (
              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold text-gray-400">
                  Motivo del rechazo
                </p>

                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Ej: Falta información del cliente, fotos incompletas, datos incorrectos..."
                  className="min-h-28 w-full rounded-xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <ButtonSecondary type="button" onClick={closeEvaluateModal}>
                Cancelar
              </ButtonSecondary>

              <ButtonPrimary
                type="button"
                disabled={updatingId === selectedGuide.id}
                onClick={submitEvaluation}
              >
                {updatingId === selectedGuide.id ? 'Guardando...' : 'Guardar evaluación'}
              </ButtonPrimary>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

function StatusBadge({ status }) {
  const styles = {
    draft: 'bg-gray-500/10 text-gray-300 border-gray-500/30',
    submitted: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
    approved: 'bg-green-500/10 text-green-300 border-green-500/30',
    rejected: 'bg-red-500/10 text-red-300 border-red-500/30',
  };

  const labels = {
    draft: 'Borrador',
    submitted: 'Pendiente',
    approved: 'Aprobada',
    rejected: 'Rechazada',
  };

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
        styles[status] || styles.submitted
      }`}
    >
      {labels[status] || 'Pendiente'}
    </span>
  );
}