import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import { validarJornadaActiva } from '@/lib/jornada';

// POST - Realizar check-out
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { servicios_adicionales, metodo_pago } = body;
    
    const pool = await getConnection();
    
    // Validar que hay una jornada activa
    const validacionJornada = await validarJornadaActiva();
    if (!validacionJornada.valida) {
      return NextResponse.json(
        { success: false, error: validacionJornada.error },
        { status: 403 }
      );
    }

    const transaction = pool.transaction();
    
    try {
      await transaction.begin();
      
      // 1. Obtener la reserva
      const reservaResult = await transaction.request()
        .input('id', id)
        .query('SELECT * FROM Reservas WHERE id = @id AND estado = \'Activa\'');
      
      if (reservaResult.recordset.length === 0) {
        await transaction.rollback();
        return NextResponse.json(
          { success: false, error: 'Reserva no encontrada o ya finalizada' },
          { status: 404 }
        );
      }
      
      const reserva = reservaResult.recordset[0];
      let precio_total = reserva.precio_total;
      
      // 2. Agregar servicios adicionales si existen
      if (servicios_adicionales && servicios_adicionales.length > 0) {
        for (const servicio of servicios_adicionales) {
          // Obtener precio del servicio
          const servicioResult = await transaction.request()
            .input('servicio_id', servicio.servicio_id)
            .query('SELECT precio FROM ServiciosAdicionales WHERE id = @servicio_id');
          
          if (servicioResult.recordset.length > 0) {
            const precio_unitario = servicioResult.recordset[0].precio;
            const subtotal = precio_unitario * servicio.cantidad;
            
            // Insertar servicio en ReservaServicios
            await transaction.request()
              .input('reserva_id', id)
              .input('servicio_id', servicio.servicio_id)
              .input('cantidad', servicio.cantidad)
              .input('precio_unitario', precio_unitario)
              .input('subtotal', subtotal)
              .query(`
                INSERT INTO ReservaServicios (reserva_id, servicio_id, cantidad, precio_unitario, subtotal)
                VALUES (@reserva_id, @servicio_id, @cantidad, @precio_unitario, @subtotal)
              `);
            
            precio_total += subtotal;
          }
        }
      }
      
      // 3. Actualizar reserva con fecha de salida y precio total
      await transaction.request()
        .input('id', id)
        .input('precio_total', precio_total)
        .query(`
          UPDATE Reservas
          SET fecha_salida = GETDATE(),
              precio_total = @precio_total,
              estado = 'Finalizada'
          WHERE id = @id
        `);
      
      // 4. Registrar pago
      const pagoResult = await transaction.request()
        .input('reserva_id', id)
        .input('monto', precio_total)
        .input('metodo_pago', metodo_pago)
        .query(`
          INSERT INTO Pagos (reserva_id, monto, metodo_pago)
          OUTPUT INSERTED.*
          VALUES (@reserva_id, @monto, @metodo_pago)
        `);
      
      // 5. Actualizar estado de habitación a Limpieza
      await transaction.request()
        .input('habitacion_id', reserva.habitacion_id)
        .query('UPDATE Habitaciones SET estado = \'Limpieza\' WHERE id = @habitacion_id');
      
      await transaction.commit();
      
      return NextResponse.json({
        success: true,
        data: {
          reserva_id: id,
          precio_total,
          pago: pagoResult.recordset[0]
        },
        message: 'Check-out realizado correctamente'
      });
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('Error en check-out:', error);
    return NextResponse.json(
      { success: false, error: 'Error realizando check-out' },
      { status: 500 }
    );
  }
}
