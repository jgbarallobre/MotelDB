import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

export async function GET() {
  try {
    const pool = await getConnection();
    
    // Obtener la última tasa de cambio registrada
    const result = await pool.request().query(`
      SELECT TOP 1 
        id,
        tasa,
        fecha_registro,
        observaciones
      FROM TasasCambio
      ORDER BY fecha_registro DESC
    `);

    if (result.recordset.length === 0) {
      return NextResponse.json({ 
        tasa: null,
        message: 'No hay tasas registradas'
      });
    }

    return NextResponse.json({ 
      tasa: result.recordset[0]
    });
  } catch (error) {
    console.error('Error al obtener tasa:', error);
    return NextResponse.json(
      { error: 'Error al obtener la tasa de cambio' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tasa, observaciones, usuario_id } = body;

    if (!tasa || tasa <= 0) {
      return NextResponse.json(
        { error: 'La tasa debe ser mayor a 0' },
        { status: 400 }
      );
    }

    const pool = await getConnection();
    
    // Insertar nueva tasa
    const result = await pool.request()
      .input('tasa', tasa)
      .input('observaciones', observaciones || 'Actualización de tasa')
      .input('usuario_id', usuario_id || null)
      .query(`
        INSERT INTO TasasCambio (tasa, observaciones, usuario_registro_id)
        VALUES (@tasa, @observaciones, @usuario_id);
        
        SELECT SCOPE_IDENTITY() as id;
      `);

    return NextResponse.json({
      success: true,
      message: 'Tasa actualizada correctamente',
      tasa_id: result.recordset[0].id,
      tasa: tasa
    });
  } catch (error) {
    console.error('Error al registrar tasa:', error);
    return NextResponse.json(
      { error: 'Error al registrar la tasa de cambio' },
      { status: 500 }
    );
  }
}
