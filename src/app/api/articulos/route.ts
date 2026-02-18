import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

// GET - Listar todos los artículos
export async function GET() {
  try {
    const pool = await getConnection();
    if (!pool) {
      return NextResponse.json({ error: 'Error de conexión a la base de datos' }, { status: 500 });
    }

    const result = await pool.request().query(`
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
        CASE WHEN a.inactivo = 1 THEN 0 ELSE 1 END as activo,
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
      ORDER BY a.codigo
    `);

    return NextResponse.json({ articulos: result.recordset });
  } catch (error) {
    console.error('Error fetching articulos:', error);
    return NextResponse.json({ error: 'Error al obtener artículos' }, { status: 500 });
  }
}

// POST - Crear nuevo artículo
export async function POST(request: Request) {
  try {
    const pool = await getConnection();
    if (!pool) {
      return NextResponse.json({ error: 'Error de conexión a la base de datos' }, { status: 500 });
    }

    const body = await request.json();
    const { 
      codigo, 
      descripcion, 
      departamento, 
      tipo_iva = '01', 
      precio1 = 0, 
      precio2 = 0, 
      precio3 = 0, 
      existencia = 0, 
      inactivo = false, 
      stock_min = 0, 
      stock_max = 0 
    } = body;

    // Validaciones
    if (!codigo || codigo.length > 15) {
      return NextResponse.json({ error: 'El código debe tener máximo 15 caracteres' }, { status: 400 });
    }

    if (!descripcion || descripcion.length > 60) {
      return NextResponse.json({ error: 'La descripción debe tener máximo 60 caracteres' }, { status: 400 });
    }

    if (!departamento || departamento.length > 4) {
      return NextResponse.json({ error: 'El departamento debe tener máximo 4 caracteres' }, { status: 400 });
    }

    // Verificar si el código ya existe
    const checkResult = await pool.request()
      .input('codigo', codigo)
      .query('SELECT codigo FROM Articulos WHERE codigo = @codigo');

    if (checkResult.recordset.length > 0) {
      return NextResponse.json({ error: 'Ya existe un artículo con este código' }, { status: 400 });
    }

    // Verificar que el departamento exista
    const deptResult = await pool.request()
      .input('departamento', departamento)
      .query('SELECT codigo FROM Departamentos WHERE codigo = @departamento');

    if (deptResult.recordset.length === 0) {
      return NextResponse.json({ error: 'El departamento no existe' }, { status: 400 });
    }

    // Verificar que el tipo de IVA exista
    const ivaResult = await pool.request()
      .input('tipo_iva', tipo_iva)
      .query('SELECT codigo FROM TiposIva WHERE codigo = @tipo_iva');

    if (ivaResult.recordset.length === 0) {
      return NextResponse.json({ error: 'El tipo de IVA no existe' }, { status: 400 });
    }

    // Insertar el nuevo artículo
    await pool.request()
      .input('codigo', codigo.toUpperCase())
      .input('descripcion', descripcion)
      .input('departamento', departamento.toUpperCase())
      .input('tipo_iva', tipo_iva)
      .input('precio1', precio1)
      .input('precio2', precio2)
      .input('precio3', precio3)
      .input('existencia', existencia)
      .input('inactivo', inactivo ? 1 : 0)
      .input('stock_min', stock_min)
      .input('stock_max', stock_max)
      .query(`
        INSERT INTO Articulos (codigo, descripcion, departamento, tipo_iva, precio1, precio2, precio3, existencia, inactivo, stock_min, stock_max)
        VALUES (@codigo, @descripcion, @departamento, @tipo_iva, @precio1, @precio2, @precio3, @existencia, @inactivo, @stock_min, @stock_max)
      `);

    // Obtener el registro recién creado
    const newRecord = await pool.request()
      .input('codigo', codigo.toUpperCase())
      .query('SELECT * FROM Articulos WHERE codigo = @codigo');

    return NextResponse.json(newRecord.recordset[0], { status: 201 });
  } catch (error) {
    console.error('Error creating articulo:', error);
    return NextResponse.json({ error: 'Error al crear artículo' }, { status: 500 });
  }
}
