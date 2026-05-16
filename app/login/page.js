'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/libs/supabaseClient';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [indicators, setIndicators] = useState({
    dolar: null,
    uf: null,
    loading: true,
  });

  useEffect(() => {
    const loadIndicators = async () => {
      try {
        const response = await fetch('https://mindicador.cl/api', {
          cache: 'no-store',
        });

        const data = await response.json();

        setIndicators({
          dolar: data?.dolar?.valor ?? null,
          uf: data?.uf?.valor ?? null,
          loading: false,
        });
      } catch (error) {
        console.error('Error cargando indicadores:', error);

        setIndicators({
          dolar: null,
          uf: null,
          loading: false,
        });
      }
    };

    loadIndicators();
  }, []);

  const formatCLP = (value) => {
    if (!value) return '--';

    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { data: loginData, error: loginError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (loginError) {
      setMessage('No fue posible iniciar sesión. Revisa tus datos.');
      setLoading(false);
      return;
    }

    const userId = loginData?.user?.id;

    if (!userId) {
      setMessage('No se pudo obtener el usuario.');
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('email', email)
      .maybeSingle();

    if (profileError) {
      console.error(profileError);
    }

    if (profile?.role === 'admin' || profile?.role === 'chief_admin') {
      router.push('/admin/kpi');
    } else {
      router.push('/dashboard');
    }

    setLoading(false);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950">
      <Image
        src="/fondo.png"
        alt="Fondo SERVORA"
        fill
        priority
        className="object-cover"
      />

      <div className="absolute inset-0 bg-slate-950/35" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/25 via-slate-900/10 to-slate-950/35" />

      <section className="relative z-10 flex min-h-screen justify-start px-6 pt-6 md:pt-10 overflow-y-auto">
        <div className="w-full max-w-[385px]">
          <div className="flex flex-col items-center text-center backdrop-blur-[1px]">
            <div className="relative mb-1 h-[150px] w-[520px] sm:h-[190px] sm:w-[680px]">
              <Image
                src="/logo-servora.png"
                alt="SERVORA"
                fill
                priority
                className="
                  object-contain
                  drop-shadow-[0_12px_40px_rgba(0,0,0,0.55)]
                  brightness-110
                "
              />
            </div>

            <p className="mt-[-48px] text-[13px] font-light tracking-[0.22em] text-white/80">
              Backoffice Empresarial
            </p>
          </div>

          <form onSubmit={handleLogin} className="mt-8 space-y-6">
            <div>
              <label className="mb-2 block text-[15px] font-semibold text-white">
                Correo
              </label>

              <input
                type="email"
                required
                placeholder="Ingresa tu correo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
                className="login-bank-input"
              />



            </div>

            <div>
              <label className="mb-2 block text-[15px] font-semibold text-white">
                Clave
              </label>

              <div className="login-bank-input-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Ingresa tu clave"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="login-bank-input-password"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="ml-3 flex h-10 w-10 items-center justify-center text-white/85 hover:text-white"
                  aria-label="Mostrar clave"
                >
                  {showPassword ? (
                    <EyeOff size={22} strokeWidth={1.7} />
                  ) : (
                    <Eye size={22} strokeWidth={1.7} />
                  )}
                </button>
              </div>



            </div>

            {message ? (
              <div className="rounded-2xl bg-red-600/80 px-4 py-3 text-sm font-medium text-white shadow-lg backdrop-blur">
                {message}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="
                mt-8 w-full rounded-full bg-white py-5
                text-[20px] font-bold text-[#0b2540]
                shadow-2xl transition
                hover:bg-white/95 active:scale-[0.99]
                disabled:opacity-60
              "
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <div className="mt-10 pb-10 text-white drop-shadow-lg">
            <p className="text-[18px] sm:text-[22px] font-light">Observado</p>

            <div className="mt-4 grid grid-cols-2 gap-8">
              <div>
                <p className="text-[18px] sm:text-[22px] font-light">
                  USD: <span className="font-bold">
                    {indicators.loading ? '...' : formatCLP(indicators.dolar)}
                  </span>
                </p>
                <div className="mt-2 border-b border-dashed border-white/80" />
              </div>

              <div>
                <p className="text-[18px] sm:text-[22px] font-light">
                  UF: <span className="font-bold">
                    {indicators.loading ? '...' : formatCLP(indicators.uf)}
                  </span>
                </p>
                <div className="mt-2 border-b border-dashed border-white/80" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="pointer-events-none absolute bottom-0 left-1/2 z-20 h-16 w-52 -translate-x-1/2 translate-y-8 rounded-t-[70px] bg-white shadow-2xl">
        <div className="mt-5 flex justify-center text-slate-500">
          <span className="text-4xl leading-none">⌃</span>
        </div>
      </div>
    </main>
  );
}