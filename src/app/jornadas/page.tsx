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
      setJornadas(data);
    } catch (error) {
      console.error('Error fetching jornadas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      }
    } catch (error) {
      console.error('Error saving jornada:', error);
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
      await fetch(`/api/jornadas/${id}`, { method: 'DELETE' });
      fetchJornadas();
    } catch (error) {
      console.error('Error deleting jornada:', error);
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

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
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
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-white hover:text-blue-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold">Gestión de Días/Jornadas</h1>
              <p className="text-blue-100 text-sm">Administración de turnos de trabajo</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-blue-100">Usuario: {user?.nombre}</span>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Catálogo de Jornadas</h2>
            <p className="text-gray-600">Administra los turnos de trabajo del motel</p>
          </div>
          <button
            onClick={openNewModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva Jornada
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duración</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {jornadas.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-gray-200"
                      style={{ backgroundColor: item.color }}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.descripcion || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.hora_inicio?.substring(0, 5)} - {item.hora_fin?.substring(0, 5)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.duracion_horas} hrs</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      item.es_noche 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {item.es_noche ? 'Nocturno' : 'Diurno'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      item.activo 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {item.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {jornadas.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    No hay jornadas configuradas. Haga clic en Nueva Jornada para comenzar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b">
              <h3 className="text-xl font-bold text-gray-800">
                {editingItem ? 'Editar Jornada' : 'Nueva Jornada'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Mañana, Tarde, Noche"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    placeholder="Descripción opcional"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora Inicio *</label>
                    <input
                      type="time"
                      required
                      value={formData.hora_inicio}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        hora_inicio: e.target.value,
                        duracion_horas: parseFloat(calculateDuration(e.target.value, formData.hora_fin))
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora Fin *</label>
                    <input
                      type="time"
                      required
                      value={formData.hora_fin}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        hora_fin: e.target.value,
                        duracion_horas: parseFloat(calculateDuration(formData.hora_inicio, e.target.value))
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duración (horas)</label>
                    <input
                      type="number"
                      min={0.5}
                      step={0.5}
                      value={formData.duracion_horas}
                      onChange={(e) => setFormData({ ...formData, duracion_horas: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <span className="text-sm text-gray-500">{formData.color}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="es_noche"
                      checked={formData.es_noche}
                      onChange={(e) => setFormData({ ...formData, es_noche: e.target.checked })}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label htmlFor="es_noche" className="ml-2 text-sm text-gray-700">
                      Turno nocturno
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="activo"
                      checked={formData.activo}
                      onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label htmlFor="activo" className="ml-2 text-sm text-gray-700">
                      Activo
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingItem ? 'Guardar Cambios' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
