'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/libs/supabaseClient';

export default function AppShell({ children }) {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-gray-100">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0a0f1c]/80 backdrop-blur-xl px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/brand/servora-icon.png"
            alt="SERVORA"
            width={42}
            height={42}
            className="rounded-xl"
            priority
          />

          <div>
            <h1 className="text-xl font-bold tracking-wide bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              SERVORA
            </h1>
            <p className="text-xs text-gray-400">
              Gestión inteligente de guías 1.0.1
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/5"
        >
          Salir
        </button>
      </header>

      <main className="p-5 max-w-6xl mx-auto">
        {children}
      </main>
    </div>
  );
}