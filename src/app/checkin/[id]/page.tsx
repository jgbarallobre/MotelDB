"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface TipoEstadia {
  id: number;
  nombre: string;
  descripcion: string;
  duracion_horas: number;
  precio: number;
  precio_adicional: number;
}

interface Cliente {
  id?: number;
  nombre: string;
  documento: string;
  telefono: string;
}

interface Habitacion {
  id: number;
  numero: string;
  tipo: string;
  precio_hora: number;
  precio_noche: number;
  estado: string;
  descripcion: string;
}

function CheckinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const habitacionId = searchParams.get('habitacion_id');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [habitacion, setHabitacion] = useState<Habitacion | null>(null);
  const [tiposEstadia, setTiposEstadia] = useState<TipoEstadia[]>([]);
  const [tasaCambio, setTasaCambio] = useState<number>(1);
  
  const [tipoEstadiaSeleccionado, setTipoEstadiaSeleccionado] = useState<TipoEstadia | null>(null);
  const [cliente, setCliente] = useState<Cliente>({
    nombre: '',
    documento: '',
    telefono: ''
  });
  const [clienteEncontrado, setClienteEncontrado] = useState(false);
  const [buscandoCliente, setBuscandoCliente] = useState(false);

  useEffect(() => {
    if (habitacionId) {
      fetchData();
    }
  }, [habitacionId]);

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/checkin?habitacion_id=${habitacionId}`);
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
        return;
      }

      setHabitacion(data.habitacion);
      setTiposEstadia(data.tiposEstadia);
      setTasaCambio(data.tasaCambio);
      
      // Seleccionar primer tipo de estadía por defecto
      if (data.tiposEstadia.length > 0) {
        setTipoEstadiaSeleccionado(data.tiposEstadia[0]);
      }
    } catch (err) {
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  // Validar documento (V, J, G + números)
  const validarDocumento = (valor: string): boolean => {
    const regex = /^[VvJjGg]\d{5,8}$/;
    return regex.test(valor);
  };

  // Buscar cliente cuando ingresa documento
  const buscarCliente = async (documento: string) => {
    if (documento.length < 6) return;
    
    if (!validarDocumento(documento)) {
      return;
    }

    setBuscandoCliente(true);
    try {
      const response = await fetch(`/api/clientes/buscar?documento=${documento}`);
      const data = await response.json();
      
      if (data.existe && data.cliente) {
        setCliente({
          nombre: data.cliente.nombre,
          documento: data.cliente.documento,
          telefono: data.cliente.telefono || ''
        });
        setClienteEncontrado(true);
      } else {
        setClienteEncontrado(false);
      }
    } catch (err) {
      console.error('Error buscando cliente:', err);
    } finally {
      setBuscandoCliente(false);
    }
  };

  const handleDocumentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value.toUpperCase();
    setCliente({ ...cliente, documento: valor });
    setClienteEncontrado(false);
    
    if (valor.length >= 6) {
      buscarCliente(valor);
    }
  };

  const calcularPrecioBS = () => {
    if (!tipoEstadiaSeleccionado) return 0;
    return tipoEstadiaSeleccionado.precio * tasaCambio;
  };

  const handlePagar = () => {
    if (!tipoEstadiaSeleccionado || !cliente.documento || !cliente.nombre) {
      alert('Por favor complete todos los datos requeridos');
      return;
    }

    if (!validarDocumento(cliente.documento)) {
      alert('Documento inválido. Debe empezar con V, J o G seguido de números');
      return;
    }

    // Guardar datos en sessionStorage para la página de pago
    sessionStorage.setItem('checkin_data', JSON.stringify({
      habitacion_id: habitacionId,
      tipo_estadia_id: tipoEstadiaSeleccionado.id,
      tipo_estadia: tipoEstadiaSeleccionado,
      cliente,
      tasaCambio
    }));

    router.push(`/checkin/${habitacionId}/pago`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-slate-400">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 text-center">
          <p className="text-red-400 text-lg mb-4">{error}</p>
          <Link href="/lobby" className="text-blue-400 hover:text-blue-300">
            ← Volver al Lobby
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/lobby" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-2xl">
                    🏠
                  </span>
                  Check-in
                </h1>
                <p className="text-slate-400 text-sm">Habitación {habitacion?.numero}</p>
              </div>
            </div>
            <div className="bg-green-500/20 px-4 py-2 rounded-full border border-green-500/30">
              <span className="text-green-400 font-medium">{habitacion?.estado}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Habitación Info */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Habitación #{habitacion?.numero}</h2>
              <p className="text-slate-400">{habitacion?.tipo}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-sm">Tipo de Habitación</p>
              <p className="text-white font-medium">{habitacion?.descripcion || 'Standard'}</p>
            </div>
          </div>
        </div>

        {/* Tipo de Estadía */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              ⏱️
            </span>
            Seleccionar Tipo de Estadía
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tiposEstadia.map((tipo) => (
              <button
                key={tipo.id}
                onClick={() => setTipoEstadiaSeleccionado(tipo)}
                className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                  tipoEstadiaSeleccionado?.id === tipo.id
                    ? 'bg-blue-500/20 border-blue-500'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white text-lg">{tipo.nombre}</h3>
                    <p className="text-slate-400 text-sm">{tipo.duracion_horas} horas</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-400">${tipo.precio.toFixed(2)}</p>
                    <p className="text-slate-400 text-xs">BS {(tipo.precio * tasaCambio).toFixed(2)}</p>
                  </div>
                </div>
                {tipo.descripcion && (
                  <p className="text-slate-400 text-sm mt-2">{tipo.descripcion}</p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Datos del Cliente */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
              👤
            </span>
            Datos del Cliente / Huésped
          </h2>

          {clienteEncontrado && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-300">Cliente encontrado en nuestra base de datos</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Cédula / RIF *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={cliente.documento}
                  onChange={handleDocumentoChange}
                  placeholder="V12345678"
                  maxLength={9}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                />
                {buscandoCliente && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                  </div>
                )}
              </div>
              <p className="text-slate-500 text-xs mt-1">Comienza con V, J o G seguido de números</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nombre del Cliente *
              </label>
              <input
                type="text"
                value={cliente.nombre}
                onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })}
                placeholder="Nombre completo"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Teléfono (Opcional)
              </label>
              <input
                type="tel"
                value={cliente.telefono}
                onChange={(e) => setCliente({ ...cliente, telefono: e.target.value })}
                placeholder="Número de teléfono"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Resumen del Monto */}
        {tipoEstadiaSeleccionado && (
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-xl rounded-2xl border border-green-500/30 p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                💰
              </span>
              Monto a Cobrar
            </h2>
            
            <div className="flex justify-between items-center py-4 border-b border-white/10">
              <span className="text-slate-300">Tipo de Estadía</span>
              <span className="text-white font-medium">{tipoEstadiaSeleccionado.nombre} ({tipoEstadiaSeleccionado.duracion_horas}h)</span>
            </div>
            
            <div className="flex justify-between items-center py-4 border-b border-white/10">
              <span className="text-slate-300">Tasa de Cambio</span>
              <span className="text-white">BS {tasaCambio.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center py-4">
              <span className="text-slate-300 text-lg">Total</span>
              <div className="text-right">
                <p className="text-3xl font-bold text-green-400">${tipoEstadiaSeleccionado.precio.toFixed(2)}</p>
                <p className="text-slate-400">BS {calcularPrecioBS().toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Botones de Acción */}
        <div className="flex gap-4">
          <button
            onClick={() => alert('Módulo de Productos Tienda - Pendiente por desarrollar')}
            className="flex-1 px-6 py-4 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all font-medium flex items-center justify-center gap-2"
          >
            <span>🛒</span>
            Productos Tienda
          </button>
          
          <button
            onClick={handlePagar}
            disabled={!tipoEstadiaSeleccionado || !cliente.documento || !cliente.nombre}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>💳</span>
            Proceder al Pago
          </button>
        </div>
      </main>
    </div>
  );
}

export default function CheckinPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    }>
      <CheckinContent />
    </Suspense>
  );
}
