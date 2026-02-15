'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface TasasHistory {
  id: number;
  tasa: number;
  fecha_registro: string;
  observaciones: string | null;
  usuario_registro_id: number | null;
}

export default function CambioTasaPage() {
  const router = useRouter();
  const [currentTasa, setCurrentTasa] = useState<number | null>(null);
  const [historial, setHistorial] = useState<TasasHistory[]>([]);
  const [newTasa, setNewTasa] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchTasas();
  }, []);

  const fetchTasas = async () => {
    try {
      const res = await fetch('/api/tasas');
      const data = await res.json();
      
      if (data && data.length > 0) {
        setCurrentTasa(data[0].tasa);
        // Get last 10 records for history
        setHistorial(data.slice(0, 10));
      }
    } catch (error) {
      console.error('Error fetching tasas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const tasaValue = parseFloat(newTasa);
    
    if (!tasaValue || tasaValue <= 0) {
      setMessage({ type: 'error', text: 'Ingrese una tasa válida mayor a 0' });
      return;
    }

    // Get user from session
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/tasas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasa: tasaValue,
          observaciones: observaciones || null,
          usuario_registro_id: user?.id || null
        })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: 'Tasa actualizada correctamente' });
        setNewTasa('');
        setObservaciones('');
        fetchTasas();
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al guardar' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al guardar la tasa' });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('es-VE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard" 
              className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            >
              ← Volver
            </Link>
            <h1 className="text-3xl font-bold text-yellow-400">💱 Cambio de Tasa</h1>
          </div>
        </div>

        {/* Current Rate Display */}
        <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-xl p-8 mb-8 text-center">
          <div className="text-yellow-100 text-lg mb-2">Tasa Actual (Bs. por USD)</div>
          <div className="text-6xl font-bold">
            {currentTasa ? `Bs. ${currentTasa.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'No definida'}
          </div>
        </div>

        {/* Form */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Nueva Tasa</h2>
          
          {message && (
            <div className={`p-4 rounded-lg mb-4 ${message.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2">Nueva Tasa (Bs.)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newTasa}
                onChange={(e) => setNewTasa(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-yellow-500 text-white text-xl"
                placeholder="Ej: 45,50"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2">Observaciones (opcional)</label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-yellow-500 text-white"
                placeholder="Razón del cambio..."
                rows={2}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-600 rounded-lg font-semibold transition-colors"
            >
              {saving ? 'Guardando...' : '💾 Guardar Nueva Tasa'}
            </button>
          </form>
        </div>

        {/* History */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Historial de Tasas</h2>
          
          {historial.length === 0 ? (
            <p className="text-gray-400">No hay historial disponible</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-400">Fecha</th>
                    <th className="text-right py-3 px-4 text-gray-400">Tasa (Bs.)</th>
                    <th className="text-left py-3 px-4 text-gray-400">Observaciones</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((item) => (
                    <tr key={item.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                      <td className="py-3 px-4 text-gray-300">{formatDate(item.fecha_registro)}</td>
                      <td className="py-3 px-4 text-right font-semibold text-yellow-400">
                        {item.tasa.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-sm">
                        {item.observaciones || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
