"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface ReservaResultado {
  id: number;
  habitacion_id: number;
  habitacion_numero: string;
  cliente_documento: string;
  cliente_nombre: string;
  fecha_entrada: string;
  fecha_salida: string;
  horas_contratadas: number;
  precio_total: number;
  monto_pagado: number;
  cambio: number;
  tasaCambio?: number;
}

const steps = [
  { id: 1, name: 'Tipo de Estadía', icon: '⏱️' },
  { id: 2, name: 'Datos del Cliente', icon: '👤' },
  { id: 3, name: 'Pago', icon: '💳' },
  { id: 4, name: 'Confirmación', icon: '✅' },
];

function ResumenContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const habitacionId = searchParams.get('habitacion_id');

  const [resultado, setResultado] = useState<ReservaResultado | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const data = sessionStorage.getItem('checkin_result');
      if (data) {
        const parsed = JSON.parse(data);
        return parsed.reserva;
      }
    } catch (e) {}
    return null;
  });
  
  const [loading, setLoading] = useState(false);
  const [imprimiendo, setImprimiendo] = useState(false);
  const [tipoImpresion, setTipoImpresion] = useState<'prefactura' | 'factura' | null>(null);
  const [tiempoRestante, setTiempoRestante] = useState<string>('');

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-VE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Timer en tiempo real
  useEffect(() => {
    if (!resultado) return;
    
    const actualizarTiempo = () => {
      const ahora = new Date();
      const salida = new Date(resultado.fecha_salida);
      const diff = salida.getTime() - ahora.getTime();
      
      if (diff <= 0) {
        setTiempoRestante('Tiempo completado');
        return;
      }
      
      const horas = Math.floor(diff / (1000 * 60 * 60));
      const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const segundos = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTiempoRestante(`${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`);
    };
    
    actualizarTiempo();
    const intervalo = setInterval(actualizarTiempo, 1000);
    
    return () => clearInterval(intervalo);
  }, [resultado]);

  const calcularTiempoRestante = () => {
    if (!resultado) return '';
    const ahora = new Date();
    const salida = new Date(resultado.fecha_salida);
    const diff = salida.getTime() - ahora.getTime();
    
    if (diff <= 0) return 'Tiempo completado';
    
    const horas = Math.floor(diff / (1000 * 60 * 60));
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${horas}h ${minutos}min`;
  };

  const handleImprimir = async (tipo: 'prefactura' | 'factura') => {
    setTipoImpresion(tipo);
    setImprimiendo(true);

    // Simular impresión (en una implementación real, esto se conectaría a la impresora)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setImprimiendo(false);
    alert(tipo === 'prefactura' 
      ? '🧾 Pre-factura enviada a imprimir (Ticketera)' 
      : '🧾 Factura enviada a imprimir (Fiscal)');
  };

  const handleVolver = () => {
    sessionStorage.removeItem('checkin_data');
    sessionStorage.removeItem('checkin_result');
    router.push('/lobby');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!resultado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 text-center">
          <p className="text-red-400 text-lg mb-4">No se encontró información de la transacción</p>
          <Link href="/lobby" className="text-blue-400 hover:text-blue-300">
            ← Volver al Lobby
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-xl border-b border-green-500/30 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {/* Stepper */}
          <div className="flex items-center justify-between mb-4">
            <div className="w-10" />
            
            <div className="flex items-center gap-1">
              {steps.map((s, index) => (
                <div key={s.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div 
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold transition-all duration-300 ${
                        4 >= s.id 
                          ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30' 
                          : 'bg-white/10 text-slate-500'
                      }`}
                    >
                      {s.icon}
                    </div>
                    <span className={`text-[10px] mt-1 hidden sm:block ${4 >= s.id ? 'text-white' : 'text-slate-500'}`}>
                      {s.name}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-0.5 mx-1 transition-colors duration-300 ${4 > s.id ? 'bg-green-500' : 'bg-white/20'}`} />
                  )}
                </div>
              ))}
            </div>
            
            <Link href="/lobby" className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200 hover:scale-105">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </Link>
          </div>

          {/* Success Message */}
          <div className="text-center pb-2">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg shadow-green-500/30">
              <span className="text-3xl">✅</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Check-in Completado</h1>
            <p className="text-green-400 text-sm">La habitación ha sido ocupada exitosamente</p>
          </div>
        </div>
      </header>

      {/* Tasa de Cambio Card - Left side */}
      <div className="absolute left-4 top-24 z-40">
        <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 backdrop-blur-xl rounded-xl border border-amber-500/30 px-4 py-2 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-amber-400">💵</span>
            <span className="text-amber-200/80 text-sm font-medium">Tasa del Día:</span>
            <span className="text-amber-400 font-bold text-lg">
              {resultado?.tasaCambio ? `Bs. ${resultado.tasaCambio.toFixed(2)}` : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Datos de la Reserva */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              🏠
            </span>
            Información de la Habitación
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl p-4 text-center">
              <p className="text-slate-400 text-sm">Número de Habitación</p>
              <p className="text-3xl font-bold text-white">#{resultado.habitacion_numero}</p>
            </div>
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-4 text-center">
              <p className="text-slate-400 text-sm">Estado</p>
              <p className="text-xl font-bold text-green-400">🟢 Ocupada</p>
            </div>
          </div>
        </div>

        {/* Tiempos */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
              ⏱️
            </span>
            Tiempos
          </h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
              <div>
                <p className="text-slate-400 text-sm">Hora de Entrada</p>
                <p className="text-white font-medium text-lg">{formatearFecha(resultado.fecha_entrada)}</p>
              </div>
              <span className="text-2xl">🚀</span>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
              <div>
                <p className="text-slate-400 text-sm">Hora de Salida</p>
                <p className="text-white font-medium text-lg">{formatearFecha(resultado.fecha_salida)}</p>
              </div>
              <span className="text-2xl">🏁</span>
            </div>

            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl border border-yellow-500/30">
              <div>
                <p className="text-yellow-400 text-sm">Tiempo Restante</p>
                <p className="text-white font-bold text-2xl">{tiempoRestante || calcularTiempoRestante()}</p>
              </div>
              <span className="text-3xl">⏱️</span>
            </div>
          </div>
        </div>

        {/* Datos del Cliente */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
              👤
            </span>
            Datos del Cliente
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-slate-400 text-sm">Nombre</p>
              <p className="text-white font-medium">{resultado.cliente_nombre}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Cédula / RIF</p>
              <p className="text-white font-medium">{resultado.cliente_documento}</p>
            </div>
          </div>
        </div>

        {/* Pago */}
        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-xl rounded-2xl border border-green-500/30 p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              💰
            </span>
            Información de Pago
          </h2>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Estadía:</span>
              <span className="text-white">{resultado.horas_contratadas} horas</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Monto Pagado:</span>
              <span className="text-green-400 font-bold">${resultado.monto_pagado.toFixed(2)}</span>
            </div>
            {resultado.cambio > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-400">Cambio:</span>
                <span className="text-blue-400 font-bold">${resultado.cambio.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Botones de Impresión */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleImprimir('prefactura')}
            disabled={imprimiendo}
            className="p-6 bg-white/10 border border-white/20 rounded-2xl hover:bg-white/20 transition-all flex flex-col items-center gap-3 disabled:opacity-50"
          >
            <span className="text-4xl">🧾</span>
            <span className="text-white font-bold">Pre-factura</span>
            <span className="text-slate-400 text-sm text-center">Imprimir ticket tipo recibo</span>
            {tipoImpresion === 'prefactura' && imprimiendo && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            )}
          </button>

          <button
            onClick={() => handleImprimir('factura')}
            disabled={imprimiendo}
            className="p-6 bg-white/10 border border-white/20 rounded-2xl hover:bg-white/20 transition-all flex flex-col items-center gap-3 disabled:opacity-50"
          >
            <span className="text-4xl">📄</span>
            <span className="text-white font-bold">Factura</span>
            <span className="text-slate-400 text-sm text-center">Imprimir factura fiscal</span>
            {tipoImpresion === 'factura' && imprimiendo && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            )}
          </button>
        </div>

        {/* Botón Final */}
        <button
          onClick={handleVolver}
          className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all font-bold flex items-center justify-center gap-2"
        >
          <span>🏠</span>
          Volver al Lobby
        </button>
      </main>
    </div>
  );
}

export default function ResumenPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    }>
      <ResumenContent />
    </Suspense>
  );
}
