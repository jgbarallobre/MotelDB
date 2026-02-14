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
      .query(`
        SELECT 
          id, nombre, tipo, modelo, puerto, ip_address,
          caracteres_por_linea, activa, es_predeterminada,
          imprimir_logo, imprimir_qr, copiar_recibo,
          encabezado, pie_pagina, observaciones,
          fecha_creacion, fecha_actualizacion
        FROM Impresoras
        WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: 'Impresora no encontrada' }, { status: 404 });
    }

    return NextResponse.json(result.recordset[0]);
  } catch (error) {
    console.error('Error fetching impresoras:', error);
    return NextResponse.json({ error: 'Error al obtener impresora' }, { status: 500 });
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
    const { 
      nombre, tipo, modelo, puerto, ip_address,
      caracteres_por_linea, activa, es_predeterminada,
      imprimir_logo, imprimir_qr, copiar_recibo,
      encabezado, pie_pagina, observaciones
    } = body;

    // Si es_predeterminada, quitar predeterminada de otras
    if (es_predeterminada) {
      await pool.request()
        .input('id', parseInt(id))
        .query(`UPDATE Impresoras SET es_predeterminada = 0 WHERE id != @id`);
    }

    await pool.request()
      .input('id', parseInt(id))
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
        UPDATE Impresoras SET
          nombre = @nombre,
          tipo = @tipo,
          modelo = @modelo,
          puerto = @puerto,
          ip_address = @ip_address,
          caracteres_por_linea = @caracteres_por_linea,
          activa = @activa,
          es_predeterminada = @es_predeterminada,
          imprimir_logo = @imprimir_logo,
          imprimir_qr = @imprimir_qr,
          copiar_recibo = @copiar_recibo,
          encabezado = @encabezado,
          pie_pagina = @pie_pagina,
          observaciones = @observaciones,
          fecha_actualizacion = GETDATE()
        WHERE id = @id
      `);

    return NextResponse.json({ message: 'Impresora actualizada correctamente' });
  } catch (error) {
    console.error('Error updating impresoras:', error);
    return NextResponse.json({ error: 'Error al actualizar impresora' }, { status: 500 });
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

    const result = await pool.request()
      .input('id', parseInt(id))
      .query('DELETE FROM Impresoras WHERE id = @id');

    if (result.rowsAffected[0] === 0) {
      return NextResponse.json({ error: 'Impresora no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Impresora eliminada correctamente' });
  } catch (error) {
    console.error('Error deleting impresoras:', error);
    return NextResponse.json({ error: 'Error al eliminar impresora' }, { status: 500 });
  }
}
