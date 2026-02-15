import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { jornada_id, monto_cierre_bs, monto_cierre_usd, observaciones, username, password } = body;

    // Validar credenciales si se proporcionan
    if (username && password) {
      const pool = await getConnection();
      
      const userResult = await pool.request()
        .input('username', username)
        .query(`
          SELECT id, username, password_hash
          FROM Usuarios
          WHERE username = @username AND activo = 1
        `);

      if (userResult.recordset.length === 0) {
        return NextResponse.json(
          { error: 'Usuario no encontrado o inactivo' },
          { status: 401 }
        );
      }

      const user = userResult.recordset[0];
      const isValidPassword = (password === user.password_hash);
      
      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'Contraseña incorrecta' },
          { status: 401 }
        );
      }
    }

    if (!jornada_id) {
      return NextResponse.json(
        { error: 'ID de jornada requerido' },
        { status: 400 }
      );
    }

    const pool = await getConnection();

    // Verificar que la jornada existe y está abierta
    const jornadaResult = await pool.request()
      .input('id', jornada_id)
      .query(`
        SELECT ja.*, j.nombre as jornada_nombre, u.nombre as usuario_nombre
        FROM JornadasAbiertas ja
        INNER JOIN jornadas j ON ja.jornada_id = j.id
        INNER JOIN usuarios u ON ja.usuario_id = u.id
        WHERE ja.id = @id AND ja.estado = 'Abierta'
      `);

    if (jornadaResult.recordset.length === 0) {
      return NextResponse.json(
        { error: 'Jornada no encontrada o ya está cerrada' },
        { status: 404 }
      );
    }

    const jornada = jornadaResult.recordset[0];

    // Cerrar la jornada
    await pool.request()
      .input('id', jornada_id)
      .input('monto_cierre_bs', monto_cierre_bs || 0)
      .input('monto_cierre_usd', monto_cierre_usd || 0)
      .input('observaciones', observaciones || '')
      .query(`
        UPDATE JornadasAbiertas
        SET estado = 'Cerrada',
            hora_fin = GETDATE(),
            monto_cierre_bs = @monto_cierre_bs,
            monto_cierre_usd = @monto_cierre_usd,
            observaciones = @observaciones
        WHERE id = @id
      `);

    return NextResponse.json({ 
      success: true, 
      message: 'Jornada finalizada correctamente',
      jornada: {
        id: jornada.id,
        jornada_nombre: jornada.jornada_nombre,
        usuario_nombre: jornada.usuario_nombre,
        fecha_trabajo: jornada.fecha_trabajo,
        hora_inicio: jornada.hora_inicio,
        hora_fin: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error finishing jornada:', error);
    return NextResponse.json(
      { error: 'Error al finalizar jornada' },
      { status: 500 }
    );
  }
}
