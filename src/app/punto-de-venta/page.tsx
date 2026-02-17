'use client';

import { useEffect, useState } from 'react';
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

interface DatosTasa {
  tasaCambio: number;
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
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [montoRecibido, setMontoRecibido] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [errorPago, setErrorPago] = useState<string | null>(null);
  
  // Modal de éxito
  const [showModalExito, setShowModalExito] = useState(false);
  const [ventaExitosa, setVentaExitosa] = useState<any>(null);

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
      alert('Artículo sin existencia');
      return;
    }
    
    const existe = carrito.find(item => item.codigo === articulo.codigo);
    
    if (existe) {
      if (existe.cantidad >= articulo.existencia) {
        alert('No hay más existencia disponible');
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
      alert('No hay suficiente existencia');
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
    const recibido = parseFloat(montoRecibido) || 0;
    
    if (recibido < totalBS) {
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
          metodoPago,
          montoRecibidoUSD: calcularTotal(),
          montoRecibidoBS: totalBS,
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
      setShowModalExito(true);
      setCarrito([]);
      setMontoRecibido('');
      
      // Refresh articles to update inventory
      fetchArticulos(departamentoSeleccionado, busqueda);
      
    } catch (error: any) {
      setErrorPago(error.message);
    } finally {
      setProcesando(false);
    }
  };

  const cerrarVenta = () => {
    setShowModalExito(false);
    setVentaExitosa(null);
  };

  const formatearNumero = (num: number) => {
    return num.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-md border-b border-slate-700/50 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/dashboard')}
              className="text-slate-400 hover:text-white transition-colors"
            >
              ← Volver
            </button>
            <h1 className="text-2xl font-bold text-white">🛒 Punto de Venta</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg px-4 py-2">
              <span className="text-blue-300 text-sm">Tasa:</span>
              <span className="text-white font-bold ml-2">${tasaCambio.toFixed(2)} BS</span>
            </div>
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg px-4 py-2">
              <span className="text-green-300 text-sm">Jornada:</span>
              <span className="text-white font-bold ml-2">{jornadaActiva?.jornada_nombre}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Panel - Departments */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-800/50 backdrop-blur-md rounded-xl p-4 border border-slate-700/50">
            <h2 className="text-lg font-semibold text-white mb-4">Departamentos</h2>
            <div className="space-y-2">
              <button
                onClick={() => handleDepartamentoChange('todos')}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  departamentoSeleccionado === 'todos'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                Todos
              </button>
              {departamentos.filter(d => d.activo).map(dept => (
                <button
                  key={dept.id}
                  onClick={() => handleDepartamentoChange(dept.nombre)}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    departamentoSeleccionado === dept.nombre
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {dept.nombre}
                </button>
              ))}
            </div>
          </div>

          {/* Tasa Card */}
          <div className="bg-blue-500/10 backdrop-blur-md rounded-xl p-4 border border-blue-500/20">
            <h3 className="text-blue-300 text-sm font-semibold mb-2">💱 Tasa de Cambio</h3>
            <p className="text-3xl font-bold text-white">{formatearNumero(tasaCambio)} BS</p>
          </div>
        </div>

        {/* Center Panel - Products */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search */}
          <div className="bg-slate-800/50 backdrop-blur-md rounded-xl p-4 border border-slate-700/50">
            <input
              type="text"
              placeholder="Buscar artículos por código o descripción..."
              value={busqueda}
              onChange={handleBusquedaChange}
              className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Products Grid */}
          <div className="bg-slate-800/50 backdrop-blur-md rounded-xl p-4 border border-slate-700/50">
            <h2 className="text-lg font-semibold text-white mb-4">Catálogo de Artículos</h2>
            
            {loadingArticulos ? (
              <div className="text-center text-slate-400 py-8">Cargando artículos...</div>
            ) : articulos.length === 0 ? (
              <div className="text-center text-slate-400 py-8">No hay artículos disponibles</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {articulos.map(articulo => (
                  <button
                    key={articulo.codigo}
                    onClick={() => agregarAlCarrito(articulo)}
                    disabled={articulo.existencia <= 0}
                    className={`p-4 rounded-xl text-left transition-all hover:scale-105 ${
                      articulo.existencia <= 0
                        ? 'bg-slate-700/30 opacity-50 cursor-not-allowed'
                        : 'bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50'
                    }`}
                  >
                    <div className="text-xs text-slate-400 mb-1">{articulo.codigo}</div>
                    <div className="text-white font-medium text-sm mb-2 line-clamp-2">{articulo.descripcion}</div>
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="text-lg font-bold text-green-400">${formatearNumero(articulo.precio1)}</div>
                        <div className="text-xs text-slate-400">{formatearNumero(articulo.precio1 * tasaCambio)} BS</div>
                      </div>
                      <div className={`text-xs ${articulo.existencia <= 5 ? 'text-red-400' : 'text-slate-400'}`}>
                        Stock: {articulo.existencia}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Cart */}
        <div className="lg:col-span-1">
          <div className="bg-slate-800/50 backdrop-blur-md rounded-xl p-4 border border-slate-700/50 sticky top-6">
            <h2 className="text-lg font-semibold text-white mb-4">🛒 Carrito</h2>
            
            {carrito.length === 0 ? (
              <div className="text-slate-400 text-center py-8">El carrito está vacío</div>
            ) : (
              <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                {carrito.map(item => (
                  <div key={item.codigo} className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/30">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-white text-sm font-medium flex-1 line-clamp-2">{item.descripcion}</div>
                      <button
                        onClick={() => eliminarDelCarrito(item.codigo)}
                        className="text-red-400 hover:text-red-300 ml-2"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => actualizarCantidad(item.codigo, item.cantidad - 1)}
                          className="w-6 h-6 bg-slate-600 rounded text-white hover:bg-slate-500"
                        >
                          -
                        </button>
                        <span className="text-white w-8 text-center">{item.cantidad}</span>
                        <button
                          onClick={() => actualizarCantidad(item.codigo, item.cantidad + 1)}
                          className="w-6 h-6 bg-slate-600 rounded text-white hover:bg-slate-500"
                        >
                          +
                        </button>
                      </div>
                      <div className="text-right">
                        <div className="text-green-400 font-bold">${formatearNumero(item.subtotal)}</div>
                        <div className="text-xs text-slate-400">{formatearNumero(item.subtotal * tasaCambio)} BS</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Totals */}
            {carrito.length > 0 && (
              <div className="border-t border-slate-600/50 pt-4 space-y-2">
                <div className="flex justify-between text-slate-300">
                  <span>Subtotal:</span>
                  <span>${formatearNumero(calcularSubtotal())}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>IVA:</span>
                  <span>${formatearNumero(calcularIVA())}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-white pt-2 border-t border-slate-600/50">
                  <span>Total:</span>
                  <div className="text-right">
                    <div>${formatearNumero(calcularTotal())}</div>
                    <div className="text-sm text-slate-400">{formatearNumero(calcularTotalBS())} BS</div>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowModalPago(true)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors mt-4"
                >
                  💳 Procesar Pago
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showModalPago && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full mx-4 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-4">💳 Procesar Pago</h2>
            
            <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
              <div className="text-slate-300 text-sm">Total a Pagar</div>
              <div className="text-3xl font-bold text-green-400">${formatearNumero(calcularTotal())}</div>
              <div className="text-slate-400">{formatearNumero(calcularTotalBS())} BS</div>
            </div>

            <div className="mb-4">
              <label className="block text-slate-300 text-sm mb-2">Método de Pago</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'efectivo', label: '💵 Efectivo' },
                  { value: 'tarjeta', label: '💳 Tarjeta' },
                  { value: 'transferencia', label: '🏦 Transferencia' },
                  { value: 'mixto', label: '💰 Mixto' }
                ].map(mp => (
                  <button
                    key={mp.value}
                    onClick={() => setMetodoPago(mp.value)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      metodoPago === mp.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {mp.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-slate-300 text-sm mb-2">Monto Recibido (BS)</label>
              <input
                type="number"
                value={montoRecibido}
                onChange={(e) => setMontoRecibido(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white text-xl focus:outline-none focus:border-blue-500"
              />
              {montoRecibido && (
                <div className="mt-2 text-green-400">
                  Cambio: {formatearNumero(calcularCambio())} BS
                </div>
              )}
            </div>

            {errorPago && (
              <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 mb-4">
                <p className="text-red-400 text-sm">{errorPago}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowModalPago(false);
                  setErrorPago(null);
                }}
                className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-3 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handlePago}
                disabled={procesando || !montoRecibido}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white py-3 rounded-lg transition-colors"
              >
                {procesando ? 'Procesando...' : '✅ Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showModalExito && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full mx-4 border border-green-500/30">
            <div className="text-center">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-white mb-2">Venta Exitosa!</h2>
              <p className="text-slate-300 mb-4">La venta se ha procesado correctamente</p>
              
              {ventaExitosa && (
                <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
                  <div className="text-green-400 font-bold text-xl mb-2">
                    ${formatearNumero(ventaExitosa.venta?.monto_total || calcularTotal())}
                  </div>
                  <div className="text-slate-400 text-sm">
                    Folio: {ventaExitosa.venta?.id}
                  </div>
                </div>
              )}
              
              <button
                onClick={cerrarVenta}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors"
              >
                Nueva Venta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
