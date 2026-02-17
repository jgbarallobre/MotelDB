import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

// GET - Obtener un artículo por código
export async function GET(
  request: Request,
  { params }: { params: Promise<{ codigo: string }> }
) {
  try {
    const { codigo } = await params;
    const pool = await getConnection();
    if (!pool) {
      return NextResponse.json({ error: 'Error de conexión a la base de datos' }, { status: 500 });
    }

    const result = await pool.request()
      .input('codigo', codigo)
      .query(`
        SELECT 
          a.codigo,
          a.descripcion,
          a.departamento,
          d.descripcion as departamento_descripcion,
          a.tipo_iva,
          t.descripcion as tipo_iva_descripcion,
          t.valor as iva_porcentaje,
          a.precio1,
          a.precio2,
          a.precio3,
          a.existencia,
          a.inactivo,
          a.fecha_creacion,
          a.stock_min,
          a.stock_max,
          -- Precios sin IVA calculados
          ROUND(a.precio1 / (1 + t.valor/100), 2) as precio1_sin_iva,
          ROUND(a.precio2 / (1 + t.valor/100), 2) as precio2_sin_iva,
          ROUND(a.precio3 / (1 + t.valor/100), 2) as precio3_sin_iva
        FROM Articulos a
        LEFT JOIN Departamentos d ON a.departamento = d.codigo
        LEFT JOIN TiposIva t ON a.tipo_iva = t.codigo
        WHERE a.codigo = @codigo
      `);

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: 'Artículo no encontrado' }, { status: 404 });
    }

    return NextResponse.json(result.recordset[0]);
  } catch (error) {
    console.error('Error fetching articulo:', error);
    return NextResponse.json({ error: 'Error al obtener artículo' }, { status: 500 });
  }
}

// PUT - Actualizar un artículo
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ codigo: string }> }
) {
  try {
    const { codigo } = await params;
    const pool = await getConnection();
    if (!pool) {
      return NextResponse.json({ error: 'Error de conexión a la base de datos' }, { status: 500 });
    }

    const body = await request.json();
    const { 
      descripcion, 
      departamento, 
      tipo_iva, 
      precio1, 
      precio2, 
      precio3, 
      inactivo, 
      stock_min, 
      stock_max 
    } = body;

    // Verificar que el artículo exista
    const checkResult = await pool.request()
      .input('codigo', codigo)
      .query('SELECT codigo FROM Articulos WHERE codigo = @codigo');

    if (checkResult.recordset.length === 0) {
      return NextResponse.json({ error: 'Artículo no encontrado' }, { status: 404 });
    }

    // Validaciones
    if (descripcion && descripcion.length > 60) {
      return NextResponse.json({ error: 'La descripción debe tener máximo 60 caracteres' }, { status: 400 });
    }

    if (departamento) {
      if (departamento.length > 4) {
        return NextResponse.json({ error: 'El departamento debe tener máximo 4 caracteres' }, { status: 400 });
      }
      // Verificar que el departamento exista
      const deptResult = await pool.request()
        .input('departamento', departamento)
        .query('SELECT codigo FROM Departamentos WHERE codigo = @departamento');

      if (deptResult.recordset.length === 0) {
        return NextResponse.json({ error: 'El departamento no existe' }, { status: 400 });
      }
    }

    if (tipo_iva) {
      // Verificar que el tipo de IVA exista
      const ivaResult = await pool.request()
        .input('tipo_iva', tipo_iva)
        .query('SELECT codigo FROM TiposIva WHERE codigo = @tipo_iva');

      if (ivaResult.recordset.length === 0) {
        return NextResponse.json({ error: 'El tipo de IVA no existe' }, { status: 400 });
      }
    }

    // Actualizar el artículo (solo campos enviados, excluir existencia si no viene)
    const updateFields: string[] = [];
    const dbRequest = pool.request();
    dbRequest.input('codigo', codigo);
    
    if (descripcion !== undefined) {
      updateFields.push('descripcion = @descripcion');
      dbRequest.input('descripcion', descripcion);
    }
    if (departamento !== undefined) {
      updateFields.push('departamento = @departamento');
      dbRequest.input('departamento', departamento.toUpperCase());
    }
    if (tipo_iva !== undefined) {
      updateFields.push('tipo_iva = @tipo_iva');
      dbRequest.input('tipo_iva', tipo_iva);
    }
    if (precio1 !== undefined) {
      updateFields.push('precio1 = @precio1');
      dbRequest.input('precio1', precio1);
    }
    if (precio2 !== undefined) {
      updateFields.push('precio2 = @precio2');
      dbRequest.input('precio2', precio2);
    }
    if (precio3 !== undefined) {
      updateFields.push('precio3 = @precio3');
      dbRequest.input('precio3', precio3);
    }
    if (inactivo !== undefined) {
      updateFields.push('inactivo = @inactivo');
      dbRequest.input('inactivo', inactivo ? 1 : 0);
    }
    if (stock_min !== undefined) {
      updateFields.push('stock_min = @stock_min');
      dbRequest.input('stock_min', stock_min);
    }
    if (stock_max !== undefined) {
      updateFields.push('stock_max = @stock_max');
      dbRequest.input('stock_max', stock_max);
    }
    // NO actualizamos existencia al editar - solo se modifica desde el POS

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 });
    }

    await dbRequest.query(`UPDATE Articulos SET ${updateFields.join(', ')} WHERE codigo = @codigo`);

    // Obtener el registro actualizado
    const updatedRecord = await pool.request()
      .input('codigo', codigo)
      .query(`
        SELECT 
          a.codigo,
          a.descripcion,
          a.departamento,
          d.descripcion as departamento_descripcion,
          a.tipo_iva,
          t.descripcion as tipo_iva_descripcion,
          t.valor as iva_porcentaje,
          a.precio1,
          a.precio2,
          a.precio3,
          a.existencia,
          a.inactivo,
          a.fecha_creacion,
          a.stock_min,
          a.stock_max,
          ROUND(a.precio1 / (1 + t.valor/100), 2) as precio1_sin_iva,
          ROUND(a.precio2 / (1 + t.valor/100), 2) as precio2_sin_iva,
          ROUND(a.precio3 / (1 + t.valor/100), 2) as precio3_sin_iva
        FROM Articulos a
        LEFT JOIN Departamentos d ON a.departamento = d.codigo
        LEFT JOIN TiposIva t ON a.tipo_iva = t.codigo
        WHERE a.codigo = @codigo
      `);

    return NextResponse.json(updatedRecord.recordset[0]);
  } catch (error) {
    console.error('Error updating articulo:', error);
    return NextResponse.json({ error: 'Error al actualizar artículo' }, { status: 500 });
  }
}

// DELETE - Eliminar un artículo
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ codigo: string }> }
) {
  try {
    const { codigo } = await params;
    const pool = await getConnection();
    if (!pool) {
      return NextResponse.json({ error: 'Error de conexión a la base de datos' }, { status: 500 });
    }

    // Verificar que el artículo exista
    const checkResult = await pool.request()
      .input('codigo', codigo)
      .query('SELECT codigo FROM Articulos WHERE codigo = @codigo');

    if (checkResult.recordset.length === 0) {
      return NextResponse.json({ error: 'Artículo no encontrado' }, { status: 404 });
    }

    // Eliminar el artículo
    await pool.request()
      .input('codigo', codigo)
      .query('DELETE FROM Articulos WHERE codigo = @codigo');

    return NextResponse.json({ message: 'Artículo eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting articulo:', error);
    return NextResponse.json({ error: 'Error al eliminar artículo' }, { status: 500 });
  }
}
