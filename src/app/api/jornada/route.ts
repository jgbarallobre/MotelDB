import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

export async function GET() {
  try {
    const pool = await getConnection();
    
    // Obtener la jornada abierta actual (si existe)
    const result = await pool.request().query(`
      SELECT 
        ja.id,
        ja.jornada_id,
        j.nombre as jornada_nombre,
        j.color as jornada_color,
        ja.usuario_id,
        u.nombre as usuario_nombre,
        u.username as usuario_username,
        ja.fecha_trabajo,
        ja.hora_inicio,
        ja.monto_apertura_bs,
        ja.monto_apertura_usd,
        ja.tasa_cambio,
        ja.estado,
        ja.observaciones
      FROM JornadasAbiertas ja
      INNER JOIN Jornadas j ON ja.jornada_id = j.id
      INNER JOIN Usuarios u ON ja.usuario_id = u.id
      WHERE ja.estado = 'Abierta'
      ORDER BY ja.id DESC
    `);

    if (result.recordset.length === 0) {
      return NextResponse.json({ 
        activa: false, 
        jornada: null 
      });
    }

    return NextResponse.json({ 
      activa: true, 
      jornada: result.recordset[0] 
    });
  } catch (error) {
    console.error('Error al obtener jornada actual:', error);
    return NextResponse.json(
      { error: 'Error al obtener la jornada actual' },
      { status: 500 }
    );
  }
}
