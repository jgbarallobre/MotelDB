import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

export async function GET() {
  try {
    const pool = await getConnection();
    
    const result = await pool.request()
      .query(`
        SELECT TOP 1 
          ja.id,
          ja.jornada_id,
          ja.usuario_id,
          ja.fecha_trabajo,
          ja.hora_inicio,
          ja.hora_fin,
          ja.monto_apertura_bs,
          ja.monto_apertura_usd,
          ja.tasa_cambio,
          ja.estado,
          ja.observaciones,
          j.nombre as jornada_nombre,
          j.hora_inicio as jornada_hora_inicio,
          j.hora_fin as jornada_hora_fin,
          u.nombre as usuario_nombre,
          u.username as usuario_username
        FROM JornadasAbiertas ja
        INNER JOIN jornadas j ON ja.jornada_id = j.id
        INNER JOIN usuarios u ON ja.usuario_id = u.id
        WHERE ja.estado = 'Abierta'
        ORDER BY ja.hora_inicio DESC
      `);

    if (result.recordset.length === 0) {
      return NextResponse.json({ jornadaActiva: null });
    }

    return NextResponse.json({ jornadaActiva: result.recordset[0] });
  } catch (error) {
    console.error('Error checking jornada:', error);
    return NextResponse.json(
      { error: 'Error al verificar jornada activa' },
      { status: 500 }
    );
  }
}
