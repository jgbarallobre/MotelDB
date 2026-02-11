import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

// GET - Obtener una habitación específica
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pool = await getConnection();
    
    const result = await pool.request()
      .input('id', id)
      .query('SELECT * FROM Habitaciones WHERE id = @id');
    
    if (result.recordset.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Habitación no encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Error obteniendo habitación:', error);
    return NextResponse.json(
      { success: false, error: 'Error obteniendo habitación' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar habitación
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { numero, tipo, precio_hora, precio_noche, capacidad, descripcion, estado } = body;
    
    const pool = await getConnection();
    const result = await pool.request()
      .input('id', id)
      .input('numero', numero)
      .input('tipo', tipo)
      .input('precio_hora', precio_hora)
      .input('precio_noche', precio_noche)
      .input('capacidad', capacidad)
      .input('descripcion', descripcion)
      .input('estado', estado)
      .query(`
        UPDATE Habitaciones
        SET numero = @numero,
            tipo = @tipo,
            precio_hora = @precio_hora,
            precio_noche = @precio_noche,
            capacidad = @capacidad,
            descripcion = @descripcion,
            estado = @estado,
            fecha_actualizacion = GETDATE()
        OUTPUT INSERTED.*
        WHERE id = @id
      `);
    
    if (result.recordset.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Habitación no encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Error actualizando habitación:', error);
    return NextResponse.json(
      { success: false, error: 'Error actualizando habitación' },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar solo el estado de la habitación
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { estado } = body;
    
    if (!estado) {
      return NextResponse.json(
        { success: false, error: 'Estado requerido' },
        { status: 400 }
      );
    }
    
    const pool = await getConnection();
    const result = await pool.request()
      .input('id', id)
      .input('estado', estado)
      .query(`
        UPDATE Habitaciones
        SET estado = @estado,
            fecha_actualizacion = GETDATE()
        OUTPUT INSERTED.*
        WHERE id = @id
      `);
    
    if (result.recordset.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Habitación no encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Error actualizando estado:', error);
    return NextResponse.json(
      { success: false, error: 'Error actualizando estado' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar habitación
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pool = await getConnection();
    
    const result = await pool.request()
      .input('id', id)
      .query('DELETE FROM Habitaciones WHERE id = @id');
    
    if (result.rowsAffected[0] === 0) {
      return NextResponse.json(
        { success: false, error: 'Habitación no encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Habitación eliminada correctamente'
    });
  } catch (error) {
    console.error('Error eliminando habitación:', error);
    return NextResponse.json(
      { success: false, error: 'Error eliminando habitación' },
      { status: 500 }
    );
  }
}
