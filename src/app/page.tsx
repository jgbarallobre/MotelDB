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

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              🏨 Sistema de Gestión de Motel
            </h1>
            <div className="flex gap-3">
              <Link
                href="/habitaciones"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Habitaciones
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Disponibles</p>
                <p className="text-3xl font-bold text-green-600">
                  {data?.habitaciones_disponibles || 0}
                </p>
              </div>
              <div className="text-4xl">🟢</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ocupadas</p>
                <p className="text-3xl font-bold text-red-600">
                  {data?.habitaciones_ocupadas || 0}
                </p>
              </div>
              <div className="text-4xl">🔴</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Reservas Activas</p>
                <p className="text-3xl font-bold text-blue-600">
                  {data?.reservas_activas || 0}
                </p>
              </div>
              <div className="text-4xl">📋</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ingresos Hoy</p>
                <p className="text-3xl font-bold text-purple-600">
                  ${data?.ingresos_hoy.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Habitaciones por Estado */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Estado de Habitaciones
            </h2>
            <div className="space-y-3">
              {data?.habitaciones_por_estado.map((item) => (
                <div key={item.estado} className="flex justify-between items-center">
                  <span className="text-gray-700">{item.estado}</span>
                  <span className="px-3 py-1 bg-gray-100 rounded-full font-semibold">
                    {item.cantidad}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Ingresos del Mes */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Resumen Financiero
            </h2>
            <div className="space-y-4">
              <div className="border-b pb-3">
                <p className="text-sm text-gray-600">Ingresos de Hoy</p>
                <p className="text-2xl font-bold text-green-600">
                  ${data?.ingresos_hoy.toFixed(2) || '0.00'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Ingresos del Mes</p>
                <p className="text-2xl font-bold text-blue-600">
                  ${data?.ingresos_mes.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Últimas Reservas */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Últimas Reservas
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Habitación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fecha Entrada
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data?.ultimas_reservas.map((reserva) => (
                  <tr key={reserva.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      #{reserva.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reserva.habitacion_numero}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reserva.cliente_nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(reserva.fecha_entrada).toLocaleString('es-ES')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        reserva.estado === 'Activa'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {reserva.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Link
            href="/reservas/nueva"
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6 hover:from-blue-600 hover:to-blue-700 transition shadow-lg"
          >
            <div className="text-4xl mb-2">➕</div>
            <h3 className="text-xl font-bold">Nueva Reserva</h3>
            <p className="text-blue-100 mt-1">Realizar check-in</p>
          </Link>

          <Link
            href="/habitaciones"
            className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-6 hover:from-green-600 hover:to-green-700 transition shadow-lg"
          >
            <div className="text-4xl mb-2">🏠</div>
            <h3 className="text-xl font-bold">Ver Habitaciones</h3>
            <p className="text-green-100 mt-1">Gestionar habitaciones</p>
          </Link>

          <Link
            href="/reportes"
            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-6 hover:from-purple-600 hover:to-purple-700 transition shadow-lg"
          >
            <div className="text-4xl mb-2">📊</div>
            <h3 className="text-xl font-bold">Reportes</h3>
            <p className="text-purple-100 mt-1">Ver estadísticas</p>
          </Link>
        </div>
      </main>
    </div>
  );
}
