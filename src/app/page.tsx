"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface DashboardData {
  habitaciones_disponibles: number;
  habitaciones_ocupadas: number;
  reservas_activas: number;
  ingresos_hoy: number;
  ingresos_mes: number;
  habitaciones_por_estado: { estado: string; cantidad: number }[];
  ultimas_reservas: any[];
}

interface Habitacion {
  id: number;
  numero: string;
  tipo: string;
  precio_hora: number;
  estado: string;
}

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
    fetchHabitaciones();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await fetch('/api/dashboard');
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHabitaciones = async () => {
    try {
      const response = await fetch('/api/habitaciones');
      const result = await response.json();
      if (result.success) {
        setHabitaciones(result.data);
      }
    } catch (error) {
      console.error('Error cargando habitaciones:', error);
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Disponible':
        return 'bg-green-500';
      case 'Ocupada':
        return 'bg-red-500';
      case 'Mantenimiento':
        return 'bg-yellow-500';
      case 'Limpieza':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getEstadoEmoji = (estado: string) => {
    switch (estado) {
      case 'Disponible':
        return '✅';
      case 'Ocupada':
        return '🔴';
      case 'Mantenimiento':
        return '🔧';
      case 'Limpieza':
        return '🧹';
      default:
        return '⚪';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">
              🏨 Lobby - Motel
            </h1>
            <div className="flex gap-3">
              <Link
                href="/habitaciones"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Gestión
              </Link>
              <Link
                href="/reservas"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Reservas
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-green-600/20 backdrop-blur-sm border border-green-500/30 rounded-lg p-4">
            <div className="text-green-400 text-sm font-medium">Disponibles</div>
            <div className="text-3xl font-bold text-white mt-1">
              {data?.habitaciones_disponibles || 0}
            </div>
          </div>
          <div className="bg-red-600/20 backdrop-blur-sm border border-red-500/30 rounded-lg p-4">
            <div className="text-red-400 text-sm font-medium">Ocupadas</div>
            <div className="text-3xl font-bold text-white mt-1">
              {data?.habitaciones_ocupadas || 0}
            </div>
          </div>
          <div className="bg-blue-600/20 backdrop-blur-sm border border-blue-500/30 rounded-lg p-4">
            <div className="text-blue-400 text-sm font-medium">Reservas</div>
            <div className="text-3xl font-bold text-white mt-1">
              {data?.reservas_activas || 0}
            </div>
          </div>
          <div className="bg-purple-600/20 backdrop-blur-sm border border-purple-500/30 rounded-lg p-4">
            <div className="text-purple-400 text-sm font-medium">Ingresos Hoy</div>
            <div className="text-2xl font-bold text-white mt-1">
              ${data?.ingresos_hoy.toFixed(2) || '0.00'}
            </div>
          </div>
        </div>

        {/* Habitaciones Grid con Scroll */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Habitaciones</h2>
          <div className="max-h-[calc(100vh-300px)] overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {habitaciones.map((habitacion) => (
                <Link
                  key={habitacion.id}
                  href={habitacion.estado === 'Disponible' ? `/reservas/nueva?habitacion=${habitacion.id}` : '#'}
                  className={`
                    aspect-square rounded-lg p-4 flex flex-col items-center justify-center
                    transition-all duration-200 border-2
                    ${habitacion.estado === 'Disponible'
                      ? 'bg-green-600/20 border-green-500/50 hover:bg-green-600/30 hover:scale-105 cursor-pointer'
                      : habitacion.estado === 'Ocupada'
                      ? 'bg-red-600/20 border-red-500/50 cursor-not-allowed'
                      : habitacion.estado === 'Limpieza'
                      ? 'bg-blue-600/20 border-blue-500/50 cursor-not-allowed'
                      : 'bg-yellow-600/20 border-yellow-500/50 cursor-not-allowed'
                    }
                  `}
                >
                  <div className="text-4xl mb-2">{getEstadoEmoji(habitacion.estado)}</div>
                  <div className="text-2xl font-bold text-white">{habitacion.numero}</div>
                  <div className="text-xs text-gray-300 mt-1">{habitacion.tipo}</div>
                  <div className="text-sm font-semibold text-white mt-2">
                    ${habitacion.precio_hora}/hr
                  </div>
                  <div className={`
                    text-xs px-2 py-1 rounded-full mt-2
                    ${habitacion.estado === 'Disponible' ? 'bg-green-500/30 text-green-200' : ''}
                    ${habitacion.estado === 'Ocupada' ? 'bg-red-500/30 text-red-200' : ''}
                    ${habitacion.estado === 'Limpieza' ? 'bg-blue-500/30 text-blue-200' : ''}
                    ${habitacion.estado === 'Mantenimiento' ? 'bg-yellow-500/30 text-yellow-200' : ''}
                  `}>
                    {habitacion.estado}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(75, 85, 99, 0.8);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(107, 114, 128, 0.9);
        }
      `}</style>
    </div>
  );
}
