'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Habitacion } from '@/types';

interface FormData {
  numero: string;
  descripcion: string;
  activa: boolean;
}

export default function HabitacionesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>({
    numero: '',
    descripcion: '',
    activa: true
  });
  const [filtroActiva, setFiltroActiva] = useState<string>('');
  const [filtroEstado, setFiltroEstado] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Leer el parámetro de estado de la URL
  useEffect(() => {
    const estadoParam = searchParams.get('estado');
    if (estadoParam) {
      setFiltroEstado(estadoParam);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchHabitaciones();
  }, [filtroActiva, filtroEstado]);

  const fetchHabitaciones = async () => {
    try {
      let url = '/api/habitaciones';
      const params = new URLSearchParams();
      if (filtroActiva !== '') {
        params.append('activa', filtroActiva);
      }
      if (filtroEstado !== '') {
        params.append('estado', filtroEstado);
      }
      if (params.toString()) {
        url += '?' + params.toString();
      }
      const response = await fetch(url);
      const result = await response.json();
      if (result.success) {
        setHabitaciones(result.data);
      }
    } catch (error) {
      console.error('Error cargando habitaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId 
        ? `/api/habitaciones/${editingId}`
        : '/api/habitaciones';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero: formData.numero,
          descripcion: formData.descripcion,
          activa: formData.activa,
          // Campos requeridos por la API - valores por defecto
          tipo: 'Standard',
          precio_hora: 50,
          precio_noche: 150,
          capacidad: 2,
          estado: 'Disponible'
        })
      });

      const result = await response.json();

      if (result.success) {
        setShowModal(false);
        setEditingId(null);
        setFormData({ numero: '', descripcion: '', activa: true });
        fetchHabitaciones();
      } else {
        setError(result.error || 'Error al guardar');
      }
    } catch (error) {
      setError('Error al guardar habitación');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (habitacion: Habitacion) => {
    setEditingId(habitacion.id);
    setFormData({
      numero: habitacion.numero,
      descripcion: habitacion.descripcion || '',
      activa: habitacion.activa !== false
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta habitación?')) return;

    try {
      const response = await fetch(`/api/habitaciones/${id}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      if (result.success) {
        fetchHabitaciones();
      } else {
        alert(result.error || 'Error al eliminar');
      }
    } catch (error) {
      console.error('Error eliminando habitación:', error);
    }
  };

  const toggleActiva = async (habitacion: Habitacion) => {
    try {
      const nuevaActiva = !habitacion.activa;
      const response = await fetch(`/api/habitaciones/${habitacion.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activa: nuevaActiva })
      });

      if (response.ok) {
        fetchHabitaciones();
      }
    } catch (error) {
      console.error('Error cambiando estado:', error);
    }
  };

  const openNewModal = () => {
    setEditingId(null);
    setFormData({ numero: '', descripcion: '', activa: true });
    setError('');
    setShowModal(true);
  };

  const filtros = [
    { value: '', label: 'Todas' },
    { value: 'true', label: 'Activas' },
    { value: 'false', label: 'Inactivas' },
  ];

  const filtrosEstado = [
    { value: '', label: 'Todos los Estados' },
    { value: 'Disponible', label: '🛏️ Disponible' },
    { value: 'Ocupada', label: '🔒 Ocupada' },
    { value: 'Limpieza', label: '🧹 Limpieza' },
    { value: 'Mantenimiento', label: '🔧 Mantenimiento' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-slate-400">Cargando habitaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <Link 
                href="/dashboard" 
                className="text-blue-400 hover:text-blue-300 text-sm mb-2 inline-flex items-center gap-1 transition-colors"
              >
                ← Volver al Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <span className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl">
                  🏠
                </span>
                Maestro de Habitaciones
              </h1>
              <p className="text-slate-400 mt-1">Gestiona las habitaciones del motel</p>
            </div>
            <button
              onClick={openNewModal}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              <span>+</span> Nueva Habitación
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4 mb-6">
          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-slate-400 text-sm mr-2">Estado:</span>
            {filtrosEstado.map((filtro) => (
              <button
                key={filtro.value}
                onClick={() => setFiltroEstado(filtro.value)}
                className={`px-4 py-2 rounded-xl transition-all duration-200 font-medium ${
                  filtroEstado === filtro.value
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                {filtro.label}
              </button>
            ))}
            <span className="mx-2 text-slate-600">|</span>
            <span className="text-slate-400 text-sm mr-2">Activa:</span>
            {filtros.map((filtro) => (
              <button
                key={filtro.value}
                onClick={() => setFiltroActiva(filtro.value)}
                className={`px-4 py-2 rounded-xl transition-all duration-200 font-medium ${
                  filtroActiva === filtro.value
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                {filtro.label}
              </button>
            ))}
            <span className="ml-auto text-slate-400 text-sm">
              Total: {habitaciones.length} habitaciones
            </span>
          </div>
        </div>

        {/* Tabla de Habitaciones */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Número
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {habitaciones.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="text-slate-400">
                        <span className="text-4xl block mb-2">🏠</span>
                        No hay habitaciones registradas
                      </div>
                    </td>
                  </tr>
                ) : (
                  habitaciones.map((habitacion) => (
                    <tr 
                      key={habitacion.id} 
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xl font-bold text-white">
                          #{habitacion.numero}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-300">
                          {habitacion.descripcion || 'Sin descripción'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => toggleActiva(habitacion)}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all ${
                            habitacion.activa !== false
                              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                              : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${
                            habitacion.activa !== false ? 'bg-green-400' : 'bg-red-400'
                          }`}></span>
                          {habitacion.activa !== false ? 'Activa' : 'Inactiva'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(habitacion)}
                            className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                            title="Editar"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(habitacion.id)}
                            className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                            title="Eliminar"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-white/10 w-full max-w-md shadow-2xl">
            <div className="px-6 py-4 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">
                {editingId ? 'Editar Habitación' : 'Nueva Habitación'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Número de Habitación *
                  </label>
                  <input
                    type="text"
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: 101, 102, A1..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Descripción de la habitación..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, activa: !formData.activa })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.activa ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.activa ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="text-sm font-medium text-slate-300">
                    {formData.activa ? 'Habitación Activa' : 'Habitación Inactiva'}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingId(null);
                    setError('');
                  }}
                  className="flex-1 px-4 py-3 bg-white/10 text-slate-300 rounded-xl hover:bg-white/20 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
