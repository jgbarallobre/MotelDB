'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Jornada {
  id: number;
  nombre: string;
  descripcion: string;
  hora_inicio: string;
  hora_fin: string;
  duracion_horas: number;
  activo: boolean;
  es_noche: boolean;
  color: string;
}

export default function JornadasPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Jornada | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    hora_inicio: '08:00',
    hora_fin: '16:00',
    duracion_horas: 8,
    activo: true,
    es_noche: false,
    color: '#3B82F6',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
    } else {
      setUser(JSON.parse(userData));
      fetchJornadas();
    }
  }, [router]);

  const fetchJornadas = async () => {
    try {
      const response = await fetch('/api/jornadas');
      const data = await response.json();
      if (Array.isArray(data)) {
        setJornadas(data);
      } else if (data.error) {
        console.error('API Error:', data.error);
        setJornadas([]);
      } else {
        setJornadas([]);
      }
    } catch (error) {
      console.error('Error fetching jornadas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const url = editingItem 
        ? `/api/jornadas/${editingItem.id}`
        : '/api/jornadas';
      const method = editingItem ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess(editingItem ? 'Jornada actualizada exitosamente' : 'Jornada creada exitosamente');
        setShowModal(false);
        setEditingItem(null);
        setFormData({
          nombre: '',
          descripcion: '',
          hora_inicio: '08:00',
          hora_fin: '16:00',
          duracion_horas: 8,
          activo: true,
          es_noche: false,
          color: '#3B82F6',
        });
        fetchJornadas();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Error al guardar jornada');
      }
    } catch (error) {
      setError('Error al guardar jornada');
    }
  };

  const handleEdit = (item: Jornada) => {
    setEditingItem(item);
    setFormData({
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      hora_inicio: item.hora_inicio.substring(0, 5),
      hora_fin: item.hora_fin.substring(0, 5),
      duracion_horas: item.duracion_horas,
      activo: item.activo,
      es_noche: item.es_noche,
      color: item.color,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar esta jornada?')) return;
    
    try {
      const response = await fetch(`/api/jornadas/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setSuccess('Jornada eliminada exitosamente');
        fetchJornadas();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Error al eliminar jornada');
      }
    } catch (error) {
      setError('Error al eliminar jornada');
    }
  };

  const handleToggleActivo = async (item: Jornada) => {
    try {
      const response = await fetch(`/api/jornadas/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !item.activo })
      });

      if (response.ok) {
        fetchJornadas();
      }
    } catch (error) {
      console.error('Error toggling jornada:', error);
    }
  };

  const openNewModal = () => {
    setEditingItem(null);
    setFormData({
      nombre: '',
      descripcion: '',
      hora_inicio: '08:00',
      hora_fin: '16:00',
      duracion_horas: 8,
      activo: true,
      es_noche: false,
      color: '#3B82F6',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      hora_inicio: '08:00',
      hora_fin: '16:00',
      duracion_horas: 8,
      activo: true,
      es_noche: false,
      color: '#3B82F6',
    });
  };

  const calculateDuration = (inicio: string, fin: string): string => {
    if (!inicio || !fin || inicio === '' || fin === '') return '8';
    const [h1, m1] = inicio.split(':').map(Number);
    const [h2, m2] = fin.split(':').map(Number);
    let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (diff < 0) diff += 24 * 60; // Handle overnight shifts
    return (diff / 60).toFixed(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 rounded-lg bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <span className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center text-2xl">
                  🌅
                </span>
                Días/Jornadas
              </h1>
            </div>
            <button
              onClick={openNewModal}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/25"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Nueva Jornada</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mensajes */}
        {error && (
          <div className="mb-4 bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl backdrop-blur-xl">
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div className="mb-4 bg-green-500/20 border border-green-500/30 text-green-300 px-4 py-3 rounded-xl backdrop-blur-xl">
            ✅ {success}
          </div>
        )}

        {/* Tabla */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Color
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Horario
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Duración
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {jornadas.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div 
                        className="w-8 h-8 rounded-full border-2 border-white/20"
                        style={{ backgroundColor: item.color }}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{item.nombre}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-400">{item.descripcion || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-300">
                        {item.hora_inicio?.substring(0, 5)} - {item.hora_fin?.substring(0, 5)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-300">{item.duracion_horas} hrs</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        item.es_noche 
                          ? 'bg-purple-500/20 text-purple-400' 
                          : 'bg-orange-500/20 text-orange-400'
                      }`}>
                        {item.es_noche ? '🌙 Nocturno' : '☀️ Diurno'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActivo(item)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                          item.activo
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        }`}
                      >
                        {item.activo ? '✓ Activo' : '✗ Inactivo'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/40 transition-all"
                          title="Editar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/40 transition-all"
                          title="Eliminar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {jornadas.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🌅</span>
              </div>
              <p className="text-slate-400 text-lg">No hay jornadas configuradas</p>
              <p className="text-slate-500 text-sm mt-1">Crea la primera jornada del sistema</p>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full border border-white/10">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center text-sm">
                  {editingItem ? '✏️' : '➕'}
                </span>
                {editingItem ? 'Editar Jornada' : 'Nueva Jornada'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingItem(null);
                  resetForm();
                }}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    placeholder="Ej: Mañana, Tarde, Noche"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    rows={2}
                    placeholder="Descripción opcional"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Hora Inicio *
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.hora_inicio}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        hora_inicio: e.target.value,
                        duracion_horas: parseFloat(calculateDuration(e.target.value, formData.hora_fin))
                      })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Hora Fin *
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.hora_fin}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        hora_fin: e.target.value,
                        duracion_horas: parseFloat(calculateDuration(formData.hora_inicio, e.target.value))
                      })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Duración (horas)
                    </label>
                    <input
                      type="number"
                      min={0.5}
                      step={0.5}
                      value={formData.duracion_horas}
                      onChange={(e) => setFormData({ ...formData, duracion_horas: parseFloat(e.target.value) })}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-10 h-10 border border-white/20 rounded cursor-pointer bg-transparent"
                      />
                      <span className="text-sm text-slate-400">{formData.color}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="es_noche"
                    checked={formData.es_noche}
                    onChange={(e) => setFormData({ ...formData, es_noche: e.target.checked })}
                    className="h-5 w-5 text-orange-500 bg-white/10 border-white/20 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="es_noche" className="text-sm text-slate-300">
                    Turno nocturno
                  </label>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingItem(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all duration-200 hover:shadow-lg"
                >
                  {editingItem ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
