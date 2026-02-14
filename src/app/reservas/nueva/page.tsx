"use client";

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { Habitacion } from '@/types';

function NuevaReservaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const habitacionIdParam = searchParams.get('habitacion');

  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    habitacion_id: habitacionIdParam || '',
    cliente: {
      nombre: '',
      apellido: '',
      documento: '',
      tipo_documento: 'DNI',
      telefono: ''
    },
    tipo_estadia: 'Por Hora',
    horas_contratadas: 3,
    observaciones: ''
  });

  useEffect(() => {
    fetchHabitacionesDisponibles();
  }, []);

  const fetchHabitacionesDisponibles = async () => {
    try {
      const response = await fetch('/api/habitaciones?estado=Disponible');
      const result = await response.json();
      if (result.success) {
        setHabitaciones(result.data);
      }
    } catch (error) {
      console.error('Error cargando habitaciones:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/reservas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          habitacion_id: parseInt(formData.habitacion_id),
          horas_contratadas: formData.tipo_estadia === 'Por Hora' ? formData.horas_contratadas : null
        })
      });

      const result = await response.json();

      if (result.success) {
        alert('Check-in realizado exitosamente!');
        router.push('/reservas');
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error creando reserva:', error);
      alert('Error creando reserva');
    } finally {
      setLoading(false);
    }
  };

  const habitacionSeleccionada = habitaciones.find(
    h => h.id === parseInt(formData.habitacion_id)
  );

  const calcularPrecio = () => {
    if (!habitacionSeleccionada) return 0;
    if (formData.tipo_estadia === 'Por Hora') {
      return habitacionSeleccionada.precio_hora * formData.horas_contratadas;
    }
    return habitacionSeleccionada.precio_noche;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/reservas" className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block">
            ← Volver a Reservas
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Nueva Reserva (Check-in)
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selección de Habitación */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              1. Seleccionar Habitación
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Habitación *
                </label>
                <select
                  required
                  value={formData.habitacion_id}
                  onChange={(e) => setFormData({ ...formData, habitacion_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccione una habitación</option>
                  {habitaciones.map((hab) => (
                    <option key={hab.id} value={hab.id}>
                      {hab.numero} - {hab.tipo} (${hab.precio_hora}/hora - ${hab.precio_noche}/noche)
                    </option>
                  ))}
                </select>
              </div>

              {habitacionSeleccionada && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Habitación {habitacionSeleccionada.numero}
                  </h3>
                  <p className="text-sm text-blue-700">
                    Tipo: {habitacionSeleccionada.tipo}
                  </p>
                  <p className="text-sm text-blue-700">
                    Capacidad: {habitacionSeleccionada.capacidad} personas
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Datos del Cliente */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              2. Datos del Cliente
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  required
                  value={formData.cliente.nombre}
                  onChange={(e) => setFormData({
                    ...formData,
                    cliente: { ...formData.cliente, nombre: e.target.value }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apellido *
                </label>
                <input
                  type="text"
                  required
                  value={formData.cliente.apellido}
                  onChange={(e) => setFormData({
                    ...formData,
                    cliente: { ...formData.cliente, apellido: e.target.value }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Documento *
                </label>
                <select
                  required
                  value={formData.cliente.tipo_documento}
                  onChange={(e) => setFormData({
                    ...formData,
                    cliente: { ...formData.cliente, tipo_documento: e.target.value }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="DNI">DNI</option>
                  <option value="Pasaporte">Pasaporte</option>
                  <option value="Cédula">Cédula</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Documento *
                </label>
                <input
                  type="text"
                  required
                  value={formData.cliente.documento}
                  onChange={(e) => setFormData({
                    ...formData,
                    cliente: { ...formData.cliente, documento: e.target.value }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={formData.cliente.telefono}
                  onChange={(e) => setFormData({
                    ...formData,
                    cliente: { ...formData.cliente, telefono: e.target.value }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Tipo de Estadía */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              3. Tipo de Estadía
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo *
                </label>
                <select
                  required
                  value={formData.tipo_estadia}
                  onChange={(e) => setFormData({ ...formData, tipo_estadia: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Por Hora">Por Hora</option>
                  <option value="Por Noche">Por Noche</option>
                </select>
              </div>

              {formData.tipo_estadia === 'Por Hora' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horas Contratadas *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    required
                    value={formData.horas_contratadas}
                    onChange={(e) => setFormData({ ...formData, horas_contratadas: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observaciones
                </label>
                <textarea
                  rows={3}
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Notas adicionales..."
                />
              </div>
            </div>
          </div>

          {/* Resumen */}
          {habitacionSeleccionada && (
            <div className="bg-green-50 rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-green-900 mb-4">
                Resumen de la Reserva
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-green-700">Habitación:</span>
                  <span className="font-semibold text-green-900">
                    {habitacionSeleccionada.numero} - {habitacionSeleccionada.tipo}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Tipo de Estadía:</span>
                  <span className="font-semibold text-green-900">{formData.tipo_estadia}</span>
                </div>
                {formData.tipo_estadia === 'Por Hora' && (
                  <div className="flex justify-between">
                    <span className="text-green-700">Horas:</span>
                    <span className="font-semibold text-green-900">{formData.horas_contratadas}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg pt-2 border-t border-green-200">
                  <span className="text-green-700 font-bold">Total a Pagar:</span>
                  <span className="font-bold text-green-900 text-2xl">
                    ${calcularPrecio().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-4">
            <Link
              href="/reservas"
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition text-center"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              {loading ? 'Procesando...' : 'Confirmar Check-in'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default function NuevaReservaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-slate-400">Cargando...</p>
        </div>
      </div>
    }>
      <NuevaReservaContent />
    </Suspense>
  );
}
