'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminShell from '@/components/AdminShell';
import { supabase } from '@/libs/supabaseClient';
import { getCurrentUserProfile } from '@/libs/userRole';
import { Card, ButtonPrimary, ButtonSecondary, Input } from '@/components/ui';
import { Eye, FileDown, Pencil, ClipboardCheck } from 'lucide-react';

const PAGE_SIZE = 10;

export default function AdminGuidesPage() {
  const router = useRouter();

  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);

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
    .select(`
      *,
      guide_approvals (
        id,
        approval_type,
        status,
        approved_by,
        approved_at,
        comments
      )
    `)
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
  const loadProfile = async () => {
    const { profile } = await getCurrentUserProfile();
    setCurrentProfile(profile);
  };

  loadProfile();
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

    const approvalRole = currentProfile?.approval_role;

    if (!['JEO', 'AI', 'GP'].includes(approvalRole)) {
      alert('Tu usuario no tiene permiso para dar visto bueno.');
      return;
    }

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

    const payload = {
      guide_id: selectedGuide.id,
      approval_type: approvalRole,
      status: decision,
      approved_by: user?.id || null,
      approved_at: new Date().toISOString(),
      comments: decision === 'rejected' ? rejectionReason.trim() : null,
      updated_at: new Date().toISOString(),
    };

    const existingApproval = selectedGuide.guide_approvals?.find(
      (item) => item.approval_type === approvalRole
    );

    let error;

    if (existingApproval) {
      const result = await supabase
        .from('guide_approvals')
        .update(payload)
        .eq('id', existingApproval.id);

      error = result.error;
    } else {
      const result = await supabase
        .from('guide_approvals')
        .insert(payload);

      error = result.error;
    }

    if (error) {
      console.error(error);
      alert('No se pudo guardar el visto bueno.');
      setUpdatingId(null);
      return;
    }

    await loadGuides();

    const { data: approvals, error: approvalsError } = await supabase
      .from('guide_approvals')
      .select('approval_type, status')
      .eq('guide_id', selectedGuide.id);

    if (approvalsError) {
      console.error(approvalsError);
      alert('Se guardó el visto bueno, pero no se pudo recalcular el estado.');
      setUpdatingId(null);
      return;
    }

    const requiredApprovals = ['JEO', 'AI', 'GP'];

    const allApproved = requiredApprovals.every((type) =>
      approvals?.some(
        (approval) =>
          approval.approval_type === type &&
          approval.status === 'approved'
      )
    );

     const anyRejected = approvals?.some(
      (approval) => approval.status === 'rejected'
    );

    console.log('selectedGuide.id:', selectedGuide.id);
    console.log('approvals:', approvals);
    console.log('allApproved:', allApproved);
    console.log('anyRejected:', anyRejected);

   
    console.log('approvals fresh:', approvals);
    if (allApproved) {
      const { error: guideError } = await supabase
      .from('service_guides')
      .update({
        status: 'approved',
      })
      .eq('id', selectedGuide.id);

      // console.log('updatedGuide approved:', updatedGuide);
      console.log('guideError approved:', guideError);

      if (guideError) {
        console.error(guideError);
        alert('Los 3 VB están aprobados, pero no se pudo actualizar la guía.');
        setUpdatingId(null);
        return;
      }
    }
    if (anyRejected) {
      const { error: guideError } = await supabase
        .from('service_guides')
        .update({
          status: 'rejected',
        })
        .eq('id', selectedGuide.id);

      if (guideError) {
        console.error(guideError);
        alert('El VB fue rechazado, pero no se pudo actualizar la guía.');
        setUpdatingId(null);
        return;
      }
    }

    closeEvaluateModal();
    await loadGuides();
    setUpdatingId(null);
  };



  const downloadPdf = (guideId) => {
    window.open(`/api/guides/${guideId}/pdf`, '_blank');
  };

  const getApprovalStatus = (guide, type) => {
    const approval = guide.guide_approvals?.find(
      (item) => item.approval_type === type
    );

    return approval?.status || 'pending';
  };

  const getApprovalClass = (status) => {
    if (status === 'approved') {
      return 'border-green-400/40 bg-green-500/15 text-green-300';
    }

    if (status === 'rejected') {
      return 'border-yellow-400/40 bg-yellow-500/15 text-yellow-300';
    }

    return 'border-red-400/40 bg-red-500/15 text-red-300';
  };


    const hasCurrentRoleApproved = (guide) => {
    const approvalRole = currentProfile?.approval_role;

    if (!approvalRole) return false;

    return guide.guide_approvals?.some(
      (approval) =>
        approval.approval_type === approvalRole &&
        approval.status === 'approved'
    );
  };

  const approvalRole = currentProfile?.approval_role;
  const canApproveJEO = approvalRole === 'JEO';
  const canApproveAI = approvalRole === 'AI';
  const canApproveGP = approvalRole === 'GP';

  return (
    <AdminShell>
      <div className="mb-6">
        <p className="text-sm text-gray-400">SERVORA / Back Office</p>
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
                  <th className="px-5 py-4">VB ISO</th>
                  <th className="px-5 py-4 text-right">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {paginatedGuides.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-5 py-8 text-center text-gray-400">
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

                    <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {['JEO', 'AI', 'GP'].map((type) => {
                        const approvalStatus = getApprovalStatus(guide, type);

                        return (
                          <span
                            key={type}
                            title={approvalStatus === 'approved' ? 'Aprobado' : 'Pendiente de aprobación'}
                            className={`min-w-[42px] rounded-lg border px-2 py-1 text-center text-[11px] font-bold ${getApprovalClass(approvalStatus)}`}
                          >
                            {type}
                          </span>
                        );
                      })}
                    </div>
                  </td>

                    <td className="px-5 py-4 text-right">


                      <div className="flex justify-end items-center gap-2">


                        <ButtonSecondary
                          type="button"
                          className="px-3 py-2 text-xs min-h-0"
                          onClick={() => router.push(`/guides/${guide.id}?back=/admin/guides`)}
                          title="Ver guía"
                        >
                          <Eye className="h-4 w-4" />
                        </ButtonSecondary>


                        <ButtonSecondary
                          type="button"
                          className="px-3 py-2 text-xs min-h-0"
                          onClick={() => downloadPdf(guide.id)}
                          title="Descargar PDF"
                        >
                          <FileDown className="h-4 w-4" />
                        </ButtonSecondary>

                        <ButtonSecondary
                            type="button"
                            disabled={guide.status === 'approved'}
                            className={`px-3 py-2 text-xs min-h-0 ${
                              guide.status === 'approved'
                                ? 'cursor-not-allowed opacity-40'
                                : ''
                            }`}
                            onClick={() => {
                              if (guide.status === 'approved') return;
                              router.push(`/admin/guides/${guide.id}/review`);
                            }}
                            title={
                              guide.status === 'approved'
                                ? 'La guía aprobada no se puede editar'
                                : 'Editar guía'
                            }
                          >
                          <Pencil className="h-4 w-4" />
                        </ButtonSecondary>

                        

                        <button
                          type="button"
                          disabled={
                            updatingId === guide.id ||
                            !['JEO', 'AI', 'GP'].includes(approvalRole) ||
                            hasCurrentRoleApproved(guide)
                          }
                          onClick={() => openEvaluateModal(guide)}
                          title={
                            hasCurrentRoleApproved(guide)
                              ? `Ya aprobaste esta guía como ${approvalRole}`
                              : approvalRole
                                ? `Dar visto bueno como ${approvalRole}`
                                : 'Tu usuario no tiene rol de visto bueno'
                          }
                          className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                            hasCurrentRoleApproved(guide)
                              ? 'border border-green-400/50 bg-green-500/20 text-green-300 cursor-not-allowed opacity-80'
                              : 'bg-cyan-500 text-white hover:bg-cyan-400'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <ClipboardCheck className="h-4 w-4" />
                          </span>
                        </button>


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

            <p className="mt-3 inline-flex rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-300">
              Tu rol de aprobación: {currentProfile?.approval_role || 'Sin rol asignado'}
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