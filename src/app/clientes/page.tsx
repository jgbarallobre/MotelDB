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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    nombre_completo: '',
    documento: '',
    tipo_documento: 'Cédula',
    telefono: '',
    email: '',
    direccion: '',
  });
  const [formStep, setFormStep] = useState(1); // 1 = CI/RIF, 2 = datos restantes
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
      
      // Verificar que data sea un array
      if (Array.isArray(data)) {
        setClientes(data);
      } else if (data.error) {
        console.error('API Error:', data.error);
        setError(data.error); // Mostrar el error al usuario
        setClientes([]);
      } else {
        setClientes([]);
      }
    } catch (error) {
      console.error('Error fetching clientes:', error);
      setError('Error al conectar con el servidor');
      setClientes([]);
    } finally {
      setLoading(false);
    }
  };

  // Verificar si el documento ya existe en la base de datos
  const verificarDocumentoExistente = async (documento: string): Promise<{ existe: boolean; cliente?: any }> => {
    try {
      const response = await fetch(`/api/clientes/buscar?documento=${encodeURIComponent(documento.toUpperCase())}`);
      const data = await response.json();
      if (response.ok) {
        return { existe: data.existe, cliente: data.cliente };
      }
      return { existe: false };
    } catch (error) {
      console.error('Error verificando documento:', error);
      return { existe: false };
    }
  };

  // Avanzar al siguiente paso (verificar que CI/RIF no exista ya en la base de datos)
  const handleNextStep = async () => {
    setError('');
    
    // Validar que el documento no esté vacío
    if (!formData.documento.trim()) {
      setError('El documento es obligatorio');
      return;
    }
    
    // Verificar si el documento ya existe en la base de datos
    const result = await verificarDocumentoExistente(formData.documento);
    if (result.existe) {
      setError(`Ya existe un cliente registrado con este documento: ${result.cliente?.nombre} ${result.cliente?.apellido || ''}`);
      return;
    }
    
    setFormStep(2);
  };

  // Volver al paso anterior
  const handlePrevStep = () => {
    setFormStep(1);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Si estamos en paso 1, verificar que el documento no exista ya
    if (formStep === 1) {
      const result = await verificarDocumentoExistente(formData.documento);
      if (result.existe) {
        setError(`Ya existe un cliente registrado con este documento: ${result.cliente?.nombre} ${result.cliente?.apellido || ''}`);
        return;
      }
      setFormStep(2);
      return;
    }

    // Validar que nombre completo no esté vacío
    if (!formData.nombre_completo.trim()) {
      setError('El nombre completo es obligatorio');
      return;
    }

    // Separar nombre completo en nombre y apellido (último espacio como apellido)
    const nombreCompleto = formData.nombre_completo.trim();
    const ultimoEspacio = nombreCompleto.lastIndexOf(' ');
    let nombre = nombreCompleto;
    let apellido = '';

    if (ultimoEspacio > 0) {
      nombre = nombreCompleto.substring(0, ultimoEspacio);
      apellido = nombreCompleto.substring(ultimoEspacio + 1);
    } else {
      // Si solo hay un nombre, usarlo como nombre y apellido vacío
      nombre = nombreCompleto;
      apellido = '';
    }

    try {
      const url = editingItem 
        ? `/api/clientes/${editingItem.id}`
        : '/api/clientes';
      const method = editingItem ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          apellido,
          documento: formData.documento.toUpperCase(),
          tipo_documento: formData.tipo_documento,
          telefono: formData.telefono || null,
          email: formData.email || null,
          direccion: formData.direccion || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(editingItem ? 'Huésped actualizado exitosamente' : 'Huésped creado exitosamente');
        setShowModal(false);
        setEditingItem(null);
        setFormData({
          nombre_completo: '',
          documento: '',
          tipo_documento: 'Cédula',
          telefono: '',
          email: '',
          direccion: '',
        });
        fetchClientes();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Error al guardar huésped');
      }
    } catch (error) {
      setError('Error al guardar huésped');
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
        setSuccess('Datos de facturación actualizados exitosamente');
        setShowBillingModal(false);
        setViewingBilling(null);
        fetchClientes();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Error al guardar datos de facturación');
      }
    } catch (error) {
      setError('Error al guardar datos de facturación');
    }
  };

  const handleEdit = (item: Cliente) => {
    setEditingItem(item);
    // Combinar nombre y apellido en un solo campo
    const nombreCompleto = item.apellido 
      ? `${item.nombre} ${item.apellido}`
      : item.nombre;
    
    setFormData({
      nombre_completo: nombreCompleto,
      documento: item.documento,
      tipo_documento: item.tipo_documento,
      telefono: item.telefono || '',
      email: item.email || '',
      direccion: item.direccion || '',
    });
    setFormStep(2); // Ya tenemos el documento, ir directamente al paso 2
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
    if (!confirm('¿Está seguro de eliminar este huésped?')) return;
    
    try {
      const response = await fetch(`/api/clientes/${id}`, { method: 'DELETE' });
      const data = await response.json();
      
      if (response.ok) {
        setSuccess('Huésped eliminado exitosamente');
        fetchClientes();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Error al eliminar huésped');
      }
    } catch (error) {
      setError('Error al eliminar huésped');
    }
  };

  const openNewModal = () => {
    setEditingItem(null);
    setFormData({
      nombre_completo: '',
      documento: '',
      tipo_documento: 'Cédula',
      telefono: '',
      email: '',
      direccion: '',
    });
    setFormStep(1); // Siempre empezar por el paso 1 (CI/RIF)
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      nombre_completo: '',
      documento: '',
      tipo_documento: 'Cédula',
      telefono: '',
      email: '',
      direccion: '',
    });
    setFormStep(1);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  // Ensure clientes is always an array for filtering
  const clientesArray = Array.isArray(clientes) ? clientes : [];
  
  const filteredClientes = clientesArray.filter(cliente => {
    const nombreCompleto = `${cliente.nombre} ${cliente.apellido}`.toLowerCase();
    const search = searchTerm.toLowerCase();
    return nombreCompleto.includes(search) ||
           cliente.documento.toLowerCase().includes(search) ||
           (cliente.email && cliente.email.toLowerCase().includes(search));
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  // Mostrar error si existe, incluso cuando no está loading
  if (error && clientes.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-6 py-4 rounded-2xl backdrop-blur-xl max-w-md text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2">Error de Conexión</h2>
          <p className="text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-red-500/40 hover:bg-red-500/60 text-white px-4 py-2 rounded-xl transition-all"
          >
            Reintentar
          </button>
        </div>
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
                <span className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-2xl">
                  👤
                </span>
                Clientes / Huéspedes
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-slate-400 text-sm">Usuario: {user?.nombre}</span>
              <button
                onClick={handleLogout}
                className="bg-red-500/20 hover:bg-red-500/40 text-red-400 px-4 py-2 rounded-xl transition-all"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Acciones */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Registro de Huéspedes</h2>
            <p className="text-slate-400 text-sm">Administra los datos de los huéspedes y facturación</p>
          </div>
          <button
            onClick={openNewModal}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/25"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Nuevo Huésped</span>
          </button>
        </div>

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

        {/* Buscador */}
        <div className="mb-4">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por nombre o documento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Documento
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Teléfono
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    RIF
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Visitas
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Última Visita
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredClientes.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">
                        {item.nombre} {item.apellido}
                      </div>
                      <div className="text-sm text-slate-400">{item.email || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {item.documento}
                      </div>
                      <div className="text-xs text-slate-400">{item.tipo_documento}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {item.telefono || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.rif ? (
                        <span className="text-green-400 font-medium text-sm">{item.rif}</span>
                      ) : (
                        <span className="text-slate-500 text-sm">Sin RIF</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400">
                        {item.total_visitas}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                      {item.ultima_visita ? new Date(item.ultima_visita).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleViewBilling(item)}
                          className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/40 transition-all"
                          title="Datos de Facturación"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
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
          {filteredClientes.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">👤</span>
              </div>
              <p className="text-slate-400 text-lg">No hay huéspedes registrados</p>
              <p className="text-slate-500 text-sm mt-1">Crea el primer huésped del sistema</p>
            </div>
          )}
        </div>
      </main>

      {/* Modal - Nuevo/Editar Cliente */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full border border-white/10">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center text-sm">
                  {editingItem ? '✏️' : '➕'}
                </span>
                {editingItem ? 'Editar Huésped' : 'Nuevo Huésped'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingItem(null);
                  setError('');
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
                {/* Error message within modal */}
                {error && (
                  <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-2 rounded-xl text-sm">
                    ⚠️ {error}
                  </div>
                )}

                {/* Paso 1: Solo CI/RIF */}
                {formStep === 1 && (
                  <>
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">🔍</span>
                      </div>
                      <h4 className="text-lg font-semibold text-white">Identificación del Huésped</h4>
                      <p className="text-sm text-slate-400 mt-1">Ingrese el número de identificación (Cédula o RIF)</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        CI/RIF *
                        <span className="text-xs text-slate-500 ml-2">(10 caracteres, comienza con V, J o G)</span>
                      </label>
                      <input
                        type="text"
                        required
                        autoFocus
                        maxLength={10}
                        value={formData.documento}
                        onChange={(e) => setFormData({ ...formData, documento: e.target.value.toUpperCase() })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleNextStep();
                          }
                        }}
                        className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all uppercase text-center text-xl tracking-widest font-mono"
                        placeholder="V123456789"
                      />
                      <p className="text-xs text-slate-500 mt-2 text-center">Presione Enter o click en Continuar</p>
                    </div>
                  </>
                )}

                {/* Paso 2: Resto de datos */}
                {formStep === 2 && (
                  <>
                    <div className="flex items-center gap-3 mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                      <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                        <span className="text-emerald-400 font-mono font-bold">{formData.documento}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-slate-400">CI/RIF confirmado</p>
                        <button
                          type="button"
                          onClick={handlePrevStep}
                          className="text-xs text-emerald-400 hover:text-emerald-300 underline"
                        >
                          Cambiar
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Nombre Completo *
                      </label>
                      <input
                        type="text"
                        required
                        autoFocus
                        value={formData.nombre_completo}
                        onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                        placeholder="Ej: Juan Pérez"
                      />
                      <p className="text-xs text-slate-500 mt-1">Ingrese nombre y apellido separados por espacio</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Teléfono
                      </label>
                      <input
                        type="text"
                        value={formData.telefono}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                        placeholder="Opcional"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                        placeholder="Opcional"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Dirección
                      </label>
                      <textarea
                        value={formData.direccion}
                        onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                        rows={2}
                        placeholder="Opcional"
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="px-6 py-4 border-t border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingItem(null);
                    setError('');
                    resetForm();
                  }}
                  className="px-4 py-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                {formStep === 1 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 hover:shadow-lg"
                  >
                    Continuar →
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 hover:shadow-lg"
                  >
                    {editingItem ? 'Actualizar' : 'Crear'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Datos de Facturación */}
      {showBillingModal && viewingBilling && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full border border-white/10">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center text-sm">
                  📄
                </span>
                Datos de Facturación
              </h3>
              <button
                onClick={() => {
                  setShowBillingModal(false);
                  setViewingBilling(null);
                  setError('');
                }}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleBillingSubmit}>
              <div className="px-6 py-4 space-y-4">
                {/* Error message within modal */}
                {error && (
                  <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-2 rounded-xl text-sm">
                    ⚠️ {error}
                  </div>
                )}
                <p className="text-sm text-slate-400">
                  {viewingBilling.nombre} {viewingBilling.apellido}
                </p>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    RIF / Identificación Fiscal
                  </label>
                  <input
                    type="text"
                    value={billingData.rif}
                    onChange={(e) => setBillingData({ ...billingData, rif: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all uppercase"
                    placeholder="J-12345678-9"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Razón Social
                  </label>
                  <input
                    type="text"
                    value={billingData.razon_social}
                    onChange={(e) => setBillingData({ ...billingData, razon_social: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="Nombre de la empresa o razón social"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Dirección Fiscal
                  </label>
                  <textarea
                    value={billingData.direccion_fiscal}
                    onChange={(e) => setBillingData({ ...billingData, direccion_fiscal: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    rows={2}
                    placeholder="Dirección fiscal para facturación"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Teléfono de Facturación
                  </label>
                  <input
                    type="text"
                    value={billingData.telefono_facturacion}
                    onChange={(e) => setBillingData({ ...billingData, telefono_facturacion: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="Teléfono para facturación"
                  />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowBillingModal(false);
                    setViewingBilling(null);
                    setError('');
                  }}
                  className="px-4 py-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-200 hover:shadow-lg"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
