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
          codigo,
          descripcion,
          activo,
          fecha_creacion,
          fecha_actualizacion
        FROM Departamentos
        WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return NextResponse.json(
        { error: 'Departamento no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.recordset[0]);
  } catch (error) {
    console.error('Error fetching departamento:', error);
    return NextResponse.json(
      { error: 'Error al obtener departamento' },
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
    const { codigo, descripcion, activo } = body;

    const pool = await getConnection();

    // Check if departamento exists
    const checkResult = await pool.request()
      .input('id', parseInt(id))
      .query('SELECT id FROM Departamentos WHERE id = @id');

    if (checkResult.recordset.length === 0) {
      return NextResponse.json(
        { error: 'Departamento no encontrado' },
        { status: 404 }
      );
    }

    // If updating codigo, validate it's not duplicated
    if (codigo) {
      if (codigo.length !== 4) {
        return NextResponse.json(
          { error: 'El código debe tener exactamente 4 caracteres' },
          { status: 400 }
        );
      }

      const checkCodigo = await pool.request()
        .input('codigo', codigo.toUpperCase())
        .input('id', parseInt(id))
        .query('SELECT id FROM Departamentos WHERE codigo = @codigo AND id != @id');

      if (checkCodigo.recordset.length > 0) {
        return NextResponse.json(
          { error: 'Ya existe otro departamento con este código' },
          { status: 400 }
        );
      }
    }

    // Validate descripcion length
    if (descripcion && descripcion.length > 30) {
      return NextResponse.json(
        { error: 'La descripción debe tener máximo 30 caracteres' },
        { status: 400 }
      );
    }

    // Build dynamic update query
    const updates: string[] = [];
    const requestObj = pool.request().input('id', parseInt(id));

    if (codigo !== undefined) {
      updates.push('codigo = @codigo');
      requestObj.input('codigo', codigo.toUpperCase());
    }
    if (descripcion !== undefined) {
      updates.push('descripcion = @descripcion');
      requestObj.input('descripcion', descripcion);
    }
    if (activo !== undefined) {
      updates.push('activo = @activo');
      requestObj.input('activo', activo);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No hay campos para actualizar' },
        { status: 400 }
      );
    }

    updates.push('fecha_actualizacion = GETDATE()');

    const query = `UPDATE Departamentos SET ${updates.join(', ')} WHERE id = @id`;
    await requestObj.query(query);

    return NextResponse.json({ message: 'Departamento actualizado exitosamente' });
  } catch (error) {
    console.error('Error updating departamento:', error);
    return NextResponse.json(
      { error: 'Error al actualizar departamento' },
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
    
    // Check if departamento exists
    const checkResult = await pool.request()
      .input('id', parseInt(id))
      .query('SELECT id FROM Departamentos WHERE id = @id');

    if (checkResult.recordset.length === 0) {
      return NextResponse.json(
        { error: 'Departamento no encontrado' },
        { status: 404 }
      );
    }

    // Soft delete - set activo to 0
    await pool.request()
      .input('id', parseInt(id))
      .query('UPDATE Departamentos SET activo = 0 WHERE id = @id');

    return NextResponse.json({ message: 'Departamento eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting departamento:', error);
    return NextResponse.json(
      { error: 'Error al eliminar departamento' },
      { status: 500 }
    );
  }
}
