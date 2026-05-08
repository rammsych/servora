'use client';

import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { supabase } from '@/libs/supabaseClient';
import AdminShell from '@/components/AdminShell';


export default function AdminSchedulePage() {
  const [activities, setActivities] = useState([]);
  const [users, setUsers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    activity_date: '',
    start_time: '',
    end_time: '',
    color: '#2563eb',
    assigned_users: [],
  });

  useEffect(() => {
    loadActivities();
    loadUsers();
  }, []);

  async function loadActivities() {
    const { data, error } = await supabase
      .from('monthly_activities')
      .select('*')
      .order('activity_date', { ascending: true });

    if (!error) setActivities(data || []);
  }

  async function loadUsers() {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, role, approval_role')
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Error loading workers:', error);
      return;
    }

    setUsers(data || []);
  }

  function handleDateClick(info) {
    setSelectedActivity(null);
    setForm({
      title: '',
      description: '',
      activity_date: info.dateStr,
      start_time: '',
      end_time: '',
      color: '#2563eb',
      assigned_users: [],
    });
    setModalOpen(true);
  }

  function handleEventClick(info) {
    const activity = activities.find((a) => a.id === info.event.id);

    if (!activity) return;

    setSelectedActivity(activity);
    setForm({
      title: activity.title || '',
      description: activity.description || '',
      activity_date: activity.activity_date || '',
      start_time: activity.start_time || '',
      end_time: activity.end_time || '',
      color: activity.color || '#2563eb',
      assigned_users: activity.assigned_users || [],
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.title || !form.activity_date) {
      alert('Debes ingresar nombre de la tarea y fecha.');
      return;
    }

    if (selectedActivity) {
      await supabase
        .from('monthly_activities')
        .update({
          ...form,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedActivity.id);
    } else {
      await supabase
        .from('monthly_activities')
        .insert([form]);
    }

    setModalOpen(false);
    await loadActivities();
  }

  async function handleDelete() {
    if (!selectedActivity) return;

    await supabase
      .from('monthly_activities')
      .delete()
      .eq('id', selectedActivity.id);

    setModalOpen(false);
    await loadActivities();
  }

  const calendarEvents = activities.map((item) => ({
    id: item.id,
    title: item.title,
    start: item.start_time
      ? `${item.activity_date}T${item.start_time}`
      : item.activity_date,
    end: item.end_time
      ? `${item.activity_date}T${item.end_time}`
      : undefined,
    backgroundColor: item.color,
    borderColor: item.color,
  }));


  function handleAddUser(userId) {
    if (!userId) return;

    if (form.assigned_users.includes(userId)) return;

    setForm({
      ...form,
      assigned_users: [...form.assigned_users, userId],
    });
  }

  function handleRemoveUser(userId) {
    setForm({
      ...form,
      assigned_users: form.assigned_users.filter((id) => id !== userId),
    });
  }

  function getUserLabel(userId) {
    const user = users.find((item) => item.id === userId);

    if (!user) return 'Usuario no encontrado';

    return `${user.full_name || user.email || 'Usuario sin nombre'} - ${user.approval_role || user.role || 'sin rol'}`;
  }


  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Programación de actividades mensual
          </h1>
          <p className="text-sm text-gray-400">
            Planifica, asigna y controla actividades por día, semana o mes.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale={esLocale}
            height="auto"
            selectable
            editable={false}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            events={calendarEvents}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek',
            }}
            buttonText={{
              today: 'Hoy',
              month: 'Mes',
              week: 'Semana',
            }}
          />
        </div>

        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white text-slate-900 rounded-2xl shadow-xl w-full max-w-xl p-6 space-y-4">
              <h2 className="text-xl font-bold">
                {selectedActivity ? 'Editar actividad' : 'Nueva actividad'}
              </h2>

              <div>
                <label className="text-sm font-medium text-slate-700">Nombre de la tarea</label>
                <input
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 mt-1 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.title}
                  onChange={(e) =>
                    setForm({ ...form, title: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Descripción</label>
                <textarea
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 mt-1 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium text-slate-700">Fecha</label>
                  <input
                    type="date"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 mt-1 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.activity_date}
                    onChange={(e) =>
                      setForm({ ...form, activity_date: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Inicio</label>
                  <input
                    type="time"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 mt-1 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.start_time}
                    onChange={(e) =>
                      setForm({ ...form, start_time: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Término</label>
                  <input
                    type="time"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 mt-1 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.end_time}
                    onChange={(e) =>
                      setForm({ ...form, end_time: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Color del tag</label>

                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="color"
                    className="h-10 w-14 cursor-pointer rounded-lg border border-slate-300 bg-white"
                    value={form.color}
                    onChange={(e) =>
                      setForm({ ...form, color: e.target.value })
                    }
                  />

                  <div className="flex items-center gap-2">
                    <span
                      className="h-4 w-4 rounded-full border border-slate-300"
                      style={{ backgroundColor: form.color }}
                    />
                    <span className="text-sm text-slate-600">
                      {form.color}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Asignar trabajadores
                </label>

                <select
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue=""
                  onChange={(e) => {
                    handleAddUser(e.target.value);
                    e.target.value = '';
                  }}
                >
                  <option value="">Seleccionar trabajador...</option>

                  {users
                    .filter((user) => !form.assigned_users.includes(user.id))
                    .map((user) => (
                      <option key={user.id} value={user.id}>
                        {(user.full_name || user.email || 'Usuario sin nombre')} - {user.approval_role || user.role || 'sin rol'}
                      </option>
                    ))}
                </select>

                <div className="mt-3 flex min-h-12 flex-wrap gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  {form.assigned_users.length === 0 ? (
                    <p className="text-sm text-slate-400">
                      Aún no hay trabajadores asignados.
                    </p>
                  ) : (
                    form.assigned_users.map((userId) => (
                      <span
                        key={userId}
                        className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 ring-1 ring-blue-200"
                      >
                        {getUserLabel(userId)}

                        <button
                          type="button"
                          onClick={() => handleRemoveUser(userId)}
                          className="rounded-full px-1 text-blue-500 hover:bg-blue-100 hover:text-blue-700"
                        >
                          ×
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <div>
                  {selectedActivity && (
                    <button
                      onClick={handleDelete}
                      className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700"
                    >
                      Eliminar
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl border"
                  >
                    Cancelar
                  </button>

                  <button
                    onClick={handleSave}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}