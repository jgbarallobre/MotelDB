'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Articulo {
  codigo: string;
  descripcion: string;
  departamento: string;
  departamento_descripcion?: string;
  tipo_iva: string;
  tipo_iva_descripcion?: string;
  iva_porcentaje?: number;
  precio1: number;
  precio2: number;
  precio3: number;
  precio1_sin_iva?: number;
  precio2_sin_iva?: number;
  precio3_sin_iva?: number;
  existencia: number;
  inactivo: boolean;
  fecha_creacion: string;
  stock_min: number;
  stock_max: number;
}

interface Departamento {
  codigo: string;
  descripcion: string;
}

interface TipoIva {
  codigo: string;
  descripcion: string;
  valor: number;
}

export default function ArticulosPage() {
  const router = useRouter();
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [tiposIva, setTiposIva] = useState<TipoIva[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBrowserArticulo, setShowBrowserArticulo] = useState(false);
  const [showBrowserDepto, setShowBrowserDepto] = useState(false);
  const [editingArticulo, setEditingArticulo] = useState<Articulo | null>(null);
  const [browserMode, setBrowserMode] = useState<'articulo' | 'departamento'>('articulo');
  const [searchBrowser, setSearchBrowser] = useState('');
  const [browserResults, setBrowserResults] = useState<Articulo[] | Departamento[]>([]);
  
  const [formData, setFormData] = useState({
    codigo: '',
    descripcion: '',
    departamento: '',
    tipo_iva: '01',
    precio1: 0,
    precio2: 0,
    precio3: 0,
    existencia: 0,
    inactivo: false,
    stock_min: 0,
    stock_max: 0
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchArticulos();
    fetchDepartamentos();
    fetchTiposIva();
  }, []);

  const fetchArticulos = async () => {
    try {
      const res = await fetch('/api/articulos');
      if (res.ok) {
        const data = await res.json();
        setArticulos(data);
      }
    } catch (error) {
      console.error('Error fetching articulos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartamentos = async () => {
    try {
      const res = await fetch('/api/departamentos');
      if (res.ok) {
        const data = await res.json();
        setDepartamentos(data.filter((d: Departamento & { activo?: boolean }) => d.activo !== false));
      }
    } catch (error) {
      console.error('Error fetching departamentos:', error);
    }
  };

  const fetchTiposIva = async () => {
    try {
      const res = await fetch('/api/tipos-iva');
      if (res.ok) {
        const data = await res.json();
        setTiposIva(data.filter((t: TipoIva) => t.valor !== undefined));
      }
    } catch (error) {
      console.error('Error fetching tipos IVA:', error);
    }
  };

  const filteredArticulos = articulos.filter(a => 
    a.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.departamento_descripcion || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openBrowser = (mode: 'articulo' | 'departamento') => {
    setBrowserMode(mode);
    setSearchBrowser('');
    setBrowserResults([]);
    if (mode === 'articulo') {
      setShowBrowserArticulo(true);
    } else {
      setBrowserDeptoResults();
      setShowBrowserDepto(true);
    }
  };

  const searchBrowserData = async () => {
    if (browserMode === 'articulo') {
      try {
        const res = await fetch(`/api/articulos/buscar?q=${encodeURIComponent(searchBrowser)}`);
        if (res.ok) {
          const data = await res.json();
          setBrowserResults(data);
        }
      } catch (error) {
        console.error('Error searching:', error);
      }
    } else {
      // Filter departamentos locally
      const filtered = departamentos.filter(d => 
        d.codigo.toLowerCase().includes(searchBrowser.toLowerCase()) ||
        d.descripcion.toLowerCase().includes(searchBrowser.toLowerCase())
      );
      setBrowserResults(filtered);
    }
  };

  const setBrowserDeptoResults = () => {
    setBrowserResults(departamentos);
  };

  useEffect(() => {
    if (searchBrowser) {
      const timer = setTimeout(searchBrowserData, 300);
      return () => clearTimeout(timer);
    } else if (browserMode === 'departamento') {
      setBrowserDeptoResults();
    }
  }, [searchBrowser, browserMode]);

  const selectBrowserItem = (item: Articulo | Departamento) => {
    if (browserMode === 'articulo') {
      const articulo = item as Articulo;
      setEditingArticulo(articulo);
      setFormData({
        codigo: articulo.codigo,
        descripcion: articulo.descripcion,
        departamento: articulo.departamento,
        tipo_iva: articulo.tipo_iva,
        precio1: articulo.precio1,
        precio2: articulo.precio2,
        precio3: articulo.precio3,
        existencia: articulo.existencia,
        inactivo: articulo.inactivo,
        stock_min: articulo.stock_min,
        stock_max: articulo.stock_max
      });
      setShowBrowserArticulo(false);
    } else {
      const depto = item as Departamento;
      setFormData({ ...formData, departamento: depto.codigo });
      setShowBrowserDepto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validaciones
    if (!formData.codigo || formData.codigo.length > 15) {
      setError('El código debe tener máximo 15 caracteres');
      return;
    }

    if (!formData.descripcion || formData.descripcion.length > 60) {
      setError('La descripción debe tener máximo 60 caracteres');
      return;
    }

    if (!formData.departamento || formData.departamento.length > 4) {
      setError('El departamento debe tener máximo 4 caracteres');
      return;
    }

    // Verificar que el código no exista (solo para nuevos)
    if (!editingArticulo) {
      const exists = articulos.find(a => a.codigo.toUpperCase() === formData.codigo.toUpperCase());
      if (exists) {
        setError('Ya existe un artículo con este código');
        return;
      }
    }

    try {
      const url = editingArticulo 
        ? `/api/articulos/${editingArticulo.codigo}`
        : '/api/articulos';
      
      const method = editingArticulo ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setSuccess(editingArticulo ? 'Artículo actualizado exitosamente' : 'Artículo creado exitosamente');
        setShowModal(false);
        setEditingArticulo(null);
        resetForm();
        fetchArticulos();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Error al guardar artículo');
      }
    } catch (error) {
      setError('Error al guardar artículo');
    }
  };

  const handleEdit = (articulo: Articulo) => {
    setEditingArticulo(articulo);
    setFormData({
      codigo: articulo.codigo,
      descripcion: articulo.descripcion,
      departamento: articulo.departamento,
      tipo_iva: articulo.tipo_iva,
      precio1: articulo.precio1,
      precio2: articulo.precio2,
      precio3: articulo.precio3,
      existencia: articulo.existencia,
      inactivo: articulo.inactivo,
      stock_min: articulo.stock_min,
      stock_max: articulo.stock_max
    });
    setShowModal(true);
  };

  const handleDelete = async (codigo: string) => {
    if (!confirm('¿Estás seguro de eliminar este artículo?')) return;

    try {
      const res = await fetch(`/api/articulos/${codigo}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setSuccess('Artículo eliminado exitosamente');
        fetchArticulos();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Error al eliminar artículo');
      }
    } catch (error) {
      setError('Error al eliminar artículo');
    }
  };

  const handleToggleInactivo = async (articulo: Articulo) => {
    try {
      const res = await fetch(`/api/articulos/${articulo.codigo}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inactivo: !articulo.inactivo })
      });

      if (res.ok) {
        fetchArticulos();
      }
    } catch (error) {
      console.error('Error toggling articulo:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      codigo: '',
      descripcion: '',
      departamento: '',
      tipo_iva: '01',
      precio1: 0,
      precio2: 0,
      precio3: 0,
      existencia: 0,
      inactivo: false,
      stock_min: 0,
      stock_max: 0
    });
  };

  const openNewModal = () => {
    setEditingArticulo(null);
    resetForm();
    setShowModal(true);
  };

  const getIvaPorcentaje = (codigo: string) => {
    const tipo = tiposIva.find(t => t.codigo === codigo);
    return tipo?.valor || 0;
  };

  const formatPrice = (price: number, ivaCode: string) => {
    const ivaPorcentaje = getIvaPorcentaje(ivaCode);
    const sinIva = price / (1 + ivaPorcentaje / 100);
    return {
      conIva: price.toFixed(2),
      sinIva: sinIva.toFixed(2)
    };
  };

  const getCurrentIvaPorcentaje = () => {
    return getIvaPorcentaje(formData.tipo_iva);
  };

  const getPrecioConIva = (precio: number) => {
    const ivaPorcentaje = getCurrentIvaPorcentaje();
    return (precio / (1 + ivaPorcentaje / 100)).toFixed(2);
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
                <span className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center text-2xl">
                  📦
                </span>
                Artículos
              </h1>
            </div>
            <button
              onClick={openNewModal}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/25"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Nuevo Artículo</span>
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

        {/* Campo de Búsqueda */}
        <div className="mb-4">
          <div className="relative max-w-md">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pl-12 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Buscar por código, descripción o departamento..."
            />
            <svg 
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          </div>
        ) : (
          /* Tabla de Artículos */
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Depto
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      IVA
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      P1 (c/IVA)
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      P1 (s/IVA)
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Exist
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-4 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredArticulos.map((articulo) => {
                    const prices = formatPrice(articulo.precio1, articulo.tipo_iva);
                    return (
                      <tr key={articulo.codigo} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">
                            {articulo.codigo}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-slate-300 max-w-[200px] truncate">
                            {articulo.descripcion}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-300">
                            {articulo.departamento}
                          </div>
                          <div className="text-xs text-slate-500">
                            {articulo.departamento_descripcion}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-300">
                            {articulo.tipo_iva}
                          </div>
                          <div className="text-xs text-slate-500">
                            {articulo.iva_porcentaje}%
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-white font-medium">
                            ${articulo.precio1.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-green-400 font-medium">
                            ${prices.sinIva}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-300">
                            {articulo.existencia.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleInactivo(articulo)}
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              articulo.inactivo 
                                ? 'bg-red-500/20 text-red-400' 
                                : 'bg-green-500/20 text-green-400'
                            }`}
                          >
                            {articulo.inactivo ? 'Inactivo' : 'Activo'}
                          </button>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => handleEdit(articulo)}
                            className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(articulo.codigo)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredArticulos.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                No hay artículos registrados
              </div>
            )}
            {filteredArticulos.length > 0 && searchTerm && (
              <div className="px-4 py-3 bg-white/5 border-t border-white/10 text-sm text-slate-400">
                Mostrando {filteredArticulos.length} de {articulos.length} artículos
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal Crear/Editar Artículo */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">
                {editingArticulo ? 'Editar Artículo' : 'Nuevo Artículo'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Código */}
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-3">
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Código <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.codigo}
                      onChange={(e) => setFormData({ ...formData, codigo: e.target.value.slice(0, 15).toUpperCase() })}
                      maxLength={15}
                      disabled={!!editingArticulo}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
                      placeholder="Código del artículo"
                    />
                  </div>
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    &nbsp;
                  </label>
                  <button
                    type="button"
                    onClick={() => openBrowser('articulo')}
                    disabled={!!editingArticulo}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-slate-300 hover:bg-white/20 hover:text-white transition-all disabled:opacity-50"
                  >
                    <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Descripción <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value.slice(0, 60) })}
                  maxLength={60}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Descripción del artículo (máx 60 caracteres)"
                />
              </div>

              {/* Departamento */}
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-3">
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Departamento <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.departamento}
                    onChange={(e) => setFormData({ ...formData, departamento: e.target.value.slice(0, 4).toUpperCase() })}
                    maxLength={4}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Código de departamento"
                  />
                  {formData.departamento && (
                    <div className="mt-1 text-xs text-slate-400">
                      {departamentos.find(d => d.codigo === formData.departamento)?.descripcion || 'Departamento no encontrado'}
                    </div>
                  )}
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    &nbsp;
                  </label>
                  <button
                    type="button"
                    onClick={() => openBrowser('departamento')}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-slate-300 hover:bg-white/20 hover:text-white transition-all"
                  >
                    <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Tipo IVA */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Tipo IVA <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.tipo_iva}
                  onChange={(e) => setFormData({ ...formData, tipo_iva: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {tiposIva.map(tipo => (
                    <option key={tipo.codigo} value={tipo.codigo}>
                      {tipo.codigo} - {tipo.descripcion} ({tipo.valor}%)
                    </option>
                  ))}
                </select>
              </div>

              {/* Precios */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Precio 1 <span className="text-green-400">(sin IVA: ${getPrecioConIva(formData.precio1)})</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.precio1}
                    onChange={(e) => setFormData({ ...formData, precio1: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Precio 2 <span className="text-green-400">(sin IVA: ${getPrecioConIva(formData.precio2)})</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.precio2}
                    onChange={(e) => setFormData({ ...formData, precio2: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Precio 3 <span className="text-green-400">(sin IVA: ${getPrecioConIva(formData.precio3)})</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.precio3}
                    onChange={(e) => setFormData({ ...formData, precio3: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Existencia - Solo lectura al editar */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Existencia {editingArticulo && <span className="text-amber-400 text-xs">(solo lectura)</span>}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.existencia}
                  onChange={(e) => !editingArticulo && setFormData({ ...formData, existencia: parseFloat(e.target.value) || 0 })}
                  disabled={!!editingArticulo}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
                />
              </div>

              {/* Stock Min/Max */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Stock Mínimo
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.stock_min}
                    onChange={(e) => setFormData({ ...formData, stock_min: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Stock Máximo
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.stock_max}
                    onChange={(e) => setFormData({ ...formData, stock_max: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Inactivo */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="inactivo"
                  checked={formData.inactivo}
                  onChange={(e) => setFormData({ ...formData, inactivo: e.target.checked })}
                  className="w-5 h-5 rounded bg-white/10 border-white/20 text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="inactivo" className="text-sm text-slate-300">
                  Inactivo
                </label>
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingArticulo(null); resetForm(); }}
                  className="px-4 py-2.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-6 py-2.5 rounded-xl transition-all"
                >
                  {editingArticulo ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Buscar Artículo */}
      {showBrowserArticulo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl border border-white/10 w-full max-w-lg max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h3 className="text-lg font-bold text-white mb-3">Buscar Artículo</h3>
              <input
                type="text"
                value={searchBrowser}
                onChange={(e) => setSearchBrowser(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Buscar por código o descripción..."
                autoFocus
              />
            </div>
            <div className="overflow-y-auto max-h-96">
              {(browserResults as Articulo[]).map((articulo) => (
                <button
                  key={articulo.codigo}
                  onClick={() => selectBrowserItem(articulo)}
                  className="w-full p-4 text-left hover:bg-white/5 border-b border-white/5 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-white font-medium">{articulo.codigo}</div>
                      <div className="text-slate-400 text-sm">{articulo.descripcion}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-amber-400">${articulo.precio1.toFixed(2)}</div>
                      <div className="text-slate-500 text-xs">{articulo.departamento}</div>
                    </div>
                  </div>
                </button>
              ))}
              {(browserResults as Articulo[]).length === 0 && searchBrowser && (
                <div className="p-4 text-center text-slate-400">
                  No se encontraron artículos
                </div>
              )}
            </div>
            <div className="p-4 border-t border-white/10">
              <button
                onClick={() => setShowBrowserArticulo(false)}
                className="w-full px-4 py-2.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Buscar Departamento */}
      {showBrowserDepto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl border border-white/10 w-full max-w-lg max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h3 className="text-lg font-bold text-white mb-3">Buscar Departamento</h3>
              <input
                type="text"
                value={searchBrowser}
                onChange={(e) => setSearchBrowser(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Buscar por código o descripción..."
                autoFocus
              />
            </div>
            <div className="overflow-y-auto max-h-96">
              {(browserResults as Departamento[]).map((depto) => (
                <button
                  key={depto.codigo}
                  onClick={() => selectBrowserItem(depto)}
                  className="w-full p-4 text-left hover:bg-white/5 border-b border-white/5 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-white font-medium">{depto.codigo}</div>
                      <div className="text-slate-400 text-sm">{depto.descripcion}</div>
                    </div>
                  </div>
                </button>
              ))}
              {(browserResults as Departamento[]).length === 0 && (
                <div className="p-4 text-center text-slate-400">
                  No se encontraron departamentos
                </div>
              )}
            </div>
            <div className="p-4 border-t border-white/10">
              <button
                onClick={() => setShowBrowserDepto(false)}
                className="w-full px-4 py-2.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
