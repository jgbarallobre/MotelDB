'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Departamento } from '@/types';

export default function DepartamentosPage() {
  const router = useRouter();
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBrowserModal, setShowBrowserModal] = useState(false);
  const [editingDepartamento, setEditingDepartamento] = useState<Departamento | null>(null);
  const [formData, setFormData] = useState({
    codigo: '',
    descripcion: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDepartamentos();
  }, []);

  const fetchDepartamentos = async () => {
    try {
      const res = await fetch('/api/departamentos');
      if (res.ok) {
        const data = await res.json();
        setDepartamentos(data);
      }
    } catch (error) {
      console.error('Error fetching departamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDepartamentos = departamentos.filter(d => 
    d.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate codigo length
    if (formData.codigo.length !== 4) {
      setError('El código debe tener exactamente 4 caracteres');
      return;
    }

    // Validate descripcion length
    if (formData.descripcion.length > 30) {
      setError('La descripción debe tener máximo 30 caracteres');
      return;
    }

    try {
      const url = editingDepartamento 
        ? `/api/departamentos/${editingDepartamento.id}`
        : '/api/departamentos';
      
      const method = editingDepartamento ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setSuccess(editingDepartamento ? 'Departamento actualizado exitosamente' : 'Departamento creado exitosamente');
        setShowModal(false);
        setEditingDepartamento(null);
        resetForm();
        fetchDepartamentos();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Error al guardar departamento');
      }
    } catch (error) {
      setError('Error al guardar departamento');
    }
  };

  const handleEdit = (departamento: Departamento) => {
    setEditingDepartamento(departamento);
    setFormData({
      codigo: departamento.codigo,
      descripcion: departamento.descripcion
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este departamento?')) return;

    try {
      const res = await fetch(`/api/departamentos/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setSuccess('Departamento eliminado exitosamente');
        fetchDepartamentos();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Error al eliminar departamento');
      }
    } catch (error) {
      setError('Error al eliminar departamento');
    }
  };

  const handleToggleActivo = async (departamento: Departamento) => {
    try {
      const res = await fetch(`/api/departamentos/${departamento.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !departamento.activo })
      });

      if (res.ok) {
        fetchDepartamentos();
      }
    } catch (error) {
      console.error('Error toggling departamento:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      codigo: '',
      descripcion: ''
    });
  };

  const openNewModal = () => {
    setEditingDepartamento(null);
    resetForm();
    setShowModal(true);
  };

  const selectDepartamento = (departamento: Departamento) => {
    setFormData({
      codigo: departamento.codigo,
      descripcion: departamento.descripcion
    });
    setShowBrowserModal(false);
  };

  const handleCodigoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow alphanumeric characters, max 4
    const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
    setFormData({ ...formData, codigo: value });
  };

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
                <span className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center text-2xl">
                  🏢
                </span>
                Departamentos
              </h1>
            </div>
            <button
              onClick={openNewModal}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/25"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Nuevo Departamento</span>
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

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
          </div>
        ) : (
          /* Tabla de Departamentos */
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Fecha Creación
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredDepartamentos.map((departamento) => (
                    <tr key={departamento.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold shadow-lg">
                            {departamento.codigo.substring(0, 2)}
                          </div>
                          <div className="text-sm font-medium text-white">
                            {departamento.codigo}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-300">{departamento.descripcion}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleActivo(departamento)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                            departamento.activo
                              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                              : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                          }`}
                        >
                          {departamento.activo ? '✓ Activo' : '✗ Inactivo'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                        {new Date(departamento.fecha_creacion).toLocaleDateString('es-VE')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(departamento)}
                            className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/40 transition-all"
                            title="Editar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(departamento.id)}
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
            {departamentos.length === 0 && (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">🏢</span>
                </div>
                <p className="text-slate-400 text-lg">No hay departamentos registrados</p>
                <p className="text-slate-500 text-sm mt-1">Crea el primer departamento del sistema</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal para Crear/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full border border-white/10">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center text-sm">
                  {editingDepartamento ? '✏️' : '➕'}
                </span>
                {editingDepartamento ? 'Editar Departamento' : 'Nuevo Departamento'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingDepartamento(null);
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
                    Código *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      maxLength={4}
                      value={formData.codigo}
                      onChange={handleCodigoChange}
                      placeholder="ABCD"
                      className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all uppercase"
                      disabled={!!editingDepartamento}
                    />
                    <button
                      type="button"
                      onClick={() => setShowBrowserModal(true)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-white/10 text-slate-400 hover:text-white hover:bg-white/20 transition-all"
                      title="Buscar departamento"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">4 caracteres alfanuméricos</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Descripción *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={30}
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Nombre del departamento"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                  />
                  <p className="text-xs text-slate-500 mt-1">Máximo 30 caracteres</p>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingDepartamento(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 hover:shadow-lg"
                >
                  {editingDepartamento ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Browser de Departamentos */}
      {showBrowserModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full border border-white/10">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center text-sm">
                  🔍
                </span>
                Buscar Departamento
              </h3>
              <button
                onClick={() => setShowBrowserModal(false)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por código o descripción..."
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                />
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredDepartamentos.length > 0 ? (
                  filteredDepartamentos.map((departamento) => (
                    <button
                      key={departamento.id}
                      onClick={() => selectDepartamento(departamento)}
                      className="w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/30 transition-all text-left flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                        {departamento.codigo.substring(0, 2)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{departamento.codigo}</div>
                        <div className="text-xs text-slate-400">{departamento.descripcion}</div>
                      </div>
                      {!departamento.activo && (
                        <span className="ml-auto text-xs text-red-400">Inactivo</span>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    No se encontraron departamentos
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
