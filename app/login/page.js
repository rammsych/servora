'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/libs/supabaseClient';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('admin@servora.cl');
  const [password, setPassword] = useState('Admin123456');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage('Credenciales inválidas o usuario no confirmado.');
      setLoading(false);
      return;
    }

    const userId = data.user.id;

    const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role, full_name, status')
            .eq('id', userId)
            .maybeSingle();

    if (profileError || !profile) {
      setErrorMessage('No se encontró el perfil del usuario.');
      setLoading(false);
      return;
    }

    if (profile.status !== 'active') {
      setErrorMessage('Usuario inactivo. Contacta al administrador.');
      setLoading(false);
      return;
    }

    router.push('/dashboard');
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8"
      >
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">Servora</h1>
          <p className="text-sm text-slate-500 mt-2">
            Gestión inteligente de guías de servicio
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
            {errorMessage}
          </div>
        )}

        <label className="block mb-4">
          <span className="block text-sm font-medium text-slate-700 mb-1">
            Correo
          </span>
          <input
            type="email"
            className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className="block mb-6">
          <span className="block text-sm font-medium text-slate-700 mb-1">
            Contraseña
          </span>
          <input
            type="password"
            className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-lg py-3 transition"
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </main>
  );
}