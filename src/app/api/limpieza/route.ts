'use strict';

import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { validarJornadaActiva } from '@/lib/jornada';

// GET - Obtener historial de limpieza por habitación
export async function GET(request: Request) {
  let pool = null;
  try {
    const { searchParams } = new URL(request.url);
    const habitacionId = searchParams.get('habitacion_id');

    pool = await getConnection();
    
    let query = `
      SELECT 
        hl.id,
        hl.habitacion_id,
        h.numero as habitacion_numero,
        hl.tipo_accion,
        hl.fecha_inicio,
        hl.fecha_fin,
        hl.duracion_minutos,
        hl.observaciones,
        u_inicio.nombre as usuario_inicio,
        u_fin.nombre as usuario_fin
      FROM HistorialLimpieza hl
      INNER JOIN Habitaciones h ON hl.habitacion_id = h.id
      LEFT JOIN Usuarios u_inicio ON hl.usuario_inicio_id = u_inicio.id
      LEFT JOIN Usuarios u_fin ON hl.usuario_fin_id = u_fin.id
    `;

    if (habitacionId) {
      query += ` WHERE hl.habitacion_id = @habitacionId ORDER BY hl.fecha_inicio DESC`;
    } else {
      query += ` ORDER BY hl.fecha_inicio DESC`;
    }

    const result = await pool.request()
      .input('habitacionId', habitacionId)
      .query(query);

    return NextResponse.json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error('Error en GET /api/limpieza:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al obtener historial de limpieza'
    }, { status: 500 });
  }
}

// POST - Iniciar o finalizar limpieza/mantenimiento
export async function POST(request: Request) {
  let pool = null;
  try {
    const body = await request.json();
    const { 
      accion, // 'iniciar' o 'finalizar'
      habitacion_id, 
      tipo_accion, // 'Limpieza' o 'Mantenimiento'
      usuario_id,
      observaciones 
    } = body;

    if (!habitacion_id || !accion) {
      return NextResponse.json({
        success: false,
        error: 'Faltan datos requeridos'
      }, { status: 400 });
    }

    pool = await getConnection();

    // Validar que hay una jornada activa
    const validacionJornada = await validarJornadaActiva();
    if (!validacionJornada.valida) {
      return NextResponse.json({
        success: false,
        error: validacionJornada.error
      }, { status: 403 });
    }

    if (accion === 'iniciar') {
      // Iniciar limpieza o mantenimiento
      if (!tipo_accion) {
        return NextResponse.json({
          success: false,
          error: 'El tipo de acción es requerido'
        }, { status: 400 });
      }

      // Actualizar estado de la habitación
      await pool.request()
        .input('habitacion_id', habitacion_id)
        .input('estado', tipo_accion)
        .query(`UPDATE Habitaciones SET estado = @estado WHERE id = @habitacion_id`);

      // Registrar en historial - usar la fecha enviada por el cliente (hora local del navegador)
      const fechaInicio = body.fecha_inicio || new Date().toISOString();
      
      const result = await pool.request()
        .input('habitacion_id', habitacion_id)
        .input('tipo_accion', tipo_accion)
        .input('usuario_id', usuario_id)
        .input('observaciones', observaciones || '')
        .input('fecha_inicio', fechaInicio)
        .query(`
          INSERT INTO HistorialLimpieza (habitacion_id, tipo_accion, fecha_inicio, usuario_inicio_id, observaciones)
          VALUES (@habitacion_id, @tipo_accion, @fecha_inicio, @usuario_id, @observaciones);
          SELECT SCOPE_IDENTITY() as id;
        `);

      return NextResponse.json({
        success: true,
        message: `${tipo_accion} iniciada`,
        historial_id: result.recordset[0].id
      });
    } 
    else if (accion === 'finalizar') {
      // Finalizar limpieza o mantenimiento
      // Obtener el registro activo más reciente
      const historial = await pool.request()
        .input('habitacion_id', habitacion_id)
        .query(`
          SELECT TOP 1 id, fecha_inicio, tipo_accion 
          FROM HistorialLimpieza 
          WHERE habitacion_id = @habitacion_id AND fecha_fin IS NULL
          ORDER BY fecha_inicio DESC
        `);

      if (historial.recordset.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'No hay registro de limpieza/mantenimiento activo'
        }, { status: 400 });
      }

      const historialId = historial.recordset[0].id;
      const fechaInicio = historial.recordset[0].fecha_inicio;
      const tipoAccion = historial.recordset[0].tipo_accion;

      // Calcular duración en minutos
      const fechaFin = new Date();
      const duracionMinutos = Math.round((fechaFin.getTime() - new Date(fechaInicio).getTime()) / 60000);

      // Actualizar historial
      await pool.request()
        .input('historial_id', historialId)
        .input('usuario_fin_id', usuario_id)
        .input('duracion_minutos', duracionMinutos)
        .query(`
          UPDATE HistorialLimpieza 
          SET fecha_fin = GETDATE(), 
              usuario_fin_id = @usuario_fin_id, 
              duracion_minutos = @duracion_minutos
          WHERE id = @historial_id
        `);

      // Cambiar estado de la habitación a Disponible
      await pool.request()
        .input('habitacion_id', habitacion_id)
        .query(`UPDATE Habitaciones SET estado = 'Disponible' WHERE id = @habitacion_id`);

      return NextResponse.json({
        success: true,
        message: `${tipoAccion} finalizada - habitación disponible`,
        duracion_minutos: duracionMinutos
      });
    }
    else {
      return NextResponse.json({
        success: false,
        error: 'Acción inválida. Use "iniciar" o "finalizar"'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error en POST /api/limpieza:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al procesar solicitud'
    }, { status: 500 });
  }
}
