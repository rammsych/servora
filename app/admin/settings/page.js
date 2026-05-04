import AdminShell from '@/components/AdminShell';
import { Card } from '@/components/ui';

export default function AdminSettingsPage() {
  return (
    <AdminShell>
      <div className="mb-6">
        <p className="text-sm text-gray-400">SERVORA / Configuraciones</p>
        <h1 className="mt-1 text-3xl font-bold text-white">
          Configuraciones
        </h1>
        <p className="mt-2 text-sm text-gray-400">
          Próximamente podrás administrar correos y parámetros del sistema.
        </p>
      </div>

      <Card>
        <p className="text-sm text-gray-400">
          Módulo pendiente de implementación.
        </p>
      </Card>
    </AdminShell>
  );
}