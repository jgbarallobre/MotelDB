import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

export async function GET() {
  try {
    const pool = await getConnection();
    
    const result = await pool.request()
      .query(`
        SELECT 
          id,
          nombre,
          apellido,
          documento,
          tipo_documento,
          telefono,
          email,
          direccion,
          rif,
          razon_social,
          direccion_fiscal,
          telefono_facturacion,
          fecha_registro,
          ultima_visita,
          total_visitas
        FROM Clientes
        ORDER BY fecha_registro DESC
      `);

    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error('Error fetching clientes:', error);
    return NextResponse.json(
      { error: 'Error al obtener clientes' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      nombre, 
      apellido, 
      documento, 
      tipo_documento, 
      telefono, 
      email, 
      direccion,
      rif,
      razon_social,
      direccion_fiscal,
      telefono_facturacion
    } = body;

    if (!nombre || !apellido || !documento || !tipo_documento) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: nombre, apellido, documento, tipo_documento' },
        { status: 400 }
      );
    }

    const pool = await getConnection();
    
    // Verificar si el documento ya existe
    const checkExisting = await pool.request()
      .input('documento', documento)
      .query('SELECT id FROM Clientes WHERE documento = @documento');

    if (checkExisting.recordset.length > 0) {
      return NextResponse.json(
        { error: 'Ya existe un cliente con este documento' },
        { status: 400 }
      );
    }

    await pool.request()
      .input('nombre', nombre)
      .input('apellido', apellido)
      .input('documento', documento)
      .input('tipo_documento', tipo_documento)
      .input('telefono', telefono || null)
      .input('email', email || null)
      .input('direccion', direccion || null)
      .input('rif', rif || null)
      .input('razon_social', razon_social || null)
      .input('direccion_fiscal', direccion_fiscal || null)
      .input('telefono_facturacion', telefono_facturacion || null)
      .query(`
        INSERT INTO Clientes (nombre, apellido, documento, tipo_documento, telefono, email, direccion, rif, razon_social, direccion_fiscal, telefono_facturacion)
        VALUES (@nombre, @apellido, @documento, @tipo_documento, @telefono, @email, @direccion, @rif, @razon_social, @direccion_fiscal, @telefono_facturacion)
      `);

    return NextResponse.json({ message: 'Cliente creado exitosamente' });
  } catch (error) {
    console.error('Error creating cliente:', error);
    return NextResponse.json(
      { error: 'Error al crear cliente' },
      { status: 500 }
    );
  }
}
