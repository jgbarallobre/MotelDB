'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface User {
  id: number;
  username: string;
  nombre: string;
  rol: string;
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
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Sistema de Gestión de Motel</h1>
            <p className="text-blue-100 text-sm">Bienvenido, {user.nombre} ({user.rol})</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            Salir
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Menú Maestro */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800 ml-3">Maestro</h2>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => router.push('/habitaciones')}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors text-gray-700 hover:text-blue-600 font-medium"
              >
                📋 Habitaciones
              </button>
              <button
                onClick={() => router.push('/estadias')}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors text-gray-700 hover:text-blue-600 font-medium"
              >
                🏨 Estadías
              </button>
              <button
                onClick={() => router.push('/personal-limpieza')}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors text-gray-700 hover:text-blue-600 font-medium"
              >
                🧹 Personal de Limpieza
              </button>
              <button
                onClick={() => router.push('/incidencias')}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors text-gray-700 hover:text-blue-600 font-medium"
              >
                ⚠️ Incidencias
              </button>
              <button
                onClick={() => router.push('/articulos')}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors text-gray-700 hover:text-blue-600 font-medium"
              >
                📦 Artículos
              </button>
              <button
                onClick={() => router.push('/departamentos')}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors text-gray-700 hover:text-blue-600 font-medium"
              >
                🏢 Departamentos
              </button>
            </div>
          </div>

          {/* Menú Lobby */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800 ml-3">Lobby</h2>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => router.push('/lobby')}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-green-50 transition-colors text-gray-700 hover:text-green-600 font-medium"
              >
                🏨 Ir al Lobby
              </button>
              <button
                onClick={() => router.push('/reservas')}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-green-50 transition-colors text-gray-700 hover:text-green-600 font-medium"
              >
                📅 Reservas
              </button>
              <button
                onClick={() => router.push('/check-in')}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-green-50 transition-colors text-gray-700 hover:text-green-600 font-medium"
              >
                ✅ Check-in
              </button>
              <button
                onClick={() => router.push('/check-out')}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-green-50 transition-colors text-gray-700 hover:text-green-600 font-medium"
              >
                🚪 Check-out
              </button>
            </div>
          </div>

          {/* Menú Mantenimiento */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800 ml-3">Mantenimiento</h2>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => router.push('/usuarios')}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-purple-50 transition-colors text-gray-700 hover:text-purple-600 font-medium"
              >
                👥 Usuarios
              </button>
              <button
                onClick={() => router.push('/perfiles')}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-purple-50 transition-colors text-gray-700 hover:text-purple-600 font-medium"
              >
                🔐 Perfiles de Usuarios
              </button>
              <button
                onClick={() => router.push('/configuracion')}
                className="w-full text-left px-4 py-3 rounded-lg hover:bg-purple-50 transition-colors text-gray-700 hover:text-purple-600 font-medium"
              >
                ⚙️ Configuraciones Generales
              </button>
            </div>
          </div>

        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-500 text-sm font-medium">Habitaciones Disponibles</div>
            <div className="text-3xl font-bold text-green-600 mt-2">12</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-500 text-sm font-medium">Habitaciones Ocupadas</div>
            <div className="text-3xl font-bold text-blue-600 mt-2">8</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-500 text-sm font-medium">Reservas Hoy</div>
            <div className="text-3xl font-bold text-purple-600 mt-2">5</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-500 text-sm font-medium">Ingresos del Día</div>
            <div className="text-3xl font-bold text-yellow-600 mt-2">$2,450</div>
          </div>
        </div>
      </main>
    </div>
  );
}
