'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/libs/supabaseClient';
import { getCurrentUserProfile } from '@/libs/userRole';
import { CalendarDays } from 'lucide-react';


const menuItems = [
  {
    label: "KPI",
    href: "/admin/kpi",
    icon: '📄',
  },
  {
    label: 'Dashboard guías',
    href: '/admin/guides',
    icon: '📄',
  },
  {
    label: "Generar guía",
    href: "/admin/guides/new",
    icon: '📝',
  },
  {
    label: 'Programación mensual',
    href: '/admin/schedule',
    icon: CalendarDays,
  },
  {
    label: 'Usuarios',
    href: '/admin/users',
    icon: '👥',
  },
  {
    label: 'Configuraciones',
    href: '/admin/settings',
    icon: '⚙️',
  },

];

export default function AdminShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const [checkingAccess, setCheckingAccess] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    validateAccess();
  }, []);

  const validateAccess = async () => {
    const {
      user,
      isAdmin,
      profile,
    } = await getCurrentUserProfile();

    if (!user) {
      router.replace('/login');
      return;
    }

    if (!isAdmin) {
      router.replace('/dashboard');
      return;
    }
    setProfile(profile);
    setCheckingAccess(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (checkingAccess) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0a0f1c] text-white">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />
          <p className="text-sm text-gray-400">Validando acceso administrativo...</p>
        </div>
      </main>
    );
  }


  const roleLabel = (() => {
    if (!profile) return 'Administrador';

    if (profile.approval_role === 'JEO') {
      return 'Jefe eficiencia operativa';
    }

    if (profile.approval_role === 'AI') {
      return 'Analista ingeniería';
    }

    if (profile.approval_role === 'GP') {
      return 'Gerente proyecto';
    }

    if (profile.role === 'admin') {
      return 'Administrador';
    }

    return 'Operador';
  })();

  const roleStyles = (() => {
    if (profile?.approval_role === 'JEO') {
      return 'border-green-400/20 bg-green-500/10 text-green-300';
    }

    if (profile?.approval_role === 'AI') {
      return 'border-yellow-400/20 bg-yellow-500/10 text-yellow-300';
    }

    if (profile?.approval_role === 'GP') {
      return 'border-purple-400/20 bg-purple-500/10 text-purple-300';
    }

    return 'border-cyan-400/20 bg-cyan-500/10 text-cyan-300';
  })();








  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white">
      <aside className="fixed left-0 top-0 hidden h-screen w-72 border-r border-white/10 bg-[#080d18] p-5 lg:block">
        <div className="mb-8 flex items-center gap-3">
          <Image
            src="/brand/servora-icon.png"
            alt="SERVORA"
            width={46}
            height={46}
            className="rounded-xl"
          />

          <div>
            <h1 className="text-lg font-bold">SERVORA</h1>
            <p className="text-xs text-gray-400">Back Office  1.0.5</p>
          </div>
        </div>

        <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
          <p className="truncate text-sm font-semibold text-white">
            {profile?.full_name || 'Usuario'}
          </p>

          <div className="mt-1 flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${profile?.approval_role === 'JEO'
              ? 'bg-green-400'
              : profile?.approval_role === 'AI'
                ? 'bg-yellow-400'
                : profile?.approval_role === 'GP'
                  ? 'bg-purple-400'
                  : 'bg-cyan-400'
              }`} />

            <p className="truncate text-xs text-gray-400">
              {roleLabel}
            </p>
          </div>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => {


            const active = (() => {
              // match exacto primero
              if (pathname === item.href) return true;

              // evitar que /admin/guides capture /admin/guides/new
              if (item.href === '/admin/guides') {
                return pathname === '/admin/guides';
              }

              // resto normal
              return pathname.startsWith(item.href);
            })();

            return (
              <button
                key={item.href}
                type="button"
                onClick={() => router.push(item.href)}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${active
                  ? 'bg-cyan-400/15 text-cyan-300 border border-cyan-400/20'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
              >
                <span className="flex h-5 w-5 items-center justify-center">
                  {typeof item.icon === 'string' ? (
                    item.icon
                  ) : (
                    <item.icon size={18} />
                  )}
                </span>
                {item.label}
              </button>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-gray-300 hover:bg-white/5"
        >
          Salir
        </button>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0a0f1c]/90 px-5 py-4 backdrop-blur-xl">
          <div>
            <p className="text-xs text-gray-400">Dashboard Admin</p>
            <h2 className="text-xl font-bold">Back Office Servora</h2>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto lg:hidden">
            {menuItems.map((item) => (
              <button
                key={item.href}
                type="button"
                onClick={() => router.push(item.href)}
                className="whitespace-nowrap rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-300"
              >
                <span className="flex items-center gap-2">
                  {typeof item.icon === 'string' ? (
                    item.icon
                  ) : (
                    <item.icon size={18} />
                  )}
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </header>

        <main className="mx-auto max-w-7xl p-5">
          {children}
        </main>
      </div>
    </div>
  );
}