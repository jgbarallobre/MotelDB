'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ConfiguracionMotel, ActualizarConfiguracion, TipoIva } from '@/types';

// Componente para la pestaña de Impuestos (Tipos de IVA)
function ImpuestosTab() {
  const [impuestos, setImpuestos] = useState<TipoIva[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingImpuesto, setEditingImpuesto] = useState<TipoIva | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    codigo: '',
    descripcion: '',
    valor: 0
  });

  useEffect(() => {
    fetchImpuestos();
  }, []);

  const fetchImpuestos = async () => {
    try {
      const res = await fetch('/api/tipos-iva');
      const data = await res.json();
      setImpuestos(data);
    } catch (error) {
      console.error('Error fetching impuestos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingImpuesto ? `/api/tipos-iva/${editingImpuesto.id}` : '/api/tipos-iva';
      const method = editingImpuesto ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setShowModal(false);
        setEditingImpuesto(null);
        setFormData({ codigo: '', descripcion: '', valor: 0 });
        fetchImpuestos();
      } else {
        const data = await res.json();
        alert(data.error || 'Error al guardar');
      }
    } catch (error) {
      console.error('Error saving impuesto:', error);
    }
  };

  const handleEdit = (impuesto: TipoIva) => {
    setEditingImpuesto(impuesto);
    setFormData({
      codigo: impuesto.codigo,
      descripcion: impuesto.descripcion,
      valor: Number(impuesto.valor)
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este tipo de IVA?')) return;
    try {
      const res = await fetch(`/api/tipos-iva/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchImpuestos();
      }
    } catch (error) {
      console.error('Error deleting impuesto:', error);
    }
  };

  const filteredImpuestos = impuestos.filter(i =>
    i.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Buscar impuestos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="absolute left-3 top-2.5">🔍</span>
        </div>
        <button
          onClick={() => {
            setEditingImpuesto(null);
            setFormData({ codigo: '', descripcion: '', valor: 0 });
            setShowModal(true);
          }}
          className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
        >
          <span>+</span> Nuevo
        </button>
      </div>

      <div className="bg-slate-800 rounded-xl overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-slate-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Código</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Descripción</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Valor (%)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Estado</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {filteredImpuestos.map((impuesto) => (
              <tr key={impuesto.id} className="hover:bg-slate-700/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSearchTerm(impuesto.codigo);
                      }}
                      className="text-blue-400 hover:text-blue-300"
                      title="Buscar"
                    >
                      🔍
                    </button>
                    <span className="font-medium text-white">{impuesto.codigo}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-300">{impuesto.descripcion}</td>
                <td className="px-4 py-3 text-slate-300">{Number(impuesto.valor).toFixed(2)}%</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    impuesto.activo ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                  }`}>
                    {impuesto.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleEdit(impuesto)}
                    className="text-blue-400 hover:text-blue-300 mr-3"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(impuesto.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
            {filteredImpuestos.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No hay tipos de IVA configurados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl shadow-xl w-full max-w-md m-4 p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingImpuesto ? 'Editar Tipo de IVA' : 'Nuevo Tipo de IVA'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Código (2 caracteres) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 2) })}
                    className="w-full px-4 py-2 pr-10 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="01"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      // Browser - muestra todos los códigos disponibles
                      setFormData({ ...formData, codigo: '' });
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    title="Ver códigos existentes"
                  >
                    🔍
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Descripción (máx 15 caracteres) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={15}
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="IVA 16%"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Valor (%) *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="16.00"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingImpuesto(null);
                    setFormData({ codigo: '', descripcion: '', valor: 0 });
                  }}
                  className="px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingImpuesto ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente para la pestaña de Impresoras
function ImpresorasTab() {
  const [impresoras, setImpresoras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingImpresora, setEditingImpresora] = useState<any>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'Ticketera',
    modelo: '',
    puerto: '',
    ip_address: '',
    caracteres_por_linea: 40,
    activa: true,
    es_predeterminada: false,
    imprimir_logo: true,
    imprimir_qr: false,
    copiar_recibo: 1,
    encabezado: '',
    pie_pagina: '',
    observaciones: ''
  });

  useEffect(() => {
    fetchImpresoras();
  }, []);

  const fetchImpresoras = async () => {
    try {
      const res = await fetch('/api/impresoras');
      const data = await res.json();
      setImpresoras(data);
    } catch (error) {
      console.error('Error fetching impresoras:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingImpresora ? `/api/impresoras/${editingImpresora.id}` : '/api/impresoras';
      const method = editingImpresora ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setShowModal(false);
        setEditingImpresora(null);
        resetForm();
        fetchImpresoras();
      }
    } catch (error) {
      console.error('Error saving impresoras:', error);
    }
  };

  const handleEdit = (impresora: any) => {
    setEditingImpresora(impresora);
    setFormData({
      nombre: impresora.nombre,
      tipo: impresora.tipo,
      modelo: impresora.modelo || '',
      puerto: impresora.puerto || '',
      ip_address: impresora.ip_address || '',
      caracteres_por_linea: Number(impresora.caracteres_por_linea),
      activa: Boolean(impresora.activa),
      es_predeterminada: Boolean(impresora.es_predeterminada),
      imprimir_logo: Boolean(impresora.imprimir_logo),
      imprimir_qr: Boolean(impresora.imprimir_qr),
      copiar_recibo: Number(impresora.copiar_recibo),
      encabezado: impresora.encabezado || '',
      pie_pagina: impresora.pie_pagina || '',
      observaciones: impresora.observaciones || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta impresora?')) return;
    try {
      const res = await fetch(`/api/impresoras/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchImpresoras();
      }
    } catch (error) {
      console.error('Error deleting impresoras:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      tipo: 'Ticketera',
      modelo: '',
      puerto: '',
      ip_address: '',
      caracteres_por_linea: 40,
      activa: true,
      es_predeterminada: false,
      imprimir_logo: true,
      imprimir_qr: false,
      copiar_recibo: 1,
      encabezado: '',
      pie_pagina: '',
      observaciones: ''
    });
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      'Fiscal': '🧾 Fiscal',
      'No Fiscal': '📄 No Fiscal',
      'Ticketera': '🖨️ Ticketera'
    };
    return labels[tipo] || tipo;
  };

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Lista de Impresoras</h3>
        <button
          onClick={() => {
            setEditingImpresora(null);
            resetForm();
            setShowModal(true);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
        >
          <span>+</span> Nueva Impresora
        </button>
      </div>

      <div className="bg-slate-800 rounded-xl overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-slate-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Nombre</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Tipo</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Modelo</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Conexión</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase">Estado</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {impresoras.map((impresora) => (
              <tr key={impresora.id} className="hover:bg-slate-700/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {impresora.es_predeterminada && (
                      <span className="bg-yellow-900 text-yellow-300 text-xs px-2 py-1 rounded">⭐</span>
                    )}
                    <span className="font-medium text-white">{impresora.nombre}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-300">{getTipoLabel(impresora.tipo)}</td>
                <td className="px-4 py-3 text-slate-300">{impresora.modelo || '-'}</td>
                <td className="px-4 py-3 text-slate-300">
                  <div>{impresora.puerto || 'No configurado'}</div>
                  {impresora.ip_address && (
                    <div className="text-xs text-slate-500">{impresora.ip_address}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    impresora.activa ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                  }`}>
                    {impresora.activa ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleEdit(impresora)}
                    className="text-blue-400 hover:text-blue-300 mr-3"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(impresora.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
            {impresoras.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No hay impresoras configuradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4 p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingImpresora ? 'Editar Impresora' : 'Nueva Impresora'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Tipo *</label>
                  <select
                    required
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  >
                    <option value="Ticketera">Ticketera</option>
                    <option value="Fiscal">Fiscal</option>
                    <option value="No Fiscal">No Fiscal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Modelo</label>
                  <input
                    type="text"
                    value={formData.modelo}
                    onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Puerto</label>
                  <input
                    type="text"
                    value={formData.puerto}
                    onChange={(e) => setFormData({ ...formData, puerto: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">IP (red)</label>
                  <input
                    type="text"
                    value={formData.ip_address}
                    onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Caracteres/línea</label>
                  <input
                    type="number"
                    value={formData.caracteres_por_linea}
                    onChange={(e) => setFormData({ ...formData, caracteres_por_linea: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="border-t border-slate-700 pt-4">
                <h3 className="font-medium text-white mb-3">Opciones</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <label className="flex items-center gap-2 text-slate-300">
                    <input
                      type="checkbox"
                      checked={formData.activa}
                      onChange={(e) => setFormData({ ...formData, activa: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Activa</span>
                  </label>
                  <label className="flex items-center gap-2 text-slate-300">
                    <input
                      type="checkbox"
                      checked={formData.es_predeterminada}
                      onChange={(e) => setFormData({ ...formData, es_predeterminada: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Predeterminada</span>
                  </label>
                  <label className="flex items-center gap-2 text-slate-300">
                    <input
                      type="checkbox"
                      checked={formData.imprimir_logo}
                      onChange={(e) => setFormData({ ...formData, imprimir_logo: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Logo</span>
                  </label>
                  <label className="flex items-center gap-2 text-slate-300">
                    <input
                      type="checkbox"
                      checked={formData.imprimir_qr}
                      onChange={(e) => setFormData({ ...formData, imprimir_qr: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">QR</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingImpresora(null); }}
                  className="px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingImpresora ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente para la pestaña de Opciones Generales
function OpcionesGeneralesTab() {
  const router = useRouter();
  const [config, setConfig] = useState<ConfiguracionMotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ActualizarConfiguracion>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/configuracion');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        setFormData(data);
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const res = await fetch('/api/configuracion', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        setSuccess('Configuración guardada exitosamente');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Error al guardar configuración');
      }
    } catch (error) {
      setError('Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="mb-6 bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 bg-green-900/50 border border-green-700 text-green-300 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Información General */}
      <div className="bg-slate-800 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span>🏨</span> Información General
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Nombre del Motel</label>
            <input
              type="text"
              name="nombre_motel"
              value={formData.nombre_motel || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">NIT / Identificación</label>
            <input
              type="text"
              name="nit"
              value={formData.nit || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Teléfono</label>
            <input
              type="text"
              name="telefono"
              value={formData.telefono || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Correo</label>
            <input
              type="email"
              name="email"
              value={formData.email || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-1">Dirección</label>
            <textarea
              name="direccion"
              value={formData.direccion || ''}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            />
          </div>
        </div>
      </div>

      {/* Horarios */}
      <div className="bg-slate-800 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span>⏰</span> Horarios
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Hora de Check-in</label>
            <input
              type="time"
              name="hora_checkin"
              value={formData.hora_checkin || '14:00'}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Hora de Check-out</label>
            <input
              type="time"
              name="hora_checkout"
              value={formData.hora_checkout || '12:00'}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            />
          </div>
        </div>
      </div>

      {/* Moneda */}
      <div className="bg-slate-800 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span>💰</span> Moneda
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Moneda</label>
            <select
              name="moneda"
              value={formData.moneda || 'PEN'}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            >
              <option value="PEN">PEN - Sol Peruano</option>
              <option value="USD">USD - Dólar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="MXN">MXN - Peso Mexicano</option>
              <option value="COP">COP - Peso Colombiano</option>
              <option value="CLP">CLP - Peso Chileno</option>
              <option value="ARS">ARS - Peso Argentino</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Símbolo</label>
            <input
              type="text"
              name="simbolo_moneda"
              value={formData.simbolo_moneda || 'S/'}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Tasa Impuesto (%)</label>
            <input
              type="number"
              name="tasa_impuesto"
              value={formData.tasa_impuesto || 0}
              onChange={handleChange}
              step="0.01"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            />
          </div>
        </div>
      </div>

      {/* Colores */}
      <div className="bg-slate-800 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span>🎨</span> Colores
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Color Principal</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                name="color_principal"
                value={formData.color_principal || '#1E3A8A'}
                onChange={handleChange}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                name="color_principal"
                value={formData.color_principal || '#1E3A8A'}
                onChange={handleChange}
                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Color Secundario</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                name="color_secundario"
                value={formData.color_secundario || '#3B82F6'}
                onChange={handleChange}
                className="w-12 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                name="color_secundario"
                value={formData.color_secundario || '#3B82F6'}
                onChange={handleChange}
                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mensaje de Recibo */}
      <div className="bg-slate-800 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span>🧾</span> Mensaje de Recibo
        </h2>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Mensaje en recibos</label>
          <textarea
            name="mensaje_recibo"
            value={formData.mensaje_recibo || ''}
            onChange={handleChange}
            rows={2}
            placeholder="Gracias por su visita"
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? (
            <>
              <span className="animate-spin">⏳</span> Guardando...
            </>
          ) : (
            <>
              <span>💾</span> Guardar Configuración
            </>
          )}
        </button>
      </div>
    </form>
  );
}

// Página principal de configuración con pestañas
export default function ConfiguracionPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'impuestos' | 'impresoras' | 'opciones'>('impuestos');

  const tabs = [
    { id: 'impuestos' as const, label: '💰 Impuestos', icon: '💰' },
    { id: 'impresoras' as const, label: '🖨️ Impresoras', icon: '🖨️' },
    { id: 'opciones' as const, label: '⚙️ Opciones Generales', icon: '⚙️' }
  ];

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <span className="text-xl">←</span>
            </button>
            <h1 className="text-2xl font-bold text-white">
              ⚙️ Maestro Configuración
            </h1>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1 -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-white hover:border-slate-500'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'impuestos' && <ImpuestosTab />}
        {activeTab === 'impresoras' && <ImpresorasTab />}
        {activeTab === 'opciones' && <OpcionesGeneralesTab />}
      </main>
    </div>
  );
}
