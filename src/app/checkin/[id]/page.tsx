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

const steps = [
  { id: 1, name: 'Tipo de Estadía', icon: '⏱️' },
  { id: 2, name: 'Datos del Cliente', icon: '👤' },
  { id: 3, name: 'Pago', icon: '💳' },
  { id: 4, name: 'Confirmación', icon: '✅' },
];

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
  
  // Estado para controlar el flujo
  const [step, setStep] = useState<1 | 2>(1);
  
  const [tipoEstadiaSeleccionado, setTipoEstadiaSeleccionado] = useState<TipoEstadia | null>(null);
  const [cliente, setCliente] = useState<Cliente>({
    nombre: '',
    documento: '',
    telefono: ''
  });
  const [clienteEncontrado, setClienteEncontrado] = useState(false);
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [errors, setErrors] = useState<{ documento?: string; nombre?: string }>({});

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
      setErrors({ ...errors, documento: 'Debe comenzar con V, J o G seguido de números' });
      return;
    }

    setErrors({ ...errors, documento: undefined });
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
    setErrors({ ...errors, documento: undefined });
    
    if (valor.length >= 6) {
      buscarCliente(valor);
    }
  };

  const calcularPrecioBS = () => {
    if (!tipoEstadiaSeleccionado) return 0;
    return tipoEstadiaSeleccionado.precio * tasaCambio;
  };

  const validateStep1 = (): boolean => {
    if (!tipoEstadiaSeleccionado) {
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    const newErrors: { documento?: string; nombre?: string } = {};
    
    if (!cliente.documento) {
      newErrors.documento = 'La cédula/RIF es requerido';
    } else if (!validarDocumento(cliente.documento)) {
      newErrors.documento = 'Formato inválido (V12345678)';
    }
    
    if (!cliente.nombre || cliente.nombre.trim().length < 2) {
      newErrors.nombre = 'El nombre es requerido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinuar = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleVolver = () => {
    setStep(1);
  };

  const handlePagar = () => {
    if (!validateStep2()) {
      return;
    }

    // Guardar datos en sessionStorage para la página de pago
    sessionStorage.setItem('checkin_data', JSON.stringify({
      habitacion_id: habitacionId,
      tipo_estadia_id: tipoEstadiaSeleccionado!.id,
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
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-4">
          {/* Stepper */}
          <div className="flex items-center justify-between mb-4">
            <Link href="/lobby" className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200 hover:scale-105">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            
            <div className="flex items-center gap-1">
              {steps.map((s, index) => (
                <div key={s.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div 
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold transition-all duration-300 ${
                        step >= s.id 
                          ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30' 
                          : 'bg-white/10 text-slate-500'
                      }`}
                    >
                      {step > s.id ? '✓' : s.icon}
                    </div>
                    <span className={`text-[10px] mt-1 hidden sm:block ${step >= s.id ? 'text-white' : 'text-slate-500'}`}>
                      {s.name}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-0.5 mx-1 transition-colors duration-300 ${step > s.id ? 'bg-blue-500' : 'bg-white/20'}`} />
                  )}
                </div>
              ))}
            </div>
            
            <div className="w-10" />
          </div>

          {/* Room Info */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-lg shadow-lg shadow-green-500/30">
                  🏠
                </span>
               Nueva Reserva
              </h1>
              <p className="text-slate-400 text-sm">Habitación {habitacion?.numero} • {habitacion?.descripcion}</p>
            </div>
            <div className="px-3 py-1.5 bg-green-500/20 rounded-full border border-green-500/30">
              <span className="text-green-400 font-medium text-xs">{habitacion?.estado}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        
        {/* Paso 1: Tipo de Estadía */}
        {step === 1 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-lg">
                  ⏱️
                </span>
                Selecciona el Tipo de Estadía
              </h2>
              
              <div className="space-y-3">
                {tiposEstadia.map((tipo, index) => (
                  <button
                    key={tipo.id}
                    onClick={() => setTipoEstadiaSeleccionado(tipo)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-300 hover:scale-[1.01] ${
                      tipoEstadiaSeleccionado?.id === tipo.id
                        ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500 shadow-lg shadow-blue-500/20'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30'
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        {tipoEstadiaSeleccionado?.id === tipo.id ? (
                          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full border-2 border-white/30"></div>
                        )}
                        <div>
                          <h3 className="font-bold text-white text-lg">{tipo.nombre}</h3>
                          <p className="text-slate-400 text-sm">{tipo.duracion_horas} horas • {tipo.descripcion}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-400">${tipo.precio.toFixed(2)}</p>
                        <p className="text-slate-500 text-xs">BS {(tipo.precio * tasaCambio).toFixed(2)}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Resumen precio */}
            {tipoEstadiaSeleccionado && (
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-xl rounded-2xl border border-green-500/20 p-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Monto a cancelar</span>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-400">${tipoEstadiaSeleccionado.precio.toFixed(2)}</p>
                    <p className="text-slate-400 text-sm">BS {calcularPrecioBS().toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Botón Continuar */}
            <button
              onClick={handleContinuar}
              disabled={!tipoEstadiaSeleccionado}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-bold text-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              Continuar con Datos del Cliente
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {/* Paso 2: Datos del Cliente */}
        {step === 2 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-lg">
                  👤
                </span>
                Datos del Cliente / Huésped
              </h2>

              {clienteEncontrado && (
                <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-xl flex items-center gap-2 animate-pulse">
                  <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-green-300 text-sm">Cliente encontrado en nuestra base de datos</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Cédula / RIF <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      value={cliente.documento}
                      onChange={handleDocumentoChange}
                      placeholder="V12345678"
                      maxLength={9}
                      className={`w-full pl-12 pr-12 py-3 bg-white/10 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.documento ? 'border-red-500 bg-red-500/10' : 'border-white/20'}`}
                    />
                    {buscandoCliente && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                      </div>
                    )}
                  </div>
                  {errors.documento && (
                    <p className="text-red-400 text-xs mt-1">{errors.documento}</p>
                  )}
                  <p className="text-slate-500 text-xs mt-1">Comienza con V, J o G seguido de números</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Nombre del Cliente <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      value={cliente.nombre}
                      onChange={(e) => {
                        setCliente({ ...cliente, nombre: e.target.value });
                        setErrors({ ...errors, nombre: undefined });
                      }}
                      placeholder="Nombre completo del huésped"
                      className={`w-full pl-12 pr-4 py-3 bg-white/10 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.nombre ? 'border-red-500 bg-red-500/10' : 'border-white/20'}`}
                    />
                  </div>
                  {errors.nombre && (
                    <p className="text-red-400 text-xs mt-1">{errors.nombre}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Teléfono (Opcional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </span>
                    <input
                      type="tel"
                      value={cliente.telefono}
                      onChange={(e) => setCliente({ ...cliente, telefono: e.target.value })}
                      placeholder="Número de teléfono"
                      className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Resumen del monto */}
            {tipoEstadiaSeleccionado && (
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-xl rounded-2xl border border-green-500/20 p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-slate-400 text-sm">{tipoEstadiaSeleccionado.nombre} ({tipoEstadiaSeleccionado.duracion_horas}h)</p>
                    <p className="text-slate-500 text-xs">Tasa: BS {tasaCambio.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-400">${tipoEstadiaSeleccionado.precio.toFixed(2)}</p>
                    <p className="text-slate-400 text-sm">BS {calcularPrecioBS().toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Botones de Acción */}
            <div className="flex gap-3">
              <button
                onClick={handleVolver}
                className="flex-1 py-4 bg-white/10 border border-white/20 text-white rounded-2xl font-medium hover:bg-white/20 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Volver
              </button>
              
              <button
                onClick={() => alert('Módulo de Productos Tienda - Pendiente')}
                className="px-6 py-4 bg-white/10 border border-white/20 text-white rounded-2xl font-medium hover:bg-white/20 transition-all duration-300 flex items-center justify-center"
              >
                <span className="text-xl">🛒</span>
              </button>
              
              <button
                onClick={handlePagar}
                disabled={!tipoEstadiaSeleccionado || !cliente.documento || !cliente.nombre}
                className="flex-[2] py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Proceder al Pago
              </button>
            </div>
          </div>
        )}

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
