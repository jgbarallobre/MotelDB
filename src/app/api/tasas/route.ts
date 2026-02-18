import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

export async function GET() {
  try {
    const pool = await getConnection();
    
    const result = await pool.request()
      .query(`
        SELECT TOP 1 
          id,
          tasa as tasaCambio,
          fecha_registro,
          usuario_registro_id,
          observaciones
        FROM TasasCambio
        ORDER BY fecha_registro DESC
      `);

    return NextResponse.json({ tasas: result.recordset });
  } catch (error) {
    console.error('Error fetching tasas:', error);
    return NextResponse.json(
      { error: 'Error al obtener tasas de cambio' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tasa, usuario_registro_id, observaciones } = body;

    if (!tasa || tasa <= 0) {
      return NextResponse.json(
        { error: 'La tasa debe ser mayor a 0' },
        { status: 400 }
      );
    }

    const pool = await getConnection();
    
    const result = await pool.request()
      .input('tasa', tasa)
      .input('usuario_registro_id', usuario_registro_id || null)
      .input('observaciones', observaciones || null)
      .query(`
        INSERT INTO TasasCambio (tasa, usuario_registro_id, observaciones)
        VALUES (@tasa, @usuario_registro_id, @observaciones);
        SELECT SCOPE_IDENTITY() as id;
      `);

    return NextResponse.json({ 
      success: true, 
      id: result.recordset[0].id 
    });
  } catch (error) {
    console.error('Error inserting tasa:', error);
    return NextResponse.json(
      { error: 'Error al registrar tasa de cambio' },
      { status: 500 }
    );
  }
}
