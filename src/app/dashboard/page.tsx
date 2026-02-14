'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface User {
  id: number;
  username: string;
  nombre: string;
  rol: string;
}

interface MenuItem {
  label: string;
  icon: string;
  path: string;
  color: string;
}

interface MenuSectionProps {
  title: string;
  items: MenuItem[];
  icon: string;
}

interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  trend: string;
  trendUp: boolean | null;
  gradient: string;
}

interface ActivityItemProps {
  icon: string;
  title: string;
  description: string;
  time: string;
}

const maestroMenu: MenuItem[] = [
  { label: 'Habitaciones', icon: '📋', path: '/habitaciones', color: 'bg-blue-500' },
  { label: 'Tipos de Estadía', icon: '🏨', path: '/tipos-estadia', color: 'bg-indigo-500' },
  { label: 'Días / Jornadas', icon: '⏰', path: '/jornadas', color: 'bg-violet-500' },
  { label: 'Usuarios y Permisos', icon: '👥', path: '/usuarios', color: 'bg-purple-500' },
  { label: 'Configuración', icon: '⚙️', path: '/configuracion', color: 'bg-gray-500' },
  { label: 'Impresoras', icon: '🖨️', path: '/impresoras', color: 'bg-zinc-500' },
  { label: 'Clientes / Huéspedes', icon: '👤', path: '/clientes', color: 'bg-cyan-500' },
  { label: 'Artículos', icon: '📦', path: '/articulos', color: 'bg-amber-500' },
  { label: 'Departamentos', icon: '🏢', path: '/departamentos', color: 'bg-teal-500' },
];

const lobbyMenu: MenuItem[] = [
  { label: 'Ir al Lobby', icon: '🏨', path: '/lobby', color: 'bg-green-500' },
  { label: 'Reservas', icon: '📅', path: '/reservas', color: 'bg-emerald-500' },
  { label: 'Nueva Estadía', icon: '✅', path: '/reservas/nueva', color: 'bg-lime-500' },
];

const mantenimientoMenu: MenuItem[] = [
  { label: 'Usuarios', icon: '👥', path: '/usuarios', color: 'bg-rose-500' },
  { label: 'Perfiles', icon: '🔐', path: '/perfiles', color: 'bg-pink-500' },
  { label: 'Configuraciones', icon: '⚙️', path: '/configuracion', color: 'bg-orange-500' },
];

function MenuSection({ title, items, icon }: MenuSectionProps) {
  const router = useRouter();
  
  return (
    <div className="mb-6">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-3">
        {icon} {title}
      </h3>
      <div className="space-y-1">
        {items.map((item) => (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white transition-all duration-200 group"
          >
            <span className={`w-8 h-8 rounded-lg ${item.color} flex items-center justify-center text-sm shadow-lg group-hover:scale-110 transition-transform`}>
              {item.icon}
            </span>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, trendUp, gradient }: StatCardProps) {
  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5 hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        {trendUp !== null && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            trendUp 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-red-500/20 text-red-400'
          }`}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>
      <h3 className="text-slate-400 text-sm font-medium mb-1">{title}</h3>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function ActivityItem({ icon, title, description, time }: ActivityItemProps) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors">
      <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-lg">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate">{title}</p>
        <p className="text-slate-400 text-sm truncate">{description}</p>
      </div>
      <span className="text-slate-500 text-xs whitespace-nowrap">{time}</span>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    }
    return null;
  });
  const [dbConnected, setDbConnected] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const checkDbConnection = async () => {
      try {
        const response = await fetch('/api/db-status');
        const result = await response.json();
        setDbConnected(result.success);
      } catch (err) {
        setDbConnected(false);
      }
    };
    checkDbConnection();
  }, []);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-full mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-xl">🏨</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">MotelDB</h1>
                <p className="text-xs text-slate-400">Sistema de Gestión</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Database Status */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border ${
              dbConnected 
                ? 'bg-green-500/20 border-green-500/30' 
                : 'bg-red-500/20 border-red-500/30'
            }`}>
              <span className={`w-2 h-2 rounded-full ${dbConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></span>
              <span className={dbConnected ? 'text-green-300' : 'text-red-300'}>
                {dbConnected ? 'Base de datos conectada' : 'Sin conexión'}
              </span>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-3 bg-white/10 rounded-full px-4 py-1.5">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {user.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-white">{user.nombre}</p>
                <p className="text-xs text-slate-400">{user.rol}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-300 hover:text-red-200 transition-all"
              title="Cerrar sesión"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 overflow-hidden`}>
          <div className="w-72 h-[calc(100vh-64px)] bg-slate-900/50 backdrop-blur-xl border-r border-white/10 p-4 overflow-y-auto">
            <MenuSection title="Maestro" icon="📁" items={maestroMenu} />
            <MenuSection title="Lobby" icon="🏠" items={lobbyMenu} />
            <MenuSection title="Mantenimiento" icon="🔧" items={mantenimientoMenu} />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-2xl p-6 mb-6 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-2">
              ¡Bienvenido de nuevo, {user.nombre}! 👋
            </h2>
            <p className="text-slate-400">
              Aquí está el resumen de tu motel hoy
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Habitaciones Disponibles"
              value="12"
              icon="🛏️"
              trend="+2 desde ayer"
              trendUp={true}
              gradient="from-green-500 to-emerald-600"
            />
            <StatCard
              title="Habitaciones Ocupadas"
              value="8"
              icon="🔒"
              trend="65% ocupación"
              trendUp={null}
              gradient="from-blue-500 to-cyan-600"
            />
            <StatCard
              title="Reservas Hoy"
              value="5"
              icon="📅"
              trend="+3 nuevas"
              trendUp={true}
              gradient="from-purple-500 to-violet-600"
            />
            <StatCard
              title="Ingresos del Día"
              value="$2,450"
              icon="💰"
              trend="+12% vs ayer"
              trendUp={true}
              gradient="from-amber-500 to-orange-600"
            />
          </div>

          {/* Recent Activity */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Actividad Reciente
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <ActivityItem
                  icon="✅"
                  title="Check-in registrado"
                  description="Habitación 101 - Cliente: Juan Pérez"
                  time="Hace 5 minutos"
                />
                <ActivityItem
                  icon="💰"
                  title="Pago recibido"
                  description="Habitación 205 - $450.00"
                  time="Hace 15 minutos"
                />
                <ActivityItem
                  icon="🧹"
                  title="Limpieza completada"
                  description="Habitación 103 lista para出租"
                  time="Hace 30 minutos"
                />
                <ActivityItem
                  icon="📅"
                  title="Nueva reserva"
                  description="Habitación 302 - María García"
                  time="Hace 1 hora"
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
