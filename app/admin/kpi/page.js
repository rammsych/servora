"use client";

import { useEffect, useState } from "react";
import { supabase } from '@/libs/supabaseClient';
import AdminShell from "@/components/AdminShell";

export default function AdminKpiPage() {
  const [loading, setLoading] = useState(true);

  const [kpis, setKpis] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    cancelled: 0,
  });

  const [guidesByUser, setGuidesByUser] = useState([]);
  const [latestGuides, setLatestGuides] = useState([]);

  useEffect(() => {
    loadKpis();
  }, []);

  const normalizeStatus = (status) => String(status || "").toLowerCase().trim();

  const loadKpis = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("service_guides")
        .select(`
          id,
          guide_number,
          status,
          created_at,
          operator_id,
          user_profiles:operator_id (
            full_name,
            email
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error cargando KPI:", error);
        return;
      }

      const guides = data || [];

      const total = guides.length;

      const pending = guides.filter((g) => {
        const s = normalizeStatus(g.status);
        return s === "pending" || s === "pendiente" || s === "draft" || s === "borrador";
      }).length;

      const completed = guides.filter((g) => {
        const s = normalizeStatus(g.status);
        return s === "completed" || s === "completada" || s === "finalizada";
      }).length;

      const cancelled = guides.filter((g) => {
        const s = normalizeStatus(g.status);
        return s === "cancelled" || s === "anulada" || s === "rechazada";
      }).length;

      setKpis({ total, pending, completed, cancelled });

      const byUser = guides.reduce((acc, guide) => {
        const userName =
          guide.user_profiles?.full_name ||
          guide.user_profiles?.email ||
          "Sin operador";

        if (!acc[userName]) {
          acc[userName] = {
            name: userName,
            email: guide.user_profiles?.email || "-",
            total: 0,
            completed: 0,
            pending: 0,
            cancelled: 0,
          };
        }

        acc[userName].total += 1;

        const status = normalizeStatus(guide.status);

        if (status === "completed" || status === "completada" || status === "finalizada") {
          acc[userName].completed += 1;
        }

        if (status === "pending" || status === "pendiente" || status === "draft" || status === "borrador") {
          acc[userName].pending += 1;
        }

        if (status === "cancelled" || status === "anulada" || status === "rechazada") {
          acc[userName].cancelled += 1;
        }

        return acc;
      }, {});

      setGuidesByUser(Object.values(byUser).sort((a, b) => b.total - a.total));
      setLatestGuides(guides.slice(0, 8));
    } catch (error) {
      console.error("Error inesperado cargando KPI:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("es-CL");
  };

  const completionRate =
    kpis.total > 0 ? Math.round((kpis.completed / kpis.total) * 100) : 0;

  const pendingRate =
    kpis.total > 0 ? Math.round((kpis.pending / kpis.total) * 100) : 0;

  const cancelledRate =
    kpis.total > 0 ? Math.round((kpis.cancelled / kpis.total) * 100) : 0;

  if (loading) {
    return (
      <AdminShell>
        <div className="text-white space-y-6">
          <div className="max-w-7xl mx-auto animate-pulse space-y-6">
            <div>
              <div className="h-4 w-40 rounded bg-slate-800 mb-3" />
              <div className="h-9 w-72 rounded-xl bg-slate-800" />
              <div className="h-4 w-96 rounded bg-slate-800 mt-3" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-52 rounded-3xl bg-[#121b2b] border border-slate-700/70"
                />
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="h-96 rounded-3xl bg-[#121b2b] border border-slate-700/70" />
              <div className="lg:col-span-2 h-96 rounded-3xl bg-[#121b2b] border border-slate-700/70" />
            </div>
          </div>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
    <div className="text-white space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <p className="text-sm text-cyan-300 font-medium">SERVORA / Back Office</p>
          <h1 className="text-3xl font-black mt-1">KPI de guías</h1>
          <p className="text-sm text-slate-400 mt-2">
            Métricas ejecutivas, estados y productividad por operador.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KpiCard title="Total guías" value={kpis.total} subtitle="Guías generadas" color="cyan" />
          <KpiCard title="Pendientes" value={kpis.pending} subtitle="Guías en borrador" color="amber" />
          <KpiCard title="Completadas" value={kpis.completed} subtitle={`${completionRate}% de efectividad`} color="emerald" />
          <KpiCard title="Anuladas / rechazadas" value={kpis.cancelled} subtitle="Guías no válidas" color="rose" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-[#121b2b] border border-slate-700/70 rounded-3xl p-6 shadow-xl">
            <h2 className="text-xl font-bold">Indicadores por estado</h2>
            <p className="text-sm text-slate-400 mb-6">Distribución porcentual de guías</p>

            <div className="space-y-6">
              <DonutChart label="Pendientes" value={kpis.pending} percent={pendingRate} color="#f59e0b" />
              <DonutChart label="Completadas" value={kpis.completed} percent={completionRate} color="#10b981" />
              <DonutChart label="Anuladas" value={kpis.cancelled} percent={cancelledRate} color="#f43f5e" />
            </div>
          </div>

          <div className="lg:col-span-2 bg-[#121b2b] border border-slate-700/70 rounded-3xl p-6 shadow-xl">
            <h2 className="text-xl font-bold">Guías generadas por operador</h2>
            <p className="text-sm text-slate-400 mb-5">Ranking de productividad del equipo</p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400">
                    <th className="py-3 text-left">Operador</th>
                    <th className="py-3 text-center">Total</th>
                    <th className="py-3 text-center">Completadas</th>
                    <th className="py-3 text-center">Pendientes</th>
                    <th className="py-3 text-center">Anuladas</th>
                  </tr>
                </thead>

                <tbody>
                  {guidesByUser.map((user, index) => (
                    <tr key={user.name} className="border-b border-slate-800 last:border-0">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-300 font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-bold text-white">{user.name}</p>
                            <p className="text-xs text-slate-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-center font-black text-cyan-300">{user.total}</td>
                      <td className="py-4 text-center font-bold text-emerald-300">{user.completed}</td>
                      <td className="py-4 text-center font-bold text-amber-300">{user.pending}</td>
                      <td className="py-4 text-center font-bold text-rose-300">{user.cancelled}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-[#121b2b] border border-slate-700/70 rounded-3xl p-6 shadow-xl">
          <h2 className="text-xl font-bold">Últimas guías generadas</h2>
          <p className="text-sm text-slate-400 mb-5">Actividad reciente del sistema</p>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {latestGuides.map((guide) => (
              <div key={guide.id} className="rounded-2xl bg-[#0b1220] border border-slate-700 p-4">
                <p className="font-black text-white">Guía N° {guide.guide_number}</p>
                <p className="text-sm text-slate-400 mt-1">
                  {guide.user_profiles?.full_name || guide.user_profiles?.email || "Sin operador"}
                </p>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs text-slate-500">{formatDate(guide.created_at)}</span>
                  <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-400/30 text-xs font-bold">
                    {guide.status || "Sin estado"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </AdminShell>
  );
}

function KpiCard({ title, value, subtitle, color }) {
  const styles = {
    cyan: "from-cyan-500 to-blue-600 text-cyan-300 border-cyan-400/30",
    amber: "from-amber-400 to-orange-600 text-amber-300 border-amber-400/30",
    emerald: "from-emerald-400 to-green-600 text-emerald-300 border-emerald-400/30",
    rose: "from-rose-400 to-red-600 text-rose-300 border-rose-400/30",
  };

  return (
    <div className="bg-[#121b2b] border border-slate-700/70 rounded-3xl p-6 shadow-xl">
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${styles[color]} flex items-center justify-center shadow-lg`}>
        <div className="w-3 h-3 bg-white rounded-full" />
      </div>
      <p className="text-sm text-slate-400 mt-5">{title}</p>
      <h3 className="text-4xl font-black mt-1">{value}</h3>
      <p className={`text-xs mt-2 ${styles[color]}`}>{subtitle}</p>
    </div>
  );
}

function DonutChart({ label, value, percent, color }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-28 h-28">
        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke="#1e293b"
            strokeWidth="12"
            fill="transparent"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke={color}
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black">{percent}%</span>
          <span className="text-[10px] text-slate-400">{value} guías</span>
        </div>
      </div>

      <div>
        <p className="font-bold text-white">{label}</p>
        <p className="text-sm text-slate-400">
          {value} de las guías registradas
        </p>
      </div>
    </div>
  );
}