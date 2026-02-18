import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { validarJornadaActiva, getJornadaActiva } from '@/lib/jornada';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const habitacion_id = searchParams.get('habitacion_id');

    if (!habitacion_id) {
      return NextResponse.json(
        { error: 'Se requiere el ID de la habitación' },
        { status: 400 }
      );
    }

    const pool = await getConnection();
    
    // Obtener información de la habitación
    const habitacionResult = await pool.request()
      .input('habitacion_id', habitacion_id)
      .query('SELECT * FROM Habitaciones WHERE id = @habitacion_id');

    if (habitacionResult.recordset.length === 0) {
      return NextResponse.json(
        { error: 'Habitación no encontrada' },
        { status: 404 }
      );
    }

    // Obtener tipos de estadía activos
    const tiposEstadiaResult = await pool.request()
      .query(`
        SELECT * FROM TiposEstadia 
        WHERE activo = 1 
        ORDER BY orden ASC
      `);

    // Obtener tasa de cambio del día
    const tasaResult = await pool.request()
      .query(`
        SELECT TOP 1 tasa 
        FROM TasasCambio 
        ORDER BY fecha_registro DESC
      `);

    const tasaActual = tasaResult.recordset.length > 0 
      ? tasaResult.recordset[0].tasa 
      : 1;

    // Obtener impresoras
    const impresorasResult = await pool.request()
      .query(`
        SELECT * FROM Impresoras 
        WHERE activa = 1 
        ORDER BY es_predeterminada DESC
      `);

    return NextResponse.json({
      habitacion: habitacionResult.recordset[0],
      tiposEstadia: tiposEstadiaResult.recordset,
      tasaCambio: tasaActual,
      impresoras: impresorasResult.recordset
    });
  } catch (error) {
    console.error('Error en checkin GET:', error);
    return NextResponse.json(
      { error: 'Error al cargar datos del check-in' },
      { status: 500 }
    );
  }
}

