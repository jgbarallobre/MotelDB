"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface ReservaExtendida {
  id: number;
  fecha_entrada: string;
  fecha_salida?: string;
  tipo_estadia: string;
  precio_total: number;
  estado: string;
  habitacion_numero: string;
  habitacion_tipo: string;
  cliente_nombre: string;
  cliente_apellido: string;
  cliente_documento: string;
}

export default function ReservasPage() {
  const searchParams = useSearchParams();
  const [reservas, setReservas] = useState<ReservaExtendida[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string>('Activa');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [reservaSeleccionada, setReservaSeleccionada] = useState<number | null>(null);
  const [metodoPago, setMetodoPago] = useState<string>('Efectivo');

  // Check for por_vencer param in URL
  useEffect(() => {
    const porVencer = searchParams.get('por_vencer');
    if (porVencer === 'true') {
      setFiltroEstado('por_vencer');
    }
  }, [searchParams]);

  useEffect(() => {
    fetchReservas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroEstado]);

  const fetchReservas = async () => {
    try {
      let url = '/api/reservas';
      if (filtroEstado === 'por_vencer') {
        url += '?por_vencer=true';
      } else if (filtroEstado) {
        url += `?estado=${filtroEstado}`;
      }
      const response = await fetch(url);
      const result = await response.json();
      if (result.success) {
        setReservas(result.data);
      }
    } catch (error) {
      console.error('Error cargando reservas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!reservaSeleccionada) return;

    try {
      const response = await fetch(`/api/reservas/${reservaSeleccionada}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metodo_pago: metodoPago,
          servicios_adicionales: []
        })
      });

      const result = await response.json();

      if (result.success) {
        alert(`Check-out exitoso! Total: $${result.data.precio_total.toFixed(2)}`);
        setShowCheckoutModal(false);
        setReservaSeleccionada(null);
        fetchReservas();
      } else {
        alert('Error en check-out: ' + result.error);
      }
    } catch (error) {
      console.error('Error en check-out:', error);
      alert('Error realizando check-out');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando reservas...</p>
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
            <div>
              <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block">
                ← Volver al Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">
                Gestión de Reservas
              </h1>
            </div>
            <Link
              href="/reservas/nueva"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              + Nueva Reserva
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFiltroEstado('Activa')}
              className={`px-4 py-2 rounded-lg transition ${
                filtroEstado === 'Activa'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Activas
            </button>
            <button
              onClick={() => setFiltroEstado('Finalizada')}
              className={`px-4 py-2 rounded-lg transition ${
                filtroEstado === 'Finalizada'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Finalizadas
            </button>
            <button
              onClick={() => setFiltroEstado('')}
              className={`px-4 py-2 rounded-lg transition ${
                filtroEstado === ''
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todas
            </button>
          </div>
        </div>

        {/* Lista de Reservas */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
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
                    Entrada
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reservas.map((reserva) => (
                  <tr key={reserva.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{reserva.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-semibold">{reserva.habitacion_numero}</div>
                        <div className="text-gray-500 text-xs">{reserva.habitacion_tipo}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div>{reserva.cliente_nombre} {reserva.cliente_apellido}</div>
                        <div className="text-gray-500 text-xs">{reserva.cliente_documento}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(reserva.fecha_entrada).toLocaleString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reserva.tipo_estadia}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      ${reserva.precio_total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          reserva.estado === 'Activa'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {reserva.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {reserva.estado === 'Activa' && (
                        <button
                          onClick={() => {
                            setReservaSeleccionada(reserva.id);
                            setShowCheckoutModal(true);
                          }}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
                        >
                          Check-out
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {reservas.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow mt-6">
            <p className="text-gray-500 text-lg">No hay reservas {filtroEstado.toLowerCase()}</p>
          </div>
        )}
      </main>

      {/* Modal de Check-out */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Realizar Check-out
            </h2>
            <p className="text-gray-600 mb-6">
              Reserva #{reservaSeleccionada}
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Método de Pago
              </label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Tarjeta">Tarjeta</option>
                <option value="Transferencia">Transferencia</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCheckoutModal(false);
                  setReservaSeleccionada(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleCheckout}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Confirmar Check-out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
