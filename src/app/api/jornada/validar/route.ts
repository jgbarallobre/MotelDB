import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

export async function GET() {
  try {
    const pool = await getConnection();
    
    // Verificar si hay una jornada abierta
    const result = await pool.request().query(`
      SELECT TOP 1 
        id,
        jornada_id,
        fecha_trabajo,
        hora_inicio,
        estado
      FROM JornadasAbiertas
      WHERE LOWER(estado) NOT IN ('cerrada', 'cerrado', 'cancelada', 'cancelado', 'finalizada', 'finalizado')
      ORDER BY id DESC
    `);

    if (result.recordset.length === 0) {
      return NextResponse.json({ 
        activa: false,
        message: 'No hay jornada activa'
      });
    }

    return NextResponse.json({ 
      activa: true,
      jornada_id: result.recordset[0].id,
      fecha_trabajo: result.recordset[0].fecha_trabajo,
      message: 'Jornada activa'
    });
  } catch (error) {
    console.error('Error al validar jornada:', error);
    return NextResponse.json(
      { error: 'Error al validar la jornada' },
      { status: 500 }
    );
  }
}
