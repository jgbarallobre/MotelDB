import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

export async function GET() {
  try {
    const pool = await getConnection();
    
    const result = await pool.request()
      .query(`
        SELECT 
          id,
          codigo,
          descripcion,
          activo,
          fecha_creacion,
          fecha_actualizacion
        FROM Departamentos
        ORDER BY codigo ASC
      `);

    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error('Error fetching departamentos:', error);
    return NextResponse.json(
      { error: 'Error al obtener departamentos' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { codigo, descripcion } = body;

    if (!codigo || !descripcion) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: código y descripción' },
        { status: 400 }
      );
    }

    // Validate codigo length (4 characters)
    if (codigo.length !== 4) {
      return NextResponse.json(
        { error: 'El código debe tener exactamente 4 caracteres' },
        { status: 400 }
      );
    }

    // Validate descripcion length (max 30 characters)
    if (descripcion.length > 30) {
      return NextResponse.json(
        { error: 'La descripción debe tener máximo 30 caracteres' },
        { status: 400 }
      );
    }

    // Check for duplicate codigo
    const pool = await getConnection();
    const checkResult = await pool.request()
      .input('codigo', codigo.toUpperCase())
      .query('SELECT id FROM Departamentos WHERE codigo = @codigo');

    if (checkResult.recordset.length > 0) {
      return NextResponse.json(
        { error: 'Ya existe un departamento con este código' },
        { status: 400 }
      );
    }

    await pool.request()
      .input('codigo', codigo.toUpperCase())
      .input('descripcion', descripcion)
      .query(`
        INSERT INTO Departamentos (codigo, descripcion)
        VALUES (@codigo, @descripcion)
      `);

    return NextResponse.json({ message: 'Departamento creado exitosamente' });
  } catch (error) {
    console.error('Error creating departamento:', error);
    return NextResponse.json(
      { error: 'Error al crear departamento' },
      { status: 500 }
    );
  }
}
