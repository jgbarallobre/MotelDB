import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pool = await getConnection();
    
    const result = await pool.request()
      .input('id', parseInt(id))
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
        WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return NextResponse.json(
        { error: 'Jornada no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.recordset[0]);
  } catch (error) {
    console.error('Error fetching jornada:', error);
    return NextResponse.json(
      { error: 'Error al obtener jornada' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nombre, descripcion, hora_inicio, hora_fin, duracion_horas, activo, es_noche, color } = body;

    const pool = await getConnection();
    
    // Build dynamic update query
    const updates: string[] = [];
    const requestObj = pool.request().input('id', parseInt(id));

    if (nombre !== undefined) {
      updates.push('nombre = @nombre');
      requestObj.input('nombre', nombre);
    }
    if (descripcion !== undefined) {
      updates.push('descripcion = @descripcion');
      requestObj.input('descripcion', descripcion);
    }
    if (hora_inicio !== undefined) {
      updates.push('hora_inicio = @hora_inicio');
      requestObj.input('hora_inicio', hora_inicio);
    }
    if (hora_fin !== undefined) {
      updates.push('hora_fin = @hora_fin');
      requestObj.input('hora_fin', hora_fin);
    }
    if (duracion_horas !== undefined) {
      updates.push('duracion_horas = @duracion_horas');
      requestObj.input('duracion_horas', duracion_horas);
    }
    if (activo !== undefined) {
      updates.push('activo = @activo');
      requestObj.input('activo', activo);
    }
    if (es_noche !== undefined) {
      updates.push('es_noche = @es_noche');
      requestObj.input('es_noche', es_noche);
    }
    if (color !== undefined) {
      updates.push('color = @color');
      requestObj.input('color', color);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No hay campos para actualizar' },
        { status: 400 }
      );
    }

    const query = `UPDATE Jornadas SET ${updates.join(', ')} WHERE id = @id`;
    await requestObj.query(query);

    return NextResponse.json({ message: 'Jornada actualizada exitosamente' });
  } catch (error) {
    console.error('Error updating jornada:', error);
    return NextResponse.json(
      { error: 'Error al actualizar jornada' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pool = await getConnection();
    
    // Check if jornada exists
    const checkResult = await pool.request()
      .input('id', parseInt(id))
      .query('SELECT id FROM Jornadas WHERE id = @id');

    if (checkResult.recordset.length === 0) {
      return NextResponse.json(
        { error: 'Jornada no encontrada' },
        { status: 404 }
      );
    }

    // Soft delete - set activo to 0
    await pool.request()
      .input('id', parseInt(id))
      .query('UPDATE Jornadas SET activo = 0 WHERE id = @id');

    return NextResponse.json({ message: 'Jornada eliminada exitosamente' });
  } catch (error) {
    console.error('Error deleting jornada:', error);
    return NextResponse.json(
      { error: 'Error al eliminar jornada' },
      { status: 500 }
    );
  }
}
