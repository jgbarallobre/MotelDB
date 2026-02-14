import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      username, 
      password, 
      jornada_id, 
      fecha_trabajo, 
      monto_apertura_bs, 
      monto_apertura_usd, 
      tasa_cambio,
      observaciones 
    } = body;

    // Validar campos requeridos
    if (!username || !password || !jornada_id || !fecha_trabajo || !tasa_cambio) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    const pool = await getConnection();

    // 1. Validar credenciales del usuario
    const userResult = await pool.request()
      .input('username', username)
      .query(`
        SELECT id, username, password_hash, nombre, rol 
        FROM Usuarios 
        WHERE username = @username AND activo = 1
      `);

    if (userResult.recordset.length === 0) {
      return NextResponse.json(
        { error: 'Usuario no encontrado o inactivo' },
        { status: 401 }
      );
    }

    const usuario = userResult.recordset[0];
    const passwordValid = await bcrypt.compare(password, usuario.password_hash);

    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Contraseña incorrecta' },
        { status: 401 }
      );
    }

    // 2. Validar que la jornada existe y está activa
    const jornadaResult = await pool.request()
      .input('jornada_id', jornada_id)
      .query(`
        SELECT id, nombre, hora_inicio, hora_fin 
        FROM Jornadas 
        WHERE id = @jornada_id AND activo = 1
      `);

    if (jornadaResult.recordset.length === 0) {
      return NextResponse.json(
        { error: 'Jornada no válida o inactiva' },
        { status: 400 }
      );
    }

    // 3. Validar que no exista una jornada abierta
    const jornadaAbiertaResult = await pool.request()
      .query(`
        SELECT id, jornada_id, fecha_trabajo 
        FROM JornadasAbiertas 
        WHERE estado = 'Abierta'
      `);

    if (jornadaAbiertaResult.recordset.length > 0) {
      return NextResponse.json(
        { error: 'Ya existe una jornada abierta. Debe cerrarla antes de iniciar una nueva.' },
        { status: 400 }
      );
    }

    // 4. Validar que la fecha de trabajo no sea anterior a la última jornada cerrada
    const ultimaJornadaResult = await pool.request()
      .query(`
        SELECT TOP 1 fecha_trabajo 
        FROM JornadasAbiertas 
        WHERE estado = 'Cerrada' 
        ORDER BY fecha_trabajo DESC
      `);

    if (ultimaJornadaResult.recordset.length > 0) {
      const ultimaFecha = new Date(ultimaJornadaResult.recordset[0].fecha_trabajo);
      const fechaTrabajo = new Date(fecha_trabajo);
      
      if (fechaTrabajo < ultimaFecha) {
        return NextResponse.json(
          { error: `La fecha de trabajo no puede ser anterior a la última jornada trabajada (${ultimaFecha.toLocaleDateString('es-ES')})` },
          { status: 400 }
        );
      }
    }

    // 5. Insertar la nueva jornada abierta
    const insertResult = await pool.request()
      .input('jornada_id', jornada_id)
      .input('usuario_id', usuario.id)
      .input('fecha_trabajo', fecha_trabajo)
      .input('monto_apertura_bs', monto_apertura_bs || 0)
      .input('monto_apertura_usd', monto_apertura_usd || 0)
      .input('tasa_cambio', tasa_cambio)
      .input('observaciones', observaciones || '')
      .query(`
        INSERT INTO JornadasAbiertas (
          jornada_id, 
          usuario_id, 
          fecha_trabajo, 
          monto_apertura_bs, 
          monto_apertura_usd, 
          tasa_cambio,
          observaciones
        )
        VALUES (
          @jornada_id,
          @usuario_id,
          @fecha_trabajo,
          @monto_apertura_bs,
          @monto_apertura_usd,
          @tasa_cambio,
          @observaciones
        );
        
        SELECT SCOPE_IDENTITY() as id;
      `);

    const jornadaAbiertaId = insertResult.recordset[0].id;

    // 6. Registrar el acceso/log
    await pool.request()
      .input('usuario_id', usuario.id)
      .input('accion', 'INICIO_JORNADA')
      .query(`
        INSERT INTO LogAccesos (usuario_id, accion)
        VALUES (@usuario_id, @accion)
      `);

    return NextResponse.json({
      success: true,
      message: 'Jornada iniciada correctamente',
      jornada_id: jornadaAbiertaId,
      jornada_nombre: jornadaResult.recordset[0].nombre,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        username: usuario.username
      }
    });

  } catch (error) {
    console.error('Error al iniciar jornada:', error);
    return NextResponse.json(
      { error: 'Error al iniciar la jornada' },
      { status: 500 }
    );
  }
}
