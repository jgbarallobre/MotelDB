'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Articulo {
  codigo: string;
  descripcion: string;
  departamento: string;
  precio1: number;
  existencia: number;
  iva_porcentaje: number;
  activo: boolean;
}

interface CarritoItem extends Articulo {
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

interface Departamento {
  id: number;
  nombre: string;
  activo: boolean;
}

export default function PuntoDeVentaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [jornadaActiva, setJornadaActiva] = useState<any>(null);
  const [errorJornada, setErrorJornada] = useState<string | null>(null);
  
  // Artículos
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState('');
  const [loadingArticulos, setLoadingArticulos] = useState(false);
  
  // Carrito
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);
  
  // Tasa de cambio
  const [tasaCambio, setTasaCambio] = useState<number>(0);
  
  // Modal de pago
  const [showModalPago, setShowModalPago] = useState(false);
  const [pagos, setPagos] = useState<{ forma_pago: string; monto: number; monto_bs?: number; es_divisa?: boolean; referencia: string; vuelto: number }[]>([]);
  const [metodoPago, setMetodoPago] = useState('EFECTIVO_BS');
  const [montoRecibido, setMontoRecibido] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [errorPago, setErrorPago] = useState<string | null>(null);

  // Quick pay buttons
  const metodosQuickPay = [
    { id: 'EFECTIVO_BS', nombre: 'Efectivo BS', icono: '💵', color: 'from-green-500 to-emerald-600' },
    { id: 'TARJETA_DEBITO', nombre: 'Tarjeta Débito', icono: '💳', color: 'from-blue-500 to-cyan-600' },
    { id: 'TRANSFERENCIA', nombre: 'Transferencia', icono: '🏦', color: 'from-indigo-500 to-purple-600' },
    { id: 'DIVISAS', nombre: 'Divisas', icono: '💲', color: 'from-amber-500 to-yellow-600' },
  ];
  
  // Modal de éxito
  const [showModalExito, setShowModalExito] = useState(false);
  const [ventaExitosa, setVentaExitosa] = useState<any>(null);
  
  // Quick pay modal
  const [showQuickPay, setShowQuickPay] = useState(false);
  
  const searchRef = useRef<HTMLInputElement>(null);

  // Validar jornada al cargar
  useEffect(() => {
    const validarJornada = async () => {
      try {
        const response = await fetch('/api/jornada');
        const result = await response.json();
        
        if (!result.jornadaActiva) {
          setErrorJornada(result.error || 'No hay una jornada activa');
          setLoading(false);
          return;
        }
        
        setJornadaActiva(result.jornadaActiva);
        
        // Cargar tasa de cambio
        const tasaResponse = await fetch('/api/tasas');
        const tasaData = await tasaResponse.json();
        if (tasaData.tasas && tasaData.tasas.length > 0) {
          setTasaCambio(tasaData.tasas[0].tasaCambio);
        }
        
        // Cargar departamentos
        await fetchDepartamentos();
        
        // Cargar artículos
        await fetchArticulos();
        
        setLoading(false);
      } catch (error) {
        console.error('Error validando jornada:', error);
        setErrorJornada('Error al validar la jornada');
        setLoading(false);
      }
    };
    
    validarJornada();
  }, []);

  const fetchDepartamentos = async () => {
    try {
      const response = await fetch('/api/departamentos');
      const data = await response.json();
      setDepartamentos(data.departamentos || []);
    } catch (error) {
      console.error('Error fetching departamentos:', error);
    }
  };

  const fetchArticulos = async (filtro?: string, busquedaFiltro?: string) => {
    setLoadingArticulos(true);
    try {
      let url = '/api/articulos?';
      if (filtro && filtro !== 'todos') {
        url += `departamento=${filtro}`;
      }
      if (busquedaFiltro) {
        url += url.includes('=') ? '&' : '';
        url += `busqueda=${encodeURIComponent(busquedaFiltro)}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      // Filter active articles only
      const articulosActivos = (data.articulos || []).filter((a: Articulo) => a.activo);
      setArticulos(articulosActivos);
    } catch (error) {
      console.error('Error fetching articulos:', error);
    } finally {
      setLoadingArticulos(false);
    }
  };

  const handleDepartamentoChange = (dept: string) => {
    setDepartamentoSeleccionado(dept);
    fetchArticulos(dept, busqueda);
  };

  const handleBusquedaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    setBusqueda(valor);
    fetchArticulos(departamentoSeleccionado, valor);
  };

  const agregarAlCarrito = (articulo: Articulo) => {
    if (articulo.existencia <= 0) {
      return;
    }
    
    const existe = carrito.find(item => item.codigo === articulo.codigo);
    
    if (existe) {
      if (existe.cantidad >= articulo.existencia) {
        return;
      }
      setCarrito(carrito.map(item => 
        item.codigo === articulo.codigo 
          ? { 
              ...item, 
              cantidad: item.cantidad + 1,
              subtotal: (item.cantidad + 1) * item.precioUnitario 
            }
          : item
      ));
    } else {
      setCarrito([...carrito, {
        ...articulo,
        cantidad: 1,
        precioUnitario: articulo.precio1,
        subtotal: articulo.precio1
      }]);
    }
  };

  const actualizarCantidad = (codigo: string, nuevaCantidad: number) => {
    const articulo = articulos.find(a => a.codigo === codigo);
    if (!articulo) return;
    
    if (nuevaCantidad <= 0) {
      setCarrito(carrito.filter(item => item.codigo !== codigo));
      return;
    }
    
    if (nuevaCantidad > articulo.existencia) {
      return;
    }
    
    setCarrito(carrito.map(item => 
      item.codigo === codigo 
        ? { 
            ...item, 
            cantidad: nuevaCantidad,
            subtotal: nuevaCantidad * item.precioUnitario 
          }
        : item
    ));
  };

  const eliminarDelCarrito = (codigo: string) => {
    setCarrito(carrito.filter(item => item.codigo !== codigo));
  };

  const calcularSubtotal = () => {
    return carrito.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const calcularIVA = () => {
    return carrito.reduce((sum, item) => {
      const iva = item.subtotal * (item.iva_porcentaje / 100);
      return sum + iva;
    }, 0);
  };

  const calcularTotal = () => {
    return calcularSubtotal() + calcularIVA();
  };

  const calcularTotalBS = () => {
    return calcularTotal() * tasaCambio;
  };

  const calcularCambio = () => {
    const recibido = parseFloat(montoRecibido) || 0;
    return Math.max(0, recibido - calcularTotalBS());
  };

  const handlePago = async () => {
    setErrorPago(null);
    const totalBS = calcularTotalBS();
    const total$ = calcularTotal();
    
    // Usar el array de pagos si está definido, si no crear uno por defecto
    let pagosArray = pagos;
    
    if (pagosArray.length === 0) {
      // Si no hay pagos definidos, crear uno por defecto con el método seleccionado
      pagosArray = [{
        forma_pago: metodoPago,
        monto: metodoPago === 'DIVISAS' ? total$ : totalBS,
        monto_bs: metodoPago === 'DIVISAS' ? total$ * tasaCambio : totalBS,
        es_divisa: metodoPago === 'DIVISAS',
        referencia: '',
        vuelto: 0
      }];
    }
    
    // Calcular total recibido
    const totalRecibido = pagosArray.reduce((sum, p) => sum + p.monto, 0);
    const totalRecibidoBS = pagosArray.reduce((sum, p) => sum + (p.monto_bs || p.monto * tasaCambio), 0);
    
    if (totalRecibido < total$ && totalRecibidoBS < totalBS) {
      setErrorPago('El monto recibido es menor al total');
      return;
    }
    
    setProcesando(true);
    
    try {
      const response = await fetch('/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: carrito.map(item => ({
            codigo: item.codigo,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            ivaPorcentaje: item.iva_porcentaje
          })),
          pagos: pagosArray,
          metodoPago: 'MULTIPLE',
          montoRecibidoUSD: totalRecibido,
          montoRecibidoBS: totalRecibidoBS,
          tasaCambio,
          usuarioId: jornadaActiva.usuario_id
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Error al procesar venta');
      }
      
      setVentaExitosa(result);
      setShowModalPago(false);
      setShowQuickPay(false);
      setShowModalExito(true);
      setCarrito([]);
      setPagos([]);
      setMontoRecibido('');
      
      // Refresh articles to update inventory
      fetchArticulos(departamentoSeleccionado, busqueda);
      
    } catch (error: any) {
      setErrorPago(error.message);
    } finally {
      setProcesando(false);
    }
  };

  const handleQuickPay = (metodo: string) => {
    const totalBS = calcularTotalBS();
    const total$ = calcularTotal();
    
    // Agregar método de pago rápido
    const nuevoPago = {
      forma_pago: metodo,
      monto: metodo === 'DIVISAS' ? total$ : totalBS,
      monto_bs: metodo === 'DIVISAS' ? total$ * tasaCambio : totalBS,
      es_divisa: metodo === 'DIVISAS',
      referencia: '',
      vuelto: 0
    };
    
    // Verificar si ya existe este método de pago
    const existente = pagos.findIndex(p => p.forma_pago === metodo);
    if (existente >= 0) {
      // Actualizar monto
      const nuevosPagos = [...pagos];
      nuevosPagos[existente] = nuevoPago;
      setPagos(nuevosPagos);
    } else {
      setPagos([...pagos, nuevoPago]);
    }
    
    setShowQuickPay(true);
  };

  const cerrarVenta = () => {
    setShowModalExito(false);
    setVentaExitosa(null);
  };

  const formatearNumero = (num: number) => {
    return num.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Focus search on keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }

  if (errorJornada) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-8 max-w-md text-center">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Jornada Inactiva</h2>
          <p className="text-red-300 mb-4">{errorJornada}</p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col overflow-hidden">
      {/* Top Bar */}
      <header className="bg-slate-800/80 backdrop-blur-md border-b border-slate-700/50 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="hidden sm:inline">Volver</span>
          </button>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">🛒</span>
            <span className="hidden sm:inline">Punto de Venta</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative">
            <input
              ref={searchRef}
              type="text"
              placeholder="Buscar (Ctrl+F)..."
              value={busqueda}
              onChange={handleBusquedaChange}
              className="w-48 md:w-64 bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 pl-10 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 text-sm"
            />
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          {/* Exchange Rate */}
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <span className="text-blue-300 text-xs">Tasa:</span>
            <span className="text-white font-bold text-sm">{formatearNumero(tasaCambio)} BS</span>
          </div>
          
          {/* Shift */}
          <div className="bg-green-500/20 border border-green-500/30 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-green-300 text-xs hidden md:inline">Jornada:</span>
            <span className="text-white font-medium text-sm">{jornadaActiva?.jornada_nombre}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Departments */}
        <aside className="w-56 bg-slate-800/50 border-r border-slate-700/50 flex flex-col shrink-0">
          <div className="p-3 border-b border-slate-700/50">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Departamentos</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <button
              onClick={() => handleDepartamentoChange('todos')}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                departamentoSeleccionado === 'todos'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25'
                  : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              📦 Todos
            </button>
            {departamentos.filter(d => d.activo).map(dept => (
              <button
                key={dept.id}
                onClick={() => handleDepartamentoChange(dept.nombre)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  departamentoSeleccionado === dept.nombre
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25'
                    : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                }`}
              >
                {dept.nombre}
              </button>
            ))}
          </div>
          
          {/* Exchange Rate Card */}
          <div className="p-3 border-t border-slate-700/50">
            <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl p-4 border border-blue-500/20">
              <div className="flex items-center gap-2 text-blue-300 mb-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-medium">Tasa del Día</span>
              </div>
              <p className="text-2xl font-bold text-white">{formatearNumero(tasaCambio)}</p>
              <p className="text-xs text-slate-400">Bolívar(es)</p>
            </div>
          </div>
        </aside>

        {/* Center - Products Grid */}
        <main className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {loadingArticulos ? (
              <div className="col-span-full flex items-center justify-center py-20">
                <div className="text-slate-400 flex items-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Cargando artículos...
                </div>
              </div>
            ) : articulos.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400">
                <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p>No hay artículos disponibles</p>
              </div>
            ) : (
              articulos.map(articulo => (
                <button
                  key={articulo.codigo}
                  onClick={() => agregarAlCarrito(articulo)}
                  disabled={articulo.existencia <= 0}
                  className={`group relative p-3 rounded-xl text-left transition-all hover:scale-105 hover:shadow-xl ${
                    articulo.existencia <= 0
                      ? 'bg-slate-700/20 opacity-40 cursor-not-allowed'
                      : 'bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/50 hover:border-blue-500/30'
                  }`}
                >
                  {/* Product Code */}
                  <div className="text-xs text-slate-500 font-mono mb-1">{articulo.codigo}</div>
                  
                  {/* Product Name */}
                  <div className="text-white font-medium text-sm mb-2 line-clamp-2 leading-tight">
                    {articulo.descripcion}
                  </div>
                  
                  {/* Price */}
                  <div className="mb-2">
                    <div className="text-lg font-bold text-green-400">${formatearNumero(articulo.precio1)}</div>
                    <div className="text-xs text-slate-500">{formatearNumero(articulo.precio1 * tasaCambio)} BS</div>
                  </div>
                  
                  {/* Stock Badge */}
                  <div className={`absolute top-2 right-2 text-xs font-medium px-2 py-0.5 rounded-full ${
                    articulo.existencia <= 0 
                      ? 'bg-red-500/20 text-red-400'
                      : articulo.existencia <= 5 
                        ? 'bg-orange-500/20 text-orange-400'
                        : 'bg-green-500/20 text-green-400'
                  }`}>
                    {articulo.existencia <= 0 ? 'Agotado' : articulo.existencia}
                  </div>
                  
                  {/* Hover Effect */}
                  {articulo.existencia > 0 && (
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 rounded-xl transition-opacity" />
                  )}
                </button>
              ))
            )}
          </div>
        </main>

        {/* Right Sidebar - Cart */}
        <aside className="w-80 bg-slate-800/80 border-l border-slate-700/50 flex flex-col shrink-0">
          {/* Cart Header */}
          <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-xs">🛒</span>
              Carrito
              {carrito.length > 0 && (
                <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {carrito.length}
                </span>
              )}
            </h2>
            {carrito.length > 0 && (
              <button 
                onClick={() => setCarrito([])}
                className="text-xs text-slate-500 hover:text-red-400 transition-colors"
              >
                Limpiar
              </button>
            )}
          </div>
          
          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {carrito.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <svg className="w-16 h-16 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-sm">Carrito vacío</p>
                <p className="text-xs mt-1">Haz clic en un producto para agregarlo</p>
              </div>
            ) : (
              carrito.map(item => (
                <div key={item.codigo} className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/30 hover:border-slate-500/50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium truncate">{item.descripcion}</div>
                      <div className="text-xs text-slate-500">{item.codigo}</div>
                    </div>
                    <button
                      onClick={() => eliminarDelCarrito(item.codigo)}
                      className="text-slate-500 hover:text-red-400 transition-colors ml-2 p-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => actualizarCantidad(item.codigo, item.cantidad - 1)}
                        className="w-7 h-7 bg-slate-600 rounded text-white hover:bg-slate-500 flex items-center justify-center transition-colors"
                      >
                        -
                      </button>
                      <span className="w-10 text-center text-white font-medium">{item.cantidad}</span>
                      <button
                        onClick={() => actualizarCantidad(item.codigo, item.cantidad + 1)}
                        className="w-7 h-7 bg-slate-600 rounded text-white hover:bg-slate-500 flex items-center justify-center transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-bold">${formatearNumero(item.subtotal)}</div>
                      <div className="text-xs text-slate-500">{formatearNumero(item.subtotal * tasaCambio)} BS</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Cart Totals */}
          {carrito.length > 0 && (
            <div className="border-t border-slate-700/50 p-4 space-y-2 bg-slate-800/50">
              <div className="flex justify-between text-slate-400 text-sm">
                <span>Subtotal:</span>
                <span>${formatearNumero(calcularSubtotal())}</span>
              </div>
              <div className="flex justify-between text-slate-400 text-sm">
                <span>IVA:</span>
                <span>${formatearNumero(calcularIVA())}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-white pt-2 border-t border-slate-600/50">
                <span>Total:</span>
                <div className="text-right">
                  <div>${formatearNumero(calcularTotal())}</div>
                  <div className="text-sm text-slate-400">{formatearNumero(calcularTotalBS())} BS</div>
                </div>
              </div>
              
              {/* Quick Pay Buttons */}
              <div className="grid grid-cols-3 gap-2 pt-3">
                <button
                  onClick={() => handleQuickPay('efectivo')}
                  className="bg-green-600 hover:bg-green-500 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors flex flex-col items-center"
                >
                  <span className="text-lg mb-0.5">💵</span>
                  Efectivo
                </button>
                <button
                  onClick={() => handleQuickPay('tarjeta')}
                  className="bg-blue-600 hover:bg-blue-500 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors flex flex-col items-center"
                >
                  <span className="text-lg mb-0.5">💳</span>
                  Tarjeta
                </button>
                <button
                  onClick={() => handleQuickPay('transferencia')}
                  className="bg-purple-600 hover:bg-purple-500 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors flex flex-col items-center"
                >
                  <span className="text-lg mb-0.5">📱</span>
                  Transfer
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Payment Modal */}
      {showQuickPay && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">💰 Procesar Pago</h2>
              <button 
                onClick={() => setShowQuickPay(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Order Summary */}
            <div className="bg-slate-700/30 rounded-xl p-4 mb-6">
              <div className="flex justify-between text-slate-300 mb-2">
                <span>Artículos:</span>
                <span>{carrito.reduce((sum, item) => sum + item.cantidad, 0)}</span>
              </div>
              <div className="flex justify-between text-slate-300 mb-2">
                <span>Subtotal:</span>
                <span>${formatearNumero(calcularSubtotal())}</span>
              </div>
              <div className="flex justify-between text-slate-300 mb-2">
                <span>IVA:</span>
                <span>${formatearNumero(calcularIVA())}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-white pt-2 border-t border-slate-600">
                <span>Total:</span>
                <div className="text-right">
                  <div>${formatearNumero(calcularTotal())}</div>
                  <div className="text-sm text-slate-400">{formatearNumero(calcularTotalBS())} BS</div>
                </div>
              </div>
            </div>
            
            {/* Payment Method */}
            <div className="mb-4">
              <label className="block text-slate-300 text-sm mb-2">Método de Pago</label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="efectivo">💵 Efectivo</option>
                <option value="tarjeta">💳 Tarjeta</option>
                <option value="transferencia">📱 Transferencia</option>
              </select>
            </div>
            
            {/* Amount Received */}
            <div className="mb-6">
              <label className="block text-slate-300 text-sm mb-2">Monto Recibido (BS)</label>
              <input
                type="number"
                value={montoRecibido}
                onChange={(e) => setMontoRecibido(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white text-xl font-bold focus:outline-none focus:border-blue-500"
              />
              {montoRecibido && (
                <div className="mt-2 text-right">
                  <span className="text-slate-400 text-sm">Cambio: </span>
                  <span className="text-green-400 font-bold">{formatearNumero(calcularCambio())} BS</span>
                </div>
              )}
            </div>
            
            {errorPago && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {errorPago}
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowQuickPay(false)}
                className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-3 px-4 rounded-xl font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handlePago}
                disabled={procesando || !montoRecibido}
                className="flex-1 bg-green-600 hover:bg-green-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                {procesando ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Procesando...
                  </>
                ) : (
                  <>✅ Cobrar</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showModalExito && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 w-full max-w-lg shadow-2xl text-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl">✅</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">¡Venta Exitosa!</h2>
            <p className="text-slate-400 mb-6">La transacción se ha completado correctamente</p>
            
            <div className="bg-slate-700/30 rounded-xl p-4 mb-6 text-left">
              <div className="flex justify-between text-slate-300 mb-2">
                <span>Número de Venta:</span>
                <span className="text-white font-bold">#{ventaExitosa?.venta?.id}</span>
              </div>
              <div className="flex justify-between text-slate-300 mb-2">
                <span>Total:</span>
                <span className="text-green-400 font-bold">${formatearNumero(calcularTotal())}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Método:</span>
                <span className="text-white font-medium capitalize">{metodoPago}</span>
              </div>
            </div>
            
            <button
              onClick={cerrarVenta}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 px-6 rounded-xl font-medium transition-colors"
            >
              Nueva Venta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