// POST - Procesar check-in completo con pago
export async function POST(request: Request) {
  const pool = await getConnection();
  const transaction = pool.transaction();

  try {
    const body = await request.json();
    const { 
      habitacion_id, 
      tipo_estadia_id, 
      cliente,
      pagos,
      usuario_id 
    } = body;

    if (!habitacion_id || !tipo_estadia_id || !cliente || !pagos || pagos.length === 0) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    await transaction.begin();

    // 1. Validar que hay una jornada activa y obtenerla
    const validacionJornada = await validarJornadaActiva();
    if (!validacionJornada.valida) {
      return NextResponse.json(
        { error: validacionJornada.error },
        { status: 403 }
      );
    }

    // Obtener jornada activa
    const jornadaActiva = await getJornadaActiva();
    const jornada_id = jornadaActiva?.id || null;

    // 2. Verificar habitación disponible
    const habitacionResult = await transaction.request()
      .input('habitacion_id', habitacion_id)
      .query('SELECT * FROM Habitaciones WHERE id = @habitacion_id AND estado = \'Disponible\'');

    if (habitacionResult.recordset.length === 0) {
      await transaction.rollback();
      return NextResponse.json(
        { error: 'Habitación no disponible' },
        { status: 400 }
      );
    }

    const habitacion = habitacionResult.recordset[0];

    // 2. Obtener tipo de estadía
    const tipoEstadiaResult = await transaction.request()
      .input('tipo_estadia_id', tipo_estadia_id)
      .query('SELECT * FROM TiposEstadia WHERE id = @tipo_estadia_id');

    if (tipoEstadiaResult.recordset.length === 0) {
      await transaction.rollback();
      return NextResponse.json(
        { error: 'Tipo de estadía no válido' },
        { status: 400 }
      );
    }

    const tipoEstadia = tipoEstadiaResult.recordset[0];

    // 3. Buscar o crear cliente
    let clienteResult = await transaction.request()
      .input('documento', cliente.documento)
      .query('SELECT * FROM Clientes WHERE documento = @documento');

    let cliente_id;
    
    if (clienteResult.recordset.length > 0) {
      cliente_id = clienteResult.recordset[0].id;
      // Actualizar última visita
      await transaction.request()
        .input('cliente_id', cliente_id)
        .query(`
          UPDATE Clientes 
          SET ultima_visita = GETDATE(), 
              total_visitas = total_visitas + 1 
          WHERE id = @cliente_id
        `);
    } else {
      // Crear nuevo cliente
      const nuevoCliente = await transaction.request()
        .input('nombre', cliente.nombre)
        .input('apellido', '')
        .input('documento', cliente.documento)
        .input('tipo_documento', 'Cédula')
        .input('telefono', cliente.telefono || '')
        .query(`
          INSERT INTO Clientes (nombre, apellido, documento, tipo_documento, telefono)
          OUTPUT INSERTED.id
          VALUES (@nombre, @apellido, @documento, @tipo_documento, @telefono)
        `);
      cliente_id = nuevoCliente.recordset[0].id;
    }

    // 4. Calcular fecha de salida
    const fechaEntrada = new Date();
    const fechaSalida = new Date(fechaEntrada);
    fechaSalida.setHours(fechaSalida.getHours() + tipoEstadia.duracion_horas);

    // 5. Calcular precio total
    const precioTotal = tipoEstadia.precio;

    // Obtener tasa de cambio
    const tasaResult = await transaction.request()
      .query(`SELECT TOP 1 tasa FROM TasasCambio ORDER BY fecha_registro DESC`);
    const tasaCambio = tasaResult.recordset.length > 0 ? tasaResult.recordset[0].tasa : 1;

    // 6. Calcular monto total pagado (ahora en BS)
    const montoPagado = pagos.reduce((sum: number, pago: { monto: number }) => sum + pago.monto, 0);

    if (montoPagado < precioTotal) {
      await transaction.rollback();
      return NextResponse.json(
        { error: 'El monto pagado es menor al precio de la estadía' },
        { status: 400 }
      );
    }

    // 7. Crear reserva
    const reservaResult = await transaction.request()
      .input('habitacion_id', habitacion_id)
      .input('cliente_id', cliente_id)
      .input('fecha_entrada', fechaEntrada)
      .input('fecha_salida', fechaSalida)
      .input('tipo_estadia', 'Por Hora')
      .input('horas_contratadas', tipoEstadia.duracion_horas)
      .input('precio_total', precioTotal)
      .input('observaciones', '')
      .query(`
        INSERT INTO Reservas (
          habitacion_id, cliente_id, fecha_entrada, fecha_salida, 
          tipo_estadia, horas_contratadas, precio_total, observaciones
        )
        OUTPUT INSERTED.*
        VALUES (
          @habitacion_id, @cliente_id, @fecha_entrada, @fecha_salida,
          @tipo_estadia, @horas_contratadas, @precio_total, @observaciones
        )
      `);

    const reserva = reservaResult.recordset[0];

    // 8. Registrar pagos (en ambas tablas - Pagos y PagosDetalle)
    for (const pago of pagos) {
      // Determinar el monto en BS basado en la forma de pago
      let montoBS = pago.monto;
      if (pago.es_divisa) {
        // Si es divisas, el monto ya viene en $, convertir a BS
        montoBS = pago.monto * tasaCambio;
      } else if (pago.monto_bs) {
        // Si ya tiene monto_bs, usarlo
        montoBS = pago.monto_bs;
      } else {
        // Es monto en BS
        montoBS = pago.monto;
      }

      // Guardar en tabla Pagos original (para compatibilidad)
      await transaction.request()
        .input('reserva_id', reserva.id)
        .input('monto', montoBS)
        .input('metodo_pago', pago.forma_pago || pago.metodo_pago)
        .input('comprobante', pago.referencia || '')
        .input('monto_bs', montoBS)
        .input('tasa_cambio', tasaCambio)
        .input('jornada_id', jornada_id)
        .input('usuario_id', usuario_id)
        .query(`
          INSERT INTO Pagos (reserva_id, monto, metodo_pago, comprobante, monto_bs, tasa_cambio, jornada_id, usuario_id)
          VALUES (@reserva_id, @monto, @metodo_pago, @comprobante, @monto_bs, @tasa_cambio, @jornada_id, @usuario_id)
        `);

      // Obtener forma_pago_id
      const formaPagoResult = await transaction.request()
        .input('codigo', pago.forma_pago || pago.metodo_pago)
        .query('SELECT id FROM FormasPago WHERE codigo = @codigo');
      
      const forma_pago_id = formaPagoResult.recordset.length > 0 
        ? formaPagoResult.recordset[0].id 
        : 1;

      // Guardar en tabla PagosDetalle (nuevo sistema)
      await transaction.request()
        .input('tipo_operacion', 'CHECKIN')
        .input('operacion_id', reserva.id)
        .input('forma_pago_id', forma_pago_id)
        .input('forma_pago_codigo', pago.forma_pago || pago.metodo_pago)
        .input('monto', pago.monto)
        .input('monto_bs', montoBS)
        .input('tasa_cambio', tasaCambio)
        .input('referencia', pago.referencia || '')
        .input('monto_vuelto', pago.vuelto || 0)
        .input('jornada_id', jornada_id)
        .input('usuario_id', usuario_id)
        .query(`
          INSERT INTO PagosDetalle (tipo_operacion, operacion_id, forma_pago_id, forma_pago_codigo, monto, monto_bs, tasa_cambio, referencia, monto_vuelto, jornada_id, usuario_id)
          VALUES (@tipo_operacion, @operacion_id, @forma_pago_id, @forma_pago_codigo, @monto, @monto_bs, @tasa_cambio, @referencia, @monto_vuelto, @jornada_id, @usuario_id)
        `);
    }

    // 9. Actualizar estado de habitación a Ocupada
    await transaction.request()
      .input('habitacion_id', habitacion_id)
      .query('UPDATE Habitaciones SET estado = \'Ocupada\' WHERE id = @habitacion_id');

    await transaction.commit();

    return NextResponse.json({
      success: true,
      reserva: {
        id: reserva.id,
        habitacion_id: reserva.habitacion_id,
        habitacion_numero: habitacion.numero,
        cliente_id: cliente_id,
        cliente_documento: cliente.documento,
        cliente_nombre: cliente.nombre,
        fecha_entrada: reserva.fecha_entrada,
        fecha_salida: reserva.fecha_salida,
        horas_contratadas: tipoEstadia.duracion_horas,
        precio_total: precioTotal,
        monto_pagado: montoPagado,
        tasa_cambio: tasaCambio,
        cambio: montoPagado - precioTotal
      },
      pagos: pagos.map((p: any) => ({
        forma_pago: p.forma_pago || p.metodo_pago,
        monto: p.monto,
        monto_bs: p.es_divisa ? p.monto * tasaCambio : p.monto,
        tasa_cambio: tasaCambio,
        referencia: p.referencia || ''
      }))
    }, { status: 201 });

  } catch (error) {
    await transaction.rollback();
    console.error('Error en checkin POST:', error);
    return NextResponse.json(
      { error: 'Error al procesar check-in' },
      { status: 500 }
    );
  }
}
