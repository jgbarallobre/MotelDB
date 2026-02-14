'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface TipoEstadia {
  id: number;
  nombre: string;
  descripcion: string;
  duracion_horas: number;
  precio: number;
  precio_adicional: number;
  activo: boolean;
  es_paquete: boolean;
  orden: number;
}

export default function TiposEstadiaPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [tiposEstadia, setTiposEstadia] = useState<TipoEstadia[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<TipoEstadia | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    duracion_horas: 1,
    precio: 0,
    precio_adicional: 0,
    es_paquete: false,
    orden: 0,
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
    } else {
      setUser(JSON.parse(userData));
      fetchTiposEstadia();
    }
  }, [router]);

  const fetchTiposEstadia = async () => {
    try {
      const response = await fetch('/api/tipos-estadia');
      const data = await response.json();
      setTiposEstadia(data);
    } catch (error) {
      console.error('Error fetching tipos de estadía:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingItem 
        ? `/api/tipos-estadia/${editingItem.id}`
        : '/api/tipos-estadia';
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
          duracion_horas: 1,
          precio: 0,
          precio_adicional: 0,
          es_paquete: false,
          orden: 0,
        });
        fetchTiposEstadia();
      }
    } catch (error) {
      console.error('Error saving tipo de estadía:', error);
    }
  };

  const handleEdit = (item: TipoEstadia) => {
    setEditingItem(item);
    setFormData({
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      duracion_horas: item.duracion_horas,
      precio: item.precio,
      precio_adicional: item.precio_adicional,
      es_paquete: item.es_paquete,
      orden: item.orden,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este tipo de estadía?')) return;
    try {
      await fetch(`/api/tipos-estadia/${id}`, { method: 'DELETE' });
      fetchTiposEstadia();
    } catch (error) {
      console.error('Error deleting tipo de estadía:', error);
    }
  };

  const openNewModal = () => {
    setEditingItem(null);
    setFormData({
      nombre: '',
      descripcion: '',
      duracion_horas: 1,
      precio: 0,
      precio_adicional: 0,
      es_paquete: false,
      orden: 0,
    });
    setShowModal(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
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
              <h1 className="text-2xl font-bold">Tipos de Estadía</h1>
              <p className="text-blue-100 text-sm">Gestión de tarifas</p>
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
            <h2 className="text-2xl font-bold text-gray-800">Catálogo de Tipos de Estadía</h2>
            <p className="text-gray-600">Administra las tarifas y duraciones disponibles</p>
          </div>
          <button
            onClick={openNewModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Tipo de Estadía
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orden</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duración</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora Adicional</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tiposEstadia.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.orden}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.descripcion || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.duracion_horas} hora(s)</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">${item.precio.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.precio_adicional.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      item.es_paquete ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {item.es_paquete ? 'Paquete' : 'Estandar'}
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
              {tiposEstadia.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    No hay tipos de estadia configurados. Haga clic en Nuevo Tipo de Estadia para comenzar.
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
                {editingItem ? 'Editar Tipo de Estadía' : 'Nuevo Tipo de Estadía'}
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
                    placeholder="Ej: Hora, Pernocta, Paquete Noche"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duración (horas) *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={formData.duracion_horas}
                      onChange={(e) => setFormData({ ...formData, duracion_horas: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio ($) *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={0.01}
                      value={formData.precio}
                      onChange={(e) => setFormData({ ...formData, precio: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio Hora Adicional</label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={formData.precio_adicional}
                      onChange={(e) => setFormData({ ...formData, precio_adicional: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.orden}
                      onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="es_paquete"
                    checked={formData.es_paquete}
                    onChange={(e) => setFormData({ ...formData, es_paquete: e.target.checked })}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label htmlFor="es_paquete" className="ml-2 text-sm text-gray-700">
                    Es un paquete especial
                  </label>
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
