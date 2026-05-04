'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminShell from '@/components/AdminShell';
import { supabase } from '@/libs/supabaseClient';
import { Card, Input, ButtonPrimary, ButtonSecondary } from '@/components/ui';
import Toast from '@/components/ui/Toast';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('operator');
  const [toast, setToast] = useState(null);
  const [userToToggle, setUserToToggle] = useState(null);


  const [userToEdit, setUserToEdit] = useState(null);
  const [editFullName, setEditFullName] = useState('');
  const [editRole, setEditRole] = useState('operator');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editing, setEditing] = useState(false);

  const showToast = (type, message) => {
  setToast({ type, message });

  setTimeout(() => {
    setToast(null);
  }, 3000);
};

  const loadUsers = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      setUsers([]);
    } else {
      setUsers(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const value = search.toLowerCase().trim();

    if (!value) return users;

    return users.filter((user) => {
      return (
        String(user.email || '').toLowerCase().includes(value) ||
        String(user.full_name || '').toLowerCase().includes(value) ||
        String(user.role || '').toLowerCase().includes(value)
      );
    });
  }, [users, search]);

  const createUser = async () => {
    if (!email || !password || !fullName || !role) {
      showToast('error', 'Completa todos los campos.');
      return;
    }

    setSaving(true);

    const res = await fetch('/api/admin/users/create', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        full_name: fullName,
        role,
      }),
    });

    const json = await res.json();

    if (!json.ok) {
      showToast('error', json.message);
      setSaving(false);
      return;
    }

    setEmail('');
    setPassword('');
    setFullName('');
    setRole('operator');
    showToast('success', 'Usuario creado correctamente');

    await loadUsers();
    setSaving(false);
  };


    const toggleUserStatus = async (user) => {
      setUserToToggle(user);
    };

    const confirmToggleUserStatus = async () => {
        if (!userToToggle) return;

        const nextStatus = !userToToggle.is_active;

        const res = await fetch('/api/admin/users/update-status', {
          method: 'POST',
          body: JSON.stringify({
            userId: userToToggle.id,
            isActive: nextStatus,
          }),
        });

        const json = await res.json();

        if (!json.ok) {
          showToast('error', json.message);
          return;
        }

        await loadUsers();

        showToast(
          'success',
          nextStatus
            ? 'Usuario habilitado correctamente'
            : 'Usuario deshabilitado correctamente'
        );

        setUserToToggle(null);
      };


      const openEditModal = (user) => {
  setUserToEdit(user);
  setEditFullName(user.full_name || '');
  setEditRole(user.role || 'operator');
  setEditIsActive(user.is_active !== false);
};

const closeEditModal = () => {
  setUserToEdit(null);
  setEditFullName('');
  setEditRole('operator');
  setEditIsActive(true);
};

