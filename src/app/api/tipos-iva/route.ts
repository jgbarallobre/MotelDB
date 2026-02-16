import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

export async function GET() {
  try {
    const pool = await getConnection();
    if (!pool) {
      return NextResponse.json({ error: 'Error de conexión a la base de datos' }, { status: 500 });
    }

    const result = await pool.request()
      .query(`
        SELECT id, codigo, descripcion, valor, activo, fecha_creacion, fecha_actualizacion
        FROM TiposIva
        ORDER BY codigo
      `);

    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error('Error fetching tipos IVA:', error);
    return NextResponse.json({ error: 'Error al obtener tipos de IVA' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const pool = await getConnection();
    if (!pool) {
      return NextResponse.json({ error: 'Error de conexión a la base de datos' }, { status: 500 });
    }

    const body = await request.json();
    const { codigo, descripcion, valor } = body;

    // Validaciones
    if (!codigo || codigo.length !== 2) {
      return NextResponse.json({ error: 'El código debe tener exactamente 2 caracteres' }, { status: 400 });
    }

    if (!descripcion || descripcion.length > 15) {
      return NextResponse.json({ error: 'La descripción debe tener máximo 15 caracteres' }, { status: 400 });
    }

    if (valor === undefined || valor === null || valor < 0) {
      return NextResponse.json({ error: 'El valor debe ser un número positivo' }, { status: 400 });
    }

    // Verificar si el código ya existe
    const checkResult = await pool.request()
      .input('codigo', codigo)
      .query('SELECT id FROM TiposIva WHERE codigo = @codigo');

    if (checkResult.recordset.length > 0) {
      return NextResponse.json({ error: 'Ya existe un tipo de IVA con este código' }, { status: 400 });
    }

    // Insertar el nuevo tipo de IVA
    const result = await pool.request()
      .input('codigo', codigo.toUpperCase())
      .input('descripcion', descripcion)
      .input('valor', valor)
      .query(`
        INSERT INTO TiposIva (codigo, descripcion, valor)
        VALUES (@codigo, @descripcion, @valor);
        SELECT SCOPE_IDENTITY() as id;
      `);

    const newId = result.recordset[0].id;

    // Obtener el registro recién creado
    const newRecord = await pool.request()
      .input('id', newId)
      .query('SELECT * FROM TiposIva WHERE id = @id');

    return NextResponse.json(newRecord.recordset[0], { status: 201 });
  } catch (error) {
    console.error('Error creating tipo IVA:', error);
    return NextResponse.json({ error: 'Error al crear tipo de IVA' }, { status: 500 });
  }
}
