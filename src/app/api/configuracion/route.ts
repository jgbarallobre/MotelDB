import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

export async function GET() {
  try {
    const pool = await getConnection();
    if (!pool) {
      return NextResponse.json(
        { error: 'Error de conexión a la base de datos' },
        { status: 500 }
      );
    }

    const result = await pool.request()
      .query(`
        SELECT 
          id,
          nombre_motel,
          direccion,
          telefono,
          email,
          nit,
          hora_checkin,
          hora_checkout,
          moneda,
          simbolo_moneda,
          tasa_impuesto,
          mensaje_recibo,
          logo_url,
          color_principal,
          color_secundario,
          fecha_actualizacion
        FROM ConfiguracionMotel
        WHERE id = 1
      `);

    if (result.recordset.length === 0) {
      // Crear configuración por defecto si no existe
      await pool.request()
        .query(`
          INSERT INTO ConfiguracionMotel (id, nombre_motel)
          VALUES (1, 'Motel Premium')
        `);
      
      const newConfig = await pool.request()
        .query('SELECT * FROM ConfiguracionMotel WHERE id = 1');
      
      return NextResponse.json(newConfig.recordset[0]);
    }

    return NextResponse.json(result.recordset[0]);
  } catch (error) {
    console.error('Error fetching config:', error);
    return NextResponse.json(
      { error: 'Error al obtener la configuración del motel' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const pool = await getConnection();
    if (!pool) {
      return NextResponse.json(
        { error: 'Error de conexión a la base de datos' },
        { status: 500 }
      );
    }

    const body = await request.json();

    // Construir la consulta dinámicamente solo con los campos proporcionados
    const updates: string[] = [];
    
    if (body.nombre_motel !== undefined) updates.push(`nombre_motel = '${body.nombre_motel.replace(/'/g, "''")}'`);
    if (body.direccion !== undefined) updates.push(`direccion = '${body.direccion.replace(/'/g, "''")}'`);
    if (body.telefono !== undefined) updates.push(`telefono = '${body.telefono.replace(/'/g, "''")}'`);
    if (body.email !== undefined) updates.push(`email = '${body.email.replace(/'/g, "''")}'`);
    if (body.nit !== undefined) updates.push(`nit = '${body.nit.replace(/'/g, "''")}'`);
    if (body.hora_checkin !== undefined) updates.push(`hora_checkin = '${body.hora_checkin}'`);
    if (body.hora_checkout !== undefined) updates.push(`hora_checkout = '${body.hora_checkout}'`);
    if (body.moneda !== undefined) updates.push(`moneda = '${body.moneda.replace(/'/g, "''")}'`);
    if (body.simbolo_moneda !== undefined) updates.push(`simbolo_moneda = '${body.simbolo_moneda.replace(/'/g, "''")}'`);
    if (body.tasa_impuesto !== undefined) updates.push(`tasa_impuesto = ${body.tasa_impuesto}`);
    if (body.mensaje_recibo !== undefined) updates.push(`mensaje_recibo = '${body.mensaje_recibo.replace(/'/g, "''")}'`);
    if (body.logo_url !== undefined) updates.push(`logo_url = '${body.logo_url.replace(/'/g, "''")}'`);
    if (body.color_principal !== undefined) updates.push(`color_principal = '${body.color_principal.replace(/'/g, "''")}'`);
    if (body.color_secundario !== undefined) updates.push(`color_secundario = '${body.color_secundario.replace(/'/g, "''")}'`);
    
    // Siempre actualizar fecha_actualizacion
    updates.push('fecha_actualizacion = GETDATE()');

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No hay campos para actualizar' },
        { status: 400 }
      );
    }

    const query = `
      UPDATE ConfiguracionMotel
      SET ${updates.join(', ')}
      WHERE id = 1;
      
      SELECT 
        id,
        nombre_motel,
        direccion,
        telefono,
        email,
        nit,
        hora_checkin,
        hora_checkout,
        moneda,
        simbolo_moneda,
        tasa_impuesto,
        mensaje_recibo,
        logo_url,
        color_principal,
        color_secundario,
        fecha_actualizacion
      FROM ConfiguracionMotel
      WHERE id = 1
    `;

    const result = await pool.request().query(query);

    return NextResponse.json(result.recordset[0]);
  } catch (error) {
    console.error('Error updating config:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la configuración del motel' },
      { status: 500 }
    );
  }
}
