import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { validarJornadaActiva } from '@/lib/jornada';

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
    const { numero, tipo, precio_hora, precio_noche, capacidad, descripcion, estado, activa } = body;
    
    const pool = await getConnection();
    
    // Validar que hay una jornada activa
    const validacionJornada = await validarJornadaActiva();
    if (!validacionJornada.valida) {
      return NextResponse.json(
        { success: false, error: validacionJornada.error },
        { status: 403 }
      );
    }

    const result = await pool.request()
      .input('id', id)
      .input('numero', numero)
      .input('tipo', tipo)
      .input('precio_hora', precio_hora)
      .input('precio_noche', precio_noche)
      .input('capacidad', capacidad)
      .input('descripcion', descripcion)
      .input('estado', estado)
      .input('activa', activa === true || activa === 1 || activa === 'true' ? 1 : 0)
      .query(`
        UPDATE Habitaciones
        SET numero = @numero,
            tipo = @tipo,
            precio_hora = @precio_hora,
            precio_noche = @precio_noche,
            capacidad = @capacidad,
            descripcion = @descripcion,
            estado = @estado,
            activa = @activa,
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
    const { estado, activa } = body;
    
    if (!estado && activa === undefined) {
      return NextResponse.json(
        { success: false, error: 'Estado o activa requerido' },
        { status: 400 }
      );
    }
    
    let query = 'UPDATE Habitaciones SET ';
    const updates: string[] = [];
    const pool = await getConnection();
    const request_db = pool.request();
    
    if (estado) {
      updates.push('estado = @estado');
      request_db.input('estado', estado);
    }
    
    if (activa !== undefined) {
      updates.push('activa = @activa');
      request_db.input('activa', activa === true || activa === 1 || activa === 'true' ? 1 : 0);
    }
    
    query += updates.join(', ');
    query += ', fecha_actualizacion = GETDATE() OUTPUT INSERTED.* WHERE id = @id';
    
    request_db.input('id', id);
    
    const result = await request_db.query(query);
    
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
