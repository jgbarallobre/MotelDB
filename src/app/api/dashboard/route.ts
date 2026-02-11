import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

// GET - Obtener estadísticas del dashboard
export async function GET() {
  try {
    const pool = await getConnection();
    
    // Habitaciones disponibles
    const disponiblesResult = await pool.request()
      .query('SELECT COUNT(*) as count FROM Habitaciones WHERE estado = \'Disponible\'');
    
    // Habitaciones ocupadas
    const ocupadasResult = await pool.request()
      .query('SELECT COUNT(*) as count FROM Habitaciones WHERE estado = \'Ocupada\'');
    
    // Reservas activas
    const reservasActivasResult = await pool.request()
      .query('SELECT COUNT(*) as count FROM Reservas WHERE estado = \'Activa\'');
    
    // Ingresos de hoy
    const ingresosHoyResult = await pool.request()
      .query(`
        SELECT ISNULL(SUM(monto), 0) as total
        FROM Pagos
        WHERE CAST(fecha_pago AS DATE) = CAST(GETDATE() AS DATE)
      `);
    
    // Ingresos del mes
    const ingresosMesResult = await pool.request()
      .query(`
        SELECT ISNULL(SUM(monto), 0) as total
        FROM Pagos
        WHERE MONTH(fecha_pago) = MONTH(GETDATE())
        AND YEAR(fecha_pago) = YEAR(GETDATE())
      `);
    
    // Habitaciones por estado
    const habitacionesPorEstadoResult = await pool.request()
      .query(`
        SELECT estado, COUNT(*) as cantidad
        FROM Habitaciones
        GROUP BY estado
      `);
    
    // Últimas reservas
    const ultimasReservasResult = await pool.request()
      .query(`
        SELECT TOP 5
          r.id,
          r.fecha_entrada,
          r.estado,
          h.numero as habitacion_numero,
          c.nombre + ' ' + c.apellido as cliente_nombre
        FROM Reservas r
        INNER JOIN Habitaciones h ON r.habitacion_id = h.id
        INNER JOIN Clientes c ON r.cliente_id = c.id
        ORDER BY r.fecha_entrada DESC
      `);
    
    return NextResponse.json({
      success: true,
      data: {
        habitaciones_disponibles: disponiblesResult.recordset[0].count,
        habitaciones_ocupadas: ocupadasResult.recordset[0].count,
        reservas_activas: reservasActivasResult.recordset[0].count,
        ingresos_hoy: ingresosHoyResult.recordset[0].total,
        ingresos_mes: ingresosMesResult.recordset[0].total,
        habitaciones_por_estado: habitacionesPorEstadoResult.recordset,
        ultimas_reservas: ultimasReservasResult.recordset
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return NextResponse.json(
      { success: false, error: 'Error obteniendo estadísticas' },
      { status: 500 }
    );
  }
}
