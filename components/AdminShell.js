'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/libs/supabaseClient';
import { getCurrentUserProfile } from '@/libs/userRole';

const menuItems = [
  {
    label: 'Dashboard guías',
    href: '/admin/guides',
    icon: '📄',
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

  useEffect(() => {
    validateAccess();
  }, []);

  const validateAccess = async () => {
    const { user, isAdmin } = await getCurrentUserProfile();

    if (!user) {
      router.replace('/login');
      return;
    }

    if (!isAdmin) {
      router.replace('/dashboard');
      return;
    }

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
            <p className="text-xs text-gray-400">Back Office  1.0.1</p>
          </div>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <button
                key={item.href}
                type="button"
                onClick={() => router.push(item.href)}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                  active
                    ? 'bg-cyan-400/15 text-cyan-300 border border-cyan-400/20'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span>{item.icon}</span>
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
                {item.icon} {item.label}
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