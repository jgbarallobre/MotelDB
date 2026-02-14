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
          duracion_horas,
          precio,
          precio_adicional,
          activo,
          es_paquete,
          orden
        FROM TiposEstadia
        WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return NextResponse.json(
        { error: 'Tipo de estadía no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.recordset[0]);
  } catch (error) {
    console.error('Error fetching tipo de estadía:', error);
    return NextResponse.json(
      { error: 'Error al obtener tipo de estadía' },
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
    const { nombre, descripcion, duracion_horas, precio, precio_adicional, activo, es_paquete, orden } = body;

    const pool = await getConnection();
    
    await pool.request()
      .input('id', parseInt(id))
      .input('nombre', nombre)
      .input('descripcion', descripcion || null)
      .input('duracion_horas', duracion_horas)
      .input('precio', precio)
      .input('precio_adicional', precio_adicional || 0)
      .input('activo', activo !== undefined ? activo : 1)
      .input('es_paquete', es_paquete || 0)
      .input('orden', orden || 0)
      .query(`
        UPDATE TiposEstadia
        SET nombre = @nombre,
            descripcion = @descripcion,
            duracion_horas = @duracion_horas,
            precio = @precio,
            precio_adicional = @precio_adicional,
            activo = @activo,
            es_paquete = @es_paquete,
            orden = @orden
        WHERE id = @id
      `);

    return NextResponse.json({ message: 'Tipo de estadía actualizado exitosamente' });
  } catch (error) {
    console.error('Error updating tipo de estadía:', error);
    return NextResponse.json(
      { error: 'Error al actualizar tipo de estadía' },
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
    
    // Soft delete - set activo to 0
    await pool.request()
      .input('id', parseInt(id))
      .query(`UPDATE TiposEstadia SET activo = 0 WHERE id = @id`);

    return NextResponse.json({ message: 'Tipo de estadía eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting tipo de estadía:', error);
    return NextResponse.json(
      { error: 'Error al eliminar tipo de estadía' },
      { status: 500 }
    );
  }
}