const saveUserEdit = async () => {
  if (!userToEdit) return;

  if (!editFullName.trim()) {
    showToast('error', 'El nombre completo es obligatorio.');
    return;
  }

  setEditing(true);

  const res = await fetch('/api/admin/users/update', {
    method: 'POST',
    body: JSON.stringify({
      userId: userToEdit.id,
      full_name: editFullName.trim(),
      role: editRole,
      is_active: editIsActive,
    }),
  });

  const json = await res.json();

  if (!json.ok) {
    showToast('error', json.message);
    setEditing(false);
    return;
  }

  await loadUsers();

  showToast('success', 'Usuario actualizado correctamente');

  setEditing(false);
  closeEditModal();
};


  return (
    <AdminShell>
      <div className="mb-6">
        <p className="text-sm text-gray-400">SERVORA / Usuarios</p>
        <h1 className="mt-1 text-3xl font-bold text-white">
          Administración de usuarios
        </h1>
        <p className="mt-2 text-sm text-gray-400">
          Crea, busca, habilita o deshabilita usuarios del sistema.
        </p>
      </div>

      <Card className="mb-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">
              Crear usuario
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              Agrega operadores o administradores al sistema.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <Input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="new-email"
            name="new-user-email"
          />

          <Input
            type="password"
            placeholder="Password temporal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            name="new-user-password"
          />

          <Input
            placeholder="Nombre completo"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="rounded-xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="operator">Operador</option>
            <option value="admin">Administrador</option>
            <option value="chief_admin">Jefe administrador</option>
          </select>
        </div>

        <ButtonPrimary
          className="mt-4"
          type="button"
          disabled={saving}
          onClick={createUser}
        >
          {saving ? 'Creando...' : 'Crear usuario'}
        </ButtonPrimary>
      </Card>

      <Card className="p-0">
        <div className="flex flex-col gap-4 border-b border-white/10 px-5 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">
              Usuarios registrados
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              Total: {filteredUsers.length} usuario(s)
            </p>
          </div>

          <div className="w-full md:w-80">
            <Input
              placeholder="Buscar por email, nombre o rol..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading && (
          <div className="flex items-center gap-3 px-5 py-8 text-gray-400">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />
            <p className="text-sm">Cargando usuarios...</p>
          </div>
        )}

        {!loading && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.02] text-xs uppercase text-gray-400">
                <tr>
                  <th className="px-5 py-4">Usuario</th>
                  <th className="px-5 py-4">Rol</th>
                  <th className="px-5 py-4">Estado</th>
                  <th className="px-5 py-4">Creado</th>
                  <th className="px-5 py-4 text-right">Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {filteredUsers.length === 0 && (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-5 py-10 text-center text-gray-400"
                    >
                      No se encontraron usuarios.
                    </td>
                  </tr>
                )}

                {filteredUsers.map((user) => (
                  <tr key={user.id} className="transition hover:bg-white/[0.02]">
                    <td className="px-5 py-4">
                      <div className="font-bold text-white">
                        {user.full_name || 'Sin nombre'}
                      </div>
                      <div className="mt-1 text-xs text-gray-400">
                        {user.email}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <RoleBadge role={user.role} />
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge isActive={user.is_active} />
                    </td>

                    <td className="px-5 py-4 text-gray-300">
                      {formatDate(user.created_at)}
                    </td>

                    <td className="px-5 py-4 text-right">
                     <div className="flex justify-end gap-2">
                      <ButtonSecondary
                        type="button"
                        onClick={() => openEditModal(user)}
                      >
                        Editar
                      </ButtonSecondary>

                      <ButtonSecondary
                        type="button"
                        onClick={() => toggleUserStatus(user)}
                      >
                        {user.is_active ? 'Deshabilitar' : 'Habilitar'}
                      </ButtonSecondary>
                    </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {userToToggle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0a0f1c] p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white">
              {userToToggle.is_active ? 'Deshabilitar usuario' : 'Habilitar usuario'}
            </h2>

            <p className="mt-3 text-sm text-gray-400">
              {userToToggle.is_active
                ? 'Este usuario no podrá operar normalmente en el sistema.'
                : 'Este usuario volverá a estar disponible en el sistema.'}
            </p>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm font-bold text-white">
                {userToToggle.full_name || 'Sin nombre'}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {userToToggle.email}
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <ButtonSecondary
                type="button"
                onClick={() => setUserToToggle(null)}
              >
                Cancelar
              </ButtonSecondary>

              <ButtonPrimary
                type="button"
                onClick={confirmToggleUserStatus}
              >
                Confirmar
              </ButtonPrimary>
            </div>
          </div>
        </div>

      )}

      {userToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0a0f1c] p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white">
              Editar usuario
            </h2>

            <p className="mt-2 text-sm text-gray-400">
              Modifica los datos administrativos del usuario.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold text-gray-400">
                  Email
                </p>
                <Input
                  value={userToEdit.email || ''}
                  disabled
                />
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold text-gray-400">
                  Nombre completo
                </p>
                <Input
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  placeholder="Nombre completo"
                />
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold text-gray-400">
                  Rol
                </p>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="operator">Operador</option>
                  <option value="admin">Administrador</option>
                  <option value="chief_admin">Jefe administrador</option>
                </select>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold text-gray-400">
                  Estado
                </p>
                <select
                  value={editIsActive ? 'active' : 'inactive'}
                  onChange={(e) => setEditIsActive(e.target.value === 'active')}
                  className="w-full rounded-xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <ButtonSecondary
                type="button"
                onClick={closeEditModal}
              >
                Cancelar
              </ButtonSecondary>

              <ButtonPrimary
                type="button"
                disabled={editing}
                onClick={saveUserEdit}
              >
                {editing ? 'Guardando...' : 'Guardar cambios'}
              </ButtonPrimary>
            </div>
          </div>
        </div>
      )}


    </AdminShell>
  );
}

function RoleBadge({ role }) {
  const labels = {
    operator: 'Operador',
    admin: 'Administrador',
    chief_admin: 'Jefe administrador',
  };

  const styles = {
    operator: 'border-blue-400/30 bg-blue-500/10 text-blue-300',
    admin: 'border-cyan-400/30 bg-cyan-500/10 text-cyan-300',
    chief_admin: 'border-purple-400/30 bg-purple-500/10 text-purple-300',
  };

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
        styles[role] || styles.operator
      }`}
    >
      {labels[role] || role || 'Operador'}
    </span>
  );
}

function StatusBadge({ isActive }) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
        isActive
          ? 'border-green-400/30 bg-green-500/10 text-green-300'
          : 'border-red-400/30 bg-red-500/10 text-red-300'
      }`}
    >
      {isActive ? 'Activo' : 'Inactivo'}
    </span>
  );
}

function formatDate(value) {
  if (!value) return '-';

  return new Date(value).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}