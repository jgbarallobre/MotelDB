import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pool = await getConnection();
    if (!pool) {
      return NextResponse.json({ error: 'Error de conexión a la base de datos' }, { status: 500 });
    }

    const result = await pool.request()
      .input('id', parseInt(id))
      .query('SELECT * FROM TiposIva WHERE id = @id');

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: 'Tipo de IVA no encontrado' }, { status: 404 });
    }

    return NextResponse.json(result.recordset[0]);
  } catch (error) {
    console.error('Error fetching tipo IVA:', error);
    return NextResponse.json({ error: 'Error al obtener tipo de IVA' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pool = await getConnection();
    if (!pool) {
      return NextResponse.json({ error: 'Error de conexión a la base de datos' }, { status: 500 });
    }

    const body = await request.json();
    const { codigo, descripcion, valor, activo } = body;

    // Verificar si existe el registro
    const checkResult = await pool.request()
      .input('id', parseInt(id))
      .query('SELECT id FROM TiposIva WHERE id = @id');

    if (checkResult.recordset.length === 0) {
      return NextResponse.json({ error: 'Tipo de IVA no encontrado' }, { status: 404 });
    }

    // Validaciones
    if (codigo && codigo.length !== 2) {
      return NextResponse.json({ error: 'El código debe tener exactamente 2 caracteres' }, { status: 400 });
    }

    if (descripcion && descripcion.length > 15) {
      return NextResponse.json({ error: 'La descripción debe tener máximo 15 caracteres' }, { status: 400 });
    }

    if (valor !== undefined && (valor === null || valor < 0)) {
      return NextResponse.json({ error: 'El valor debe ser un número positivo' }, { status: 400 });
    }

    // Verificar si el código ya existe en otro registro
    if (codigo) {
      const checkCodigo = await pool.request()
        .input('codigo', codigo.toUpperCase())
        .input('id', parseInt(id))
        .query('SELECT id FROM TiposIva WHERE codigo = @codigo AND id != @id');

      if (checkCodigo.recordset.length > 0) {
        return NextResponse.json({ error: 'Ya existe otro tipo de IVA con este código' }, { status: 400 });
      }
    }

    // Construir la consulta dinámicamente
    let updateFields = [];
    if (codigo !== undefined) updateFields.push('codigo = @codigo');
    if (descripcion !== undefined) updateFields.push('descripcion = @descripcion');
    if (valor !== undefined) updateFields.push('valor = @valor');
    if (activo !== undefined) updateFields.push('activo = @activo');

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 });
    }

    updateFields.push('fecha_actualizacion = GETDATE()');

    const result = await pool.request()
      .input('id', parseInt(id))
      .input('codigo', codigo ? codigo.toUpperCase() : null)
      .input('descripcion', descripcion || null)
      .input('valor', valor !== undefined ? valor : null)
      .input('activo', activo !== undefined ? activo : null)
      .query(`
        UPDATE TiposIva 
        SET ${updateFields.join(', ')}
        WHERE id = @id;
        SELECT * FROM TiposIva WHERE id = @id;
      `);

    return NextResponse.json(result.recordset[0]);
  } catch (error) {
    console.error('Error updating tipo IVA:', error);
    return NextResponse.json({ error: 'Error al actualizar tipo de IVA' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pool = await getConnection();
    if (!pool) {
      return NextResponse.json({ error: 'Error de conexión a la base de datos' }, { status: 500 });
    }

    // Verificar si existe el registro
    const checkResult = await pool.request()
      .input('id', parseInt(id))
      .query('SELECT id FROM TiposIva WHERE id = @id');

    if (checkResult.recordset.length === 0) {
      return NextResponse.json({ error: 'Tipo de IVA no encontrado' }, { status: 404 });
    }

    // Soft delete - marcar como inactivo
    await pool.request()
      .input('id', parseInt(id))
      .query('UPDATE TiposIva SET activo = 0, fecha_actualizacion = GETDATE() WHERE id = @id');

    return NextResponse.json({ message: 'Tipo de IVA eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting tipo IVA:', error);
    return NextResponse.json({ error: 'Error al eliminar tipo de IVA' }, { status: 500 });
  }
}
