'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/libs/supabaseClient';
import { getCurrentUserProfile } from '@/libs/userRole';
import {
  CalendarDays,
  FilePlus,
  FileText,
  Files,
  Users,
  BriefcaseBusiness,
  Building2,
  BarChart3,
  LayoutDashboard,
  ClipboardPenLine,
} from 'lucide-react';



const menuItems = [
  {
    section: 'Operaciones',
    items: [
      {
        label: "KPI",
        href: "/admin/kpi",
        icon: BarChart3,
      },
      {
        label: 'Dashboard guías',
        href: '/admin/guides',
        icon: LayoutDashboard,
      },
      {
        label: "Generar guía",
        href: "/admin/guides/new",
        icon: ClipboardPenLine,
      },
      {
        label: 'Programación mensual',
        href: '/admin/schedule',
        icon: CalendarDays,
      },
      {
        label: 'Cotizaciones',
        icon: FileText,
        children: [
          {
            label: 'Cotizaciones emitidas',
            href: '/admin/quotations',
            icon: Files,
          },
          {
            label: 'Generar cotización',
            href: '/admin/quotations/new',
            icon: FilePlus,
          },
          {
            label: 'Servicios',
            href: '/admin/quotations/services',
            icon: BriefcaseBusiness,
          },
        ],
      },
    ],
  },
  {
    section: 'Gestión',
    items: [
      {
        label: 'Empresas',
        href: '/admin/companies',
        icon: Building2,
      },
      {
        label: 'Clientes',
        href: '/admin/quotations/clients',
        icon: Users,
      },
      {
        label: 'Proyectos',
        href: '/admin/projects',
        icon: BriefcaseBusiness,
      },
    ],
  },
  {
    section: 'Administración',
    items: [
      {
        label: 'Usuarios',
        href: '/admin/users',
        icon: Users,
      },
      {
        label: 'Configuraciones',
        href: '/admin/settings',
        icon: '⚙️',
      },
    ],
  },
];
















export default function AdminShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const [checkingAccess, setCheckingAccess] = useState(true);
  const [profile, setProfile] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const [openMobileMenu, setOpenMobileMenu] = useState(null);

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
            <p className="text-xs text-gray-400">Back Office  1.0.6</p>
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

        <nav className="space-y-4">
          {menuItems.map((section) => (
            <div key={section.section} className="space-y-2">
              <p className="px-4 pt-3 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
                {section.section}
              </p>

              {section.items.map((item) => {


                const active = (() => {
                  if (!item.href) return false;

                  if (pathname === item.href) return true;

                  if (item.href === '/admin/guides') {
                    return pathname === '/admin/guides';
                  }

                  return pathname.startsWith(item.href);
                })();

                return (
                  <div key={item.href || item.label}>
                    <button
                      type="button"
                      onClick={() => {
                        if (item.children) {
                          setOpenMenu(openMenu === item.label ? null : item.label);
                          return;
                        }

                        if (item.href) {
                          router.push(item.href);
                        }
                      }}
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

                      <span className="flex-1">{item.label}</span>

                      {item.children && (
                        <span className="flex items-center gap-2">
                          <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                            {item.children.length}
                          </span>

                          <span
                            className={`text-sm text-cyan-300 transition-transform ${openMenu === item.label ? 'rotate-90' : ''
                              }`}
                          >
                            ›
                          </span>
                        </span>
                      )}


                    </button>

                    {item.children && openMenu === item.label && (
                      <div className="ml-8 mt-1 space-y-1 border-l border-white/10 pl-3">
                        {item.children.map((child) => {
                          const childActive = pathname === child.href;

                          return (
                            <button
                              key={child.href}
                              type="button"
                              onClick={() => router.push(child.href)}
                              className={`block w-full rounded-xl px-3 py-2 text-left text-xs font-semibold transition ${childActive
                                ? 'bg-cyan-400/10 text-cyan-300'
                                : 'text-gray-500 hover:bg-white/5 hover:text-white'
                                }`}
                            >
                              {child.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );




              })}

            </div>
          ))}
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






          <div className="mt-4 lg:hidden">
            <div className="relative rounded-[2rem] border border-white/10 bg-white/[0.04] p-3 shadow-2xl backdrop-blur-xl">
              <div className="absolute -top-2 left-1/2 h-1.5 w-16 -translate-x-1/2 rounded-full bg-cyan-300/40" />

              <div className="flex gap-3 overflow-x-auto pb-1">
                {menuItems.flatMap((section) => section.items).map((item) => {
                  const isOpen = openMobileMenu === item.label;

                  const isActive = item.href
                    ? pathname === item.href || pathname.startsWith(item.href)
                    : item.children?.some((child) => pathname === child.href);

                  return (
                    <div key={item.href || item.label} className="flex shrink-0 items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (item.children) {
                            setOpenMobileMenu(isOpen ? null : item.label);
                            return;
                          }

                          if (item.href) {
                            router.push(item.href);
                          }
                        }}
                        className="min-w-[88px] shrink-0"
                      >
                        <div
                          className={`relative mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg transition ${isActive
                            ? 'bg-cyan-400 text-[#0a0f1c]'
                            : 'bg-white text-slate-700'
                            }`}
                        >
                          {typeof item.icon === 'string' ? (
                            <span className="text-xl">{item.icon}</span>
                          ) : (
                            <item.icon size={22} />
                          )}

                          {item.children && (
                            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-400 text-xs font-black text-[#0a0f1c] shadow-lg">
                              {isOpen ? '‹' : '›'}
                            </span>
                          )}
                        </div>

                        <span
                          className={`block max-w-[86px] truncate text-center text-[11px] font-bold ${isActive ? 'text-cyan-300' : 'text-gray-300'
                            }`}
                        >
                          {item.label}
                        </span>
                      </button>

                      {item.children && isOpen && (
                        <div className="flex shrink-0 items-center gap-3 border-l border-white/10 pl-3">
                          {item.children.map((child) => {
                            const childActive = pathname === child.href;

                            return (
                              <button
                                key={child.href}
                                type="button"
                                onClick={() => router.push(child.href)}
                                className="min-w-[92px] shrink-0"
                              >
                                <div
                                  className={`mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg transition ${childActive
                                    ? 'bg-cyan-400 text-[#0a0f1c]'
                                    : 'bg-white/[0.08] text-gray-300'
                                    }`}
                                >
                                  {child.icon ? (
                                    <child.icon size={18} />
                                  ) : (
                                    <span className="text-sm">•</span>
                                  )}
                                </div>

                                <span
                                  className={`block max-w-[90px] truncate text-center text-[10px] font-bold ${childActive ? 'text-cyan-300' : 'text-gray-400'
                                    }`}
                                >
                                  {child.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pointer-events-none absolute right-0 top-0 h-full w-10 rounded-r-[2rem] bg-gradient-to-l from-[#0a0f1c] to-transparent" />
            </div>

            <p className="mt-2 text-center text-[11px] text-gray-500">
              Desliza el menú para ver más opciones →
            </p>
          </div>






        </header>

        <main className="mx-auto max-w-7xl p-5">
          {children}
        </main>
      </div>
    </div>
  );
}