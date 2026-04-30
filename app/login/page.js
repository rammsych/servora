'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/libs/supabaseClient';
import { Input, ButtonPrimary } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setMessage('Correo o contraseña incorrectos.');
      return;
    }

    router.push('/dashboard');
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0a0f1c] px-5">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-7 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/brand/servora-logo-white2.png"
            alt="SERVORA"
            width={240}
            height={90}
            priority
            className="mb-4"
          />

          <h1 className="text-2xl font-bold text-white">
            Bienvenido
          </h1>

          <p className="text-sm text-gray-400 text-center mt-2">
            Ingresa a Servora 1.0.4 para gestionar tus guías de servicio.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Correo electrónico
            </label>
            <Input
              type="email"
              placeholder="usuario@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Contraseña
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {message && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {message}
            </div>
          )}

          <ButtonPrimary
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </ButtonPrimary>
        </form>

        <p className="text-xs text-gray-500 text-center mt-6">
          SERVORA · Gestión inteligente de guías de servicio
        </p>
      </section>
    </main>
  );
}