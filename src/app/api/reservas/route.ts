import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import type { Reserva } from '@/types';

// GET - Obtener todas las reservas
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const habitacion_id = searchParams.get('habitacion_id');
    
    const pool = await getConnection();
    let query = `
      SELECT 
        r.*,
        h.numero as habitacion_numero,
        h.tipo as habitacion_tipo,
        c.nombre as cliente_nombre,
        c.apellido as cliente_apellido,
        c.documento as cliente_documento
      FROM Reservas r
      INNER JOIN Habitaciones h ON r.habitacion_id = h.id
      INNER JOIN Clientes c ON r.cliente_id = c.id
      WHERE 1=1
    `;
    
    const request_db = pool.request();
    
    if (estado) {
      query += ' AND r.estado = @estado';
      request_db.input('estado', estado);
    }
    
    if (habitacion_id) {
      query += ' AND r.habitacion_id = @habitacion_id';
      request_db.input('habitacion_id', habitacion_id);
    }
    
    query += ' ORDER BY r.fecha_entrada DESC';
    
    const result = await request_db.query(query);
    
    return NextResponse.json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error('Error obteniendo reservas:', error);
    return NextResponse.json(
      { success: false, error: 'Error obteniendo reservas' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva reserva (Check-in)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { habitacion_id, cliente, tipo_estadia, horas_contratadas, observaciones } = body;
    
    if (!habitacion_id || !cliente || !tipo_estadia) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }
    
    const pool = await getConnection();
    const transaction = pool.transaction();
    
    try {
      await transaction.begin();
      
      // 1. Verificar que la habitación esté disponible
      const habitacionResult = await transaction.request()
        .input('habitacion_id', habitacion_id)
        .query('SELECT * FROM Habitaciones WHERE id = @habitacion_id AND estado = \'Disponible\'');
      
      if (habitacionResult.recordset.length === 0) {
        await transaction.rollback();
        return NextResponse.json(
          { success: false, error: 'Habitación no disponible' },
          { status: 400 }
        );
      }
      
      const habitacion = habitacionResult.recordset[0];
      
      // 2. Buscar o crear cliente
      let clienteResult = await transaction.request()
        .input('documento', cliente.documento)
        .query('SELECT * FROM Clientes WHERE documento = @documento');
      
      let cliente_id;
      
      if (clienteResult.recordset.length > 0) {
        cliente_id = clienteResult.recordset[0].id;
      } else {
        // Crear nuevo cliente
        const nuevoCliente = await transaction.request()
          .input('nombre', cliente.nombre)
          .input('apellido', cliente.apellido)
          .input('documento', cliente.documento)
          .input('tipo_documento', cliente.tipo_documento)
          .input('telefono', cliente.telefono || null)
          .query(`
            INSERT INTO Clientes (nombre, apellido, documento, tipo_documento, telefono)
            OUTPUT INSERTED.id
            VALUES (@nombre, @apellido, @documento, @tipo_documento, @telefono)
          `);
        
        cliente_id = nuevoCliente.recordset[0].id;
      }
      
      // 3. Calcular precio
      let precio_total;
      if (tipo_estadia === 'Por Hora') {
        precio_total = habitacion.precio_hora * (horas_contratadas || 1);
      } else {
        precio_total = habitacion.precio_noche;
      }
      
      // 4. Crear reserva
      const reservaResult = await transaction.request()
        .input('habitacion_id', habitacion_id)
        .input('cliente_id', cliente_id)
        .input('tipo_estadia', tipo_estadia)
        .input('horas_contratadas', horas_contratadas || null)
        .input('precio_total', precio_total)
        .input('observaciones', observaciones || null)
        .query(`
          INSERT INTO Reservas (habitacion_id, cliente_id, fecha_entrada, tipo_estadia, horas_contratadas, precio_total, observaciones)
          OUTPUT INSERTED.*
          VALUES (@habitacion_id, @cliente_id, GETDATE(), @tipo_estadia, @horas_contratadas, @precio_total, @observaciones)
        `);
      
      // 5. Actualizar estado de habitación a Ocupada
      await transaction.request()
        .input('habitacion_id', habitacion_id)
        .query('UPDATE Habitaciones SET estado = \'Ocupada\' WHERE id = @habitacion_id');
      
      await transaction.commit();
      
      return NextResponse.json({
        success: true,
        data: reservaResult.recordset[0],
        message: 'Check-in realizado correctamente'
      }, { status: 201 });
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('Error creando reserva:', error);
    return NextResponse.json(
      { success: false, error: 'Error creando reserva' },
      { status: 500 }
    );
  }
}
