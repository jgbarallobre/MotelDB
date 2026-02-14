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
}

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

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-VE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-xl border-b border-green-500/30">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-4xl">✅</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Check-in Completado</h1>
          <p className="text-green-400 mt-2">La habitación ha sido ocupada exitosamente</p>
        </div>
      </header>

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
                <p className="text-white font-bold text-xl">{calcularTiempoRestante()}</p>
              </div>
              <span className="text-2xl">⏳</span>
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
