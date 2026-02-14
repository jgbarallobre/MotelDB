import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const documento = searchParams.get('documento');

    if (!documento) {
      return NextResponse.json(
        { error: 'Se requiere el documento' },
        { status: 400 }
      );
    }

    const pool = await getConnection();
    
    const result = await pool.request()
      .input('documento', documento)
      .query(`
        SELECT 
          id,
          nombre,
          apellido,
          documento,
          tipo_documento,
          telefono,
          email,
          rif,
          razon_social
        FROM Clientes 
        WHERE documento = @documento
      `);

    if (result.recordset.length === 0) {
      return NextResponse.json({
        existe: false,
        cliente: null
      });
    }

    return NextResponse.json({
      existe: true,
      cliente: result.recordset[0]
    });
  } catch (error) {
    console.error('Error buscando cliente:', error);
    return NextResponse.json(
      { error: 'Error al buscar cliente' },
      { status: 500 }
    );
  }
}
