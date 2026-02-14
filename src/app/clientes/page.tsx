'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Cliente {
  id: number;
  nombre: string;
  apellido: string;
  documento: string;
  tipo_documento: string;
  telefono: string;
  email: string;
  direccion: string;
  rif: string;
  razon_social: string;
  direccion_fiscal: string;
  telefono_facturacion: string;
  fecha_registro: string;
  ultima_visita: string | null;
  total_visitas: number;
}

export default function ClientesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Cliente | null>(null);
  const [viewingBilling, setViewingBilling] = useState<Cliente | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    documento: '',
    tipo_documento: 'Cédula',
    telefono: '',
    email: '',
    direccion: '',
  });
  const [billingData, setBillingData] = useState({
    rif: '',
    razon_social: '',
    direccion_fiscal: '',
    telefono_facturacion: '',
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
    } else {
      setUser(JSON.parse(userData));
      fetchClientes();
    }
  }, [router]);

  const fetchClientes = async () => {
    try {
      const response = await fetch('/api/clientes');
      const data = await response.json();
      setClientes(data);
    } catch (error) {
      console.error('Error fetching clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingItem 
        ? `/api/clientes/${editingItem.id}`
        : '/api/clientes';
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
          apellido: '',
          documento: '',
          tipo_documento: 'Cédula',
          telefono: '',
          email: '',
          direccion: '',
        });
        fetchClientes();
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error('Error saving cliente:', error);
    }
  };

  const handleBillingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingBilling) return;
    
    try {
      const response = await fetch(`/api/clientes/${viewingBilling.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...viewingBilling,
          ...billingData,
        }),
      });

      if (response.ok) {
        setShowBillingModal(false);
        setViewingBilling(null);
        fetchClientes();
      }
    } catch (error) {
      console.error('Error saving billing data:', error);
    }
  };

  const handleEdit = (item: Cliente) => {
    setEditingItem(item);
    setFormData({
      nombre: item.nombre,
      apellido: item.apellido,
      documento: item.documento,
      tipo_documento: item.tipo_documento,
      telefono: item.telefono || '',
      email: item.email || '',
      direccion: item.direccion || '',
    });
    setShowModal(true);
  };

  const handleViewBilling = (item: Cliente) => {
    setViewingBilling(item);
    setBillingData({
      rif: item.rif || '',
      razon_social: item.razon_social || '',
      direccion_fiscal: item.direccion_fiscal || '',
      telefono_facturacion: item.telefono_facturacion || '',
    });
    setShowBillingModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este cliente?')) return;
    try {
      const response = await fetch(`/api/clientes/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchClientes();
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error('Error deleting cliente:', error);
    }
  };

  const openNewModal = () => {
    setEditingItem(null);
    setFormData({
      nombre: '',
      apellido: '',
      documento: '',
      tipo_documento: 'Cédula',
      telefono: '',
      email: '',
      direccion: '',
    });
    setShowModal(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  const filteredClientes = clientes.filter(cliente => 
    cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.documento.includes(searchTerm)
  );

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
              <h1 className="text-2xl font-bold">Clientes / Huéspedes</h1>
              <p className="text-blue-100 text-sm">Registro de clientes y datos de facturación</p>
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
            <h2 className="text-2xl font-bold text-gray-800">Registro de Huéspedes</h2>
            <p className="text-gray-600">Administra los datos de los huéspedes y facturación</p>
          </div>
          <button
            onClick={openNewModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Huésped
          </button>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar por nombre, apellido o documento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RIF</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visitas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Última Visita</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClientes.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.nombre} {item.apellido}</div>
                    <div className="text-sm text-gray-500">{item.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.tipo_documento}: {item.documento}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.telefono || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.rif ? (
                      <span className="text-green-600 font-medium">{item.rif}</span>
                    ) : (
                      <span className="text-gray-400">Sin RIF</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {item.total_visitas}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.ultima_visita ? new Date(item.ultima_visita).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleViewBilling(item)}
                      className="text-green-600 hover:text-green-900 mr-4"
                      title="Datos de Facturación"
                    >
                      📄 Fact
                    </button>
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
              {filteredClientes.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No hay huespedes registrados. Haga clic en Nuevo Huesped para comenzar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modal - Nuevo/Editar Cliente */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b">
              <h3 className="text-xl font-bold text-gray-800">
                {editingItem ? 'Editar Huésped' : 'Nuevo Huésped'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                    <input
                      type="text"
                      required
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
                    <input
                      type="text"
                      required
                      value={formData.apellido}
                      onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Documento *</label>
                    <select
                      value={formData.tipo_documento}
                      onChange={(e) => setFormData({ ...formData, tipo_documento: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Cédula">Cédula</option>
                      <option value="DNI">DNI</option>
                      <option value="Pasaporte">Pasaporte</option>
                      <option value="RUC">RUC</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Documento *</label>
                    <input
                      type="text"
                      required
                      value={formData.documento}
                      onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                    <input
                      type="text"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                  <textarea
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                  />
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

      {/* Modal - Datos de Facturación */}
      {showBillingModal && viewingBilling && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="px-6 py-4 border-b bg-green-50">
              <h3 className="text-xl font-bold text-gray-800">
                📄 Datos de Facturación
              </h3>
              <p className="text-sm text-gray-600">
                {viewingBilling.nombre} {viewingBilling.apellido}
              </p>
            </div>
            <form onSubmit={handleBillingSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">RIF / Identificación Fiscal</label>
                  <input
                    type="text"
                    value={billingData.rif}
                    onChange={(e) => setBillingData({ ...billingData, rif: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="J-12345678-9"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social</label>
                  <input
                    type="text"
                    value={billingData.razon_social}
                    onChange={(e) => setBillingData({ ...billingData, razon_social: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Nombre de la empresa o razón social"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección Fiscal</label>
                  <textarea
                    value={billingData.direccion_fiscal}
                    onChange={(e) => setBillingData({ ...billingData, direccion_fiscal: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={2}
                    placeholder="Dirección completa para facturación"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono Facturación</label>
                  <input
                    type="text"
                    value={billingData.telefono_facturacion}
                    onChange={(e) => setBillingData({ ...billingData, telefono_facturacion: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowBillingModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Guardar Datos de Facturación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
