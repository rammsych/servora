import AdminShell from '@/components/AdminShell';

export default function Page() {
  return (
    <AdminShell>
      <section className="space-y-4">
        <div>
          <p className="text-sm text-cyan-300">
            Proyectos
          </p>

          <h1 className="text-2xl font-bold text-white">
            Proyectos Gestionados
          </h1>

          <p className="mt-1 text-sm text-gray-400">
            Módulo de administración de Proyectos Gestionados
          </p>
        </div>

        <div className="flex min-h-[400px] items-center justify-center rounded-3xl border border-dashed border-cyan-400/20 bg-white/[0.03]">
          <div className="text-center">
            <p className="text-lg font-bold text-cyan-300">
              🚧 En construcción
            </p>

            <p className="mt-2 text-sm text-gray-400">
              Este módulo estará disponible próximamente.
            </p>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}