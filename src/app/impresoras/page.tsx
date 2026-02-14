'use client';

import { useState, useEffect } from 'react';

interface Impresora {
  id: number;
  nombre: string;
  tipo: string;
  modelo: string;
  puerto: string;
  ip_address: string;
  caracteres_por_linea: number;
  activa: boolean;
  es_predeterminada: boolean;
  imprimir_logo: boolean;
  imprimir_qr: boolean;
  copiar_recibo: number;
  encabezado: string;
  pie_pagina: string;
  observaciones: string;
}

export default function ImpresorasPage() {
  const [impresoras, setImpresoras] = useState<Impresora[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingImpresora, setEditingImpresora] = useState<Impresora | null>(null);
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
      const url = editingImpresora 
        ? `/api/impresoras/${editingImpresora.id}` 
        : '/api/impresoras';
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

  const handleEdit = (impresora: Impresora) => {
    setEditingImpresora(impresora);
    setFormData({
      nombre: impresora.nombre,
      tipo: impresora.tipo,
      modelo: impresora.modelo || '',
      puerto: impresora.puerto || '',
      ip_address: impresora.ip_address || '',
      caracteres_por_linea: impresora.caracteres_por_linea,
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">🖨️ Impresoras</h1>
            <p className="text-gray-600">Configuración de impresoras fiscales y ticketras</p>
          </div>
          <button
            onClick={() => {
              setEditingImpresora(null);
              resetForm();
              setShowModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <span>+</span> Nueva Impresora
          </button>
        </div>

        {/* Lista de impresoras */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modelo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conexión</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {impresoras.map((impresora) => (
                <tr key={impresora.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {impresora.es_predeterminada && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">⭐ Predeterminada</span>
                      )}
                      <span className="font-medium text-gray-900">{impresora.nombre}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-gray-600">{getTipoLabel(impresora.tipo)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {impresora.modelo || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    <div>
                      <div>{impresora.puerto || 'No configurado'}</div>
                      {impresora.ip_address && (
                        <div className="text-xs text-gray-500">{impresora.ip_address}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      impresora.activa 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {impresora.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => handleEdit(impresora)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => handleDelete(impresora.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      🗑️ Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {impresoras.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No hay impresoras configuradas. Agrega una nueva.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {editingImpresora ? 'Editar Impresora' : 'Nueva Impresora'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nombre */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="Ticketera Recepción"
                    />
                  </div>

                  {/* Tipo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo *
                    </label>
                    <select
                      required
                      value={formData.tipo}
                      onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="Ticketera">Ticketera</option>
                      <option value="Fiscal">Fiscal</option>
                      <option value="No Fiscal">No Fiscal</option>
                    </select>
                  </div>

                  {/* Modelo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Modelo
                    </label>
                    <input
                      type="text"
                      value={formData.modelo}
                      onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="Epson TM-T88VI"
                    />
                  </div>

                  {/* Puerto */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Puerto
                    </label>
                    <input
                      type="text"
                      value={formData.puerto}
                      onChange={(e) => setFormData({ ...formData, puerto: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="USB, COM1, LPT1"
                    />
                  </div>

                  {/* IP Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      IP (si es de red)
                    </label>
                    <input
                      type="text"
                      value={formData.ip_address}
                      onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                      className="w-full border rounded-lg px- border-gray-3003 py-2"
                      placeholder="192.168.1.100"
                    />
                  </div>

                  {/* Caracteres por línea */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Caracteres por línea
                    </label>
                    <input
                      type="number"
                      value={formData.caracteres_por_linea}
                      onChange={(e) => setFormData({ ...formData, caracteres_por_linea: parseInt(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>

                  {/* Copias */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Copias de recibo
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={formData.copiar_recibo}
                      onChange={(e) => setFormData({ ...formData, copiar_recibo: parseInt(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>

                {/* Opciones */}
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-medium text-gray-800 mb-3">Opciones de Impresión</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.activa}
                        onChange={(e) => setFormData({ ...formData, activa: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm">Activa</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.es_predeterminada}
                        onChange={(e) => setFormData({ ...formData, es_predeterminada: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm">Predeterminada</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.imprimir_logo}
                        onChange={(e) => setFormData({ ...formData, imprimir_logo: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm">Imprimir Logo</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.imprimir_qr}
                        onChange={(e) => setFormData({ ...formData, imprimir_qr: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm">Imprimir QR</span>
                    </label>
                  </div>
                </div>

                {/* Mensajes personalizados */}
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-medium text-gray-800 mb-3">Mensajes Personalizados</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Encabezado del recibo
                      </label>
                      <textarea
                        value={formData.encabezado}
                        onChange={(e) => setFormData({ ...formData, encabezado: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        rows={2}
                        placeholder="¡Bienvenido a nuestro motel!"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pie de página del recibo
                      </label>
                      <textarea
                        value={formData.pie_pagina}
                        onChange={(e) => setFormData({ ...formData, pie_pagina: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        rows={2}
                        placeholder="Gracias por su preferencia"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Observaciones
                      </label>
                      <textarea
                        value={formData.observaciones}
                        onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        rows={2}
                        placeholder="Notas adicionales..."
                      />
                    </div>
                  </div>
                </div>

                {/* Botones */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingImpresora(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingImpresora ? 'Guardar Cambios' : 'Crear Impresora'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
