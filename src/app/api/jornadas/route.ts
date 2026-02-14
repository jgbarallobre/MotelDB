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
          hora_inicio,
          hora_fin,
          duracion_horas,
          activo,
          es_noche,
          color,
          fecha_creacion
        FROM Jornadas
        ORDER BY hora_inicio ASC
      `);

    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error('Error fetching jornadas:', error);
    return NextResponse.json(
      { error: 'Error al obtener jornadas' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre, descripcion, hora_inicio, hora_fin, duracion_horas, activo, es_noche, color } = body;

    if (!nombre || !hora_inicio || !hora_fin || !duracion_horas) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    const pool = await getConnection();
    
    await pool.request()
      .input('nombre', nombre)
      .input('descripcion', descripcion || null)
      .input('hora_inicio', hora_inicio)
      .input('hora_fin', hora_fin)
      .input('duracion_horas', duracion_horas)
      .input('activo', activo !== undefined ? activo : 1)
      .input('es_noche', es_noche || 0)
      .input('color', color || '#3B82F6')
      .query(`
        INSERT INTO Jornadas (nombre, descripcion, hora_inicio, hora_fin, duracion_horas, activo, es_noche, color)
        VALUES (@nombre, @descripcion, @hora_inicio, @hora_fin, @duracion_horas, @activo, @es_noche, @color)
      `);

    return NextResponse.json({ message: 'Jornada creada exitosamente' });
  } catch (error) {
    console.error('Error creating jornada:', error);
    return NextResponse.json(
      { error: 'Error al crear jornada' },
      { status: 500 }
    );
  }
}
