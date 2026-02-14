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
        SELECT 
          id, nombre, tipo, modelo, puerto, ip_address,
          caracteres_por_linea, activa, es_predeterminada,
          imprimir_logo, imprimir_qr, copiar_recibo,
          encabezado, pie_pagina, observaciones,
          fecha_creacion, fecha_actualizacion
        FROM Impresoras
        ORDER BY es_predeterminada DESC, nombre ASC
      `);

    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error('Error fetching impresoras:', error);
    return NextResponse.json({ error: 'Error al obtener impresoras' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const pool = await getConnection();
    if (!pool) {
      return NextResponse.json({ error: 'Error de conexión a la base de datos' }, { status: 500 });
    }

    const body = await request.json();
    const { 
      nombre, tipo, modelo, puerto, ip_address,
      caracteres_por_linea, activa, es_predeterminada,
      imprimir_logo, imprimir_qr, copiar_recibo,
      encabezado, pie_pagina, observaciones
    } = body;

    // Si es_predeterminada, quitar predeterminada de otras
    if (es_predeterminada) {
      await pool.request()
        .query(`UPDATE Impresoras SET es_predeterminada = 0`);
    }

    const result = await pool.request()
      .input('nombre', nombre)
      .input('tipo', tipo)
      .input('modelo', modelo || '')
      .input('puerto', puerto || '')
      .input('ip_address', ip_address || '')
      .input('caracteres_por_linea', caracteres_por_linea || 40)
      .input('activa', activa !== false ? 1 : 0)
      .input('es_predeterminada', es_predeterminada ? 1 : 0)
      .input('imprimir_logo', imprimir_logo !== false ? 1 : 0)
      .input('imprimir_qr', imprimir_qr ? 1 : 0)
      .input('copiar_recibo', copiar_recibo || 1)
      .input('encabezado', encabezado || '')
      .input('pie_pagina', pie_pagina || '')
      .input('observaciones', observaciones || '')
      .query(`
        INSERT INTO Impresoras (
          nombre, tipo, modelo, puerto, ip_address,
          caracteres_por_linea, activa, es_predeterminada,
          imprimir_logo, imprimir_qr, copiar_recibo,
          encabezado, pie_pagina, observaciones
        ) VALUES (
          @nombre, @tipo, @modelo, @puerto, @ip_address,
          @caracteres_por_linea, @activa, @es_predeterminada,
          @imprimir_logo, @imprimir_qr, @copiar_recibo,
          @encabezado, @pie_pagina, @observaciones
        );
        SELECT SCOPE_IDENTITY() as id;
      `);

    const id = result.recordset[0].id;

    return NextResponse.json({ 
      message: 'Impresora creada correctamente', 
      id 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating impresoras:', error);
    return NextResponse.json({ error: 'Error al crear impresora' }, { status: 500 });
  }
}
