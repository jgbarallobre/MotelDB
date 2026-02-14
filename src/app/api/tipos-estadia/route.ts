import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

export async function GET() {
  try {
    const pool = await getConnection();
    
    const result = await pool.request()
      .query(`
        SELECT 
          id,
          nombre,
          descripcion,
          duracion_horas,
          precio,
          precio_adicional,
          activo,
          es_paquete,
          orden
        FROM TiposEstadia
        WHERE activo = 1
        ORDER BY orden ASC
      `);

    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error('Error fetching tipos de estadía:', error);
    return NextResponse.json(
      { error: 'Error al obtener tipos de estadía' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre, descripcion, duracion_horas, precio, precio_adicional, es_paquete, orden } = body;

    if (!nombre || !duracion_horas || !precio) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    const pool = await getConnection();
    
    await pool.request()
      .input('nombre', nombre)
      .input('descripcion', descripcion || null)
      .input('duracion_horas', duracion_horas)
      .input('precio', precio)
      .input('precio_adicional', precio_adicional || 0)
      .input('es_paquete', es_paquete || 0)
      .input('orden', orden || 0)
      .query(`
        INSERT INTO TiposEstadia (nombre, descripcion, duracion_horas, precio, precio_adicional, es_paquete, orden)
        VALUES (@nombre, @descripcion, @duracion_horas, @precio, @precio_adicional, @es_paquete, @orden)
      `);

    return NextResponse.json({ message: 'Tipo de estadía creado exitosamente' });
  } catch (error) {
    console.error('Error creating tipo de estadía:', error);
    return NextResponse.json(
      { error: 'Error al crear tipo de estadía' },
      { status: 500 }
    );
  }
}
