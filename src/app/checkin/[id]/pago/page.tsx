"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface MetodoPago {
  id: string;
  nombre: string;
  icono: string;
  color: string;
}

interface CheckinData {
  habitacion_id: number;
  tipo_estadia_id: number;
  tipo_estadia: {
    nombre: string;
    duracion_horas: number;
    precio: number;
  };
  cliente: {
    nombre: string;
    documento: string;
    telefono: string;
  };
  tasaCambio: number;
}

const steps = [
  { id: 1, name: 'Tipo de Estadía', icon: '⏱️' },
  { id: 2, name: 'Datos del Cliente', icon: '👤' },
  { id: 3, name: 'Pago', icon: '💳' },
  { id: 4, name: 'Confirmación', icon: '✅' },
];

function PagoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const habitacionId = searchParams.get('habitacion_id');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkinData, setCheckinData] = useState<CheckinData | null>(null);
  const [pagos, setPagos] = useState<{ metodo_pago: string; monto: number; comprobante: string }[]>([]);
  const [montoRecibido, setMontoRecibido] = useState('');
  const [procesando, setProcesando] = useState(false);

  // Métodos de pago disponibles
  const metodosPago: MetodoPago[] = [
    { id: 'Efectivo', nombre: 'Efectivo', icono: '💵', color: 'from-green-500 to-emerald-600' },
    { id: 'Tarjeta', nombre: 'Tarjeta', icono: '💳', color: 'from-blue-500 to-cyan-600' },
    { id: 'Transferencia', nombre: 'Transferencia', icono: '🏦', color: 'from-indigo-500 to-purple-600' },
    { id: 'Yape', nombre: 'Yape', icono: '📱', color: 'from-pink-500 to-rose-600' },
    { id: 'Plin', nombre: 'Plin', icono: '🔵', color: 'from-cyan-500 to-blue-600' },
  ];

  useEffect(() => {
    // Recuperar datos del check-in
    const data = sessionStorage.getItem('checkin_data');
    if (!data) {
      setError('No hay datos del check-in. Por favor inicie el proceso nuevamente.');
      return;
    }

    const parsedData = JSON.parse(data);
    setCheckinData(parsedData);
    
    // Inicializar con el monto total
    setMontoRecibido(parsedData.tipo_estadia.precio.toString());
  }, []);

  const totalAPagar = checkinData?.tipo_estadia?.precio || 0;
  const montoRecibidoNum = parseFloat(montoRecibido) || 0;
  const cambio = Math.max(0, montoRecibidoNum - totalAPagar);
  const deuda = Math.max(0, totalAPagar - montoRecibidoNum);

  const toggleMetodoPago = (metodo: string) => {
    const existente = pagos.findIndex(p => p.metodo_pago === metodo);
    
    if (existente >= 0) {
      // Eliminar
      setPagos(pagos.filter((_, i) => i !== existente));
    } else {
      // Agregar con monto 0
      setPagos([...pagos, { metodo_pago: metodo, monto: 0, comprobante: '' }]);
    }
  };

  const updateMontoPago = (index: number, monto: number) => {
    const nuevosPagos = [...pagos];
    nuevosPagos[index].monto = monto;
    setPagos(nuevosPagos);
  };

  const handlePagar = async () => {
    if (!checkinData) return;

    // Validar que haya al menos un pago
    if (pagos.length === 0) {
      alert('Seleccione al menos una forma de pago');
      return;
    }

    // Validar que el total pagado sea suficiente
    const totalPagado = pagos.reduce((sum, p) => sum + p.monto, 0);
    if (totalPagado < totalAPagar) {
      alert('El monto total pagado es insuficiente');
      return;
    }

    setProcesando(true);
    try {
      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          habitacion_id: checkinData.habitacion_id,
          tipo_estadia_id: checkinData.tipo_estadia_id,
          cliente: checkinData.cliente,
          pagos: pagos.filter(p => p.monto > 0)
        })
      });

      const result = await response.json();

      if (result.success) {
        // Agregar tasaCambio al resultado para la página de resumen
        const resultConTasa = {
          ...result,
          tasaCambio: checkinData.tasaCambio
        };
        // Guardar datos del resultado para la página de resumen
        sessionStorage.setItem('checkin_result', JSON.stringify(resultConTasa));
        router.push(`/checkin/${habitacionId}/resumen`);
      } else {
        alert(result.error || 'Error al procesar el pago');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Error al procesar el pago');
    } finally {
      setProcesando(false);
    }
  };

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {/* Stepper */}
          <div className="flex items-center justify-between mb-4">
            <Link href={`/checkin/${habitacionId}`} className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200 hover:scale-105">
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
                        3 >= s.id 
                          ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30' 
                          : 'bg-white/10 text-slate-500'
                      }`}
                    >
                      {3 > s.id ? s.icon : s.id === 3 ? '✓' : s.id}
                    </div>
                    <span className={`text-[10px] mt-1 hidden sm:block ${3 >= s.id ? 'text-white' : 'text-slate-500'}`}>
                      {s.name}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-0.5 mx-1 transition-colors duration-300 ${3 > s.id ? 'bg-blue-500' : 'bg-white/20'}`} />
                  )}
                </div>
              ))}
            </div>
            
            <div className="w-10" />
          </div>

          {/* Title */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-lg shadow-lg shadow-green-500/30">
                  💳
                </span>
                Selección de Pago
              </h1>
              <p className="text-slate-400 text-sm">Habitación {checkinData?.habitacion_id}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Tasa de Cambio Card - Right side */}
      {checkinData?.tasaCambio && checkinData.tasaCambio > 0 && (
        <div className="absolute right-4 top-24 z-40">
          <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 backdrop-blur-xl rounded-xl border border-amber-500/30 px-4 py-2 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="text-amber-400">💵</span>
              <span className="text-amber-200/80 text-sm font-medium">Tasa del Día:</span>
              <span className="text-amber-400 font-bold text-lg">
                Bs. {checkinData.tasaCambio.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Resumen */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h2 className="text-lg font-bold text-white mb-4">Resumen de la Transacción</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Cliente:</span>
              <span className="text-white">{checkinData?.cliente?.nombre}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Documento:</span>
              <span className="text-white">{checkinData?.cliente?.documento}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Estadía:</span>
              <span className="text-white">{checkinData?.tipo_estadia?.nombre}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-white/10">
              <span className="text-slate-300 font-medium">Total a Pagar:</span>
              <span className="text-2xl font-bold text-green-400">${totalAPagar.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Métodos de Pago */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              💰
            </span>
            Formas de Pago
          </h2>
          
          <p className="text-slate-400 text-sm mb-4">Seleccione una o varias formas de pago:</p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {metodosPago.map((metodo) => {
              const seleccionado = pagos.some(p => p.metodo_pago === metodo.id);
              return (
                <button
                  key={metodo.id}
                  onClick={() => toggleMetodoPago(metodo.id)}
                  className={`p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-1 ${
                    seleccionado
                      ? `bg-gradient-to-br ${metodo.color} border-transparent text-white shadow-lg`
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <span className="text-2xl">{metodo.icono}</span>
                  <span className={`font-medium text-sm ${seleccionado ? 'text-white' : 'text-white'}`}>
                    {metodo.nombre}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Detalle de pagos */}
          {pagos.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-white/10">
              <h3 className="font-medium text-white">Detalle de cada forma de pago:</h3>
              {pagos.map((pago, index) => {
                const metodo = metodosPago.find(m => m.id === pago.metodo_pago);
                return (
                  <div key={pago.metodo_pago} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                    <span className="text-2xl">{metodo?.icono}</span>
                    <span className="text-white font-medium flex-1">{metodo?.nombre}</span>
                    <input
                      type="number"
                      value={pago.monto}
                      onChange={(e) => updateMontoPago(index, parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      placeholder="Monto"
                      className="w-32 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-right"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Resumen de Pago */}
        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-xl rounded-2xl border border-green-500/30 p-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Total Pagado:</span>
              <span className="text-xl font-bold text-blue-400">
                ${pagos.reduce((sum, p) => sum + p.monto, 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Total a Pagar:</span>
              <span className="text-xl font-bold text-white">
                ${totalAPagar.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-white/10">
              <span className="text-slate-300">Cambio:</span>
              <span className="text-2xl font-bold text-green-400">
                ${cambio.toFixed(2)}
              </span>
            </div>
            {deuda > 0 && (
              <div className="flex justify-between items-center text-red-400">
                <span className="font-medium">Pendiente:</span>
                <span className="text-xl font-bold">${deuda.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Botón de Pago */}
        <button
          onClick={handlePagar}
          disabled={procesando || pagos.length === 0 || deuda > 0}
          className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {procesando ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Procesando...
            </>
          ) : (
            <>
              <span>✅</span>
              Confirmar Pago
            </>
          )}
        </button>
      </main>
    </div>
  );
}

export default function PagoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    }>
      <PagoContent />
    </Suspense>
  );
}
