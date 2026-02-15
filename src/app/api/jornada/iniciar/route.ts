import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      jornada_id, 
      fecha_trabajo, 
      monto_bs, 
      monto_usd, 
      tasa_cambio,
      username, 
      password 
    } = body;

    // Validate required fields
    if (!jornada_id || !fecha_trabajo || tasa_cambio <= 0) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Credenciales requeridas' },
        { status: 400 }
      );
    }

    const pool = await getConnection();

    // Debug: Log what we're receiving
    console.log('[Jornada Iniciar] Username:', username, 'Password length:', password?.length);

    // First, validate user credentials
    const userResult = await pool.request()
      .input('username', username)
      .query(`
        SELECT id, username, password_hash, nombre, rol
        FROM Usuarios
        WHERE username = @username AND activo = 1
      `);

    console.log('[Jornada Iniciar] User found:', userResult.recordset.length > 0);
    if (userResult.recordset.length > 0) {
      console.log('[Jornada Iniciar] User data:', {
        username: userResult.recordset[0].username,
        password_hash: userResult.recordset[0].password_hash,
        isBcrypt: userResult.recordset[0].password_hash?.startsWith('$2')
      });
    }

    if (userResult.recordset.length === 0) {
      return NextResponse.json(
        { error: 'Usuario no encontrado o inactivo' },
        { status: 401 }
      );
    }

    const user = userResult.recordset[0];

    // Verify password - support both bcrypt hash and plain text for compatibility
    let isValidPassword = false;
    const storedPassword = user.password_hash;
    
    // First try bcrypt (for hashed passwords)
    if (storedPassword && storedPassword.startsWith('$2')) {
      console.log('[Jornada Iniciar] Verifying with bcrypt');
      isValidPassword = await bcrypt.compare(password, storedPassword);
      console.log('[Jornada Iniciar] Bcrypt result:', isValidPassword);
    } else {
      // Fall back to plain text comparison (for legacy passwords)
      console.log('[Jornada Iniciar] Verifying with plain text');
      console.log('[Jornada Iniciar] Stored:', storedPassword, 'Input:', password, 'Match:', password === storedPassword);
      isValidPassword = (password === storedPassword);
    }
    
    console.log('[Jornada Iniciar] Password valid:', isValidPassword);
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Contraseña incorrecta' },
        { status: 401 }
      );
    }

    // Check if there's already an active jornada
    const existingJornada = await pool.request()
      .query(`
        SELECT TOP 1 id 
        FROM JornadasAbiertas 
        WHERE estado = 'Abierta'
      `);

    if (existingJornada.recordset.length > 0) {
      return NextResponse.json(
        { error: 'Ya existe una jornada activa. Finalízala antes de iniciar otra.' },
        { status: 400 }
      );
    }

    // Validate that the work date is not before any previous jornada
    const lastJornada = await pool.request()
      .query(`
        SELECT TOP 1 fecha_trabajo
        FROM JornadasAbiertas
        ORDER BY fecha_trabajo DESC
      `);

    if (lastJornada.recordset.length > 0) {
      const lastDate = new Date(lastJornada.recordset[0].fecha_trabajo);
      const newDate = new Date(fecha_trabajo);
      
      if (newDate < lastDate) {
        return NextResponse.json(
          { error: `La fecha no puede ser anterior a la última jornada trabajada (${lastDate.toLocaleDateString('es-AR')})` },
          { status: 400 }
        );
      }
    }

    // Insert the new jornada
    const insertResult = await pool.request()
      .input('jornada_id', jornada_id)
      .input('usuario_id', user.id)
      .input('fecha_trabajo', fecha_trabajo)
      .input('monto_bs', monto_bs || 0)
      .input('monto_usd', monto_usd || 0)
      .input('tasa_cambio', tasa_cambio)
      .query(`
        INSERT INTO JornadasAbiertas (
          jornada_id, 
          usuario_id, 
          fecha_trabajo, 
          monto_apertura_bs, 
          monto_apertura_usd, 
          tasa_cambio, 
          estado
        )
        VALUES (
          @jornada_id, 
          @usuario_id, 
          @fecha_trabajo, 
          @monto_bs, 
          @monto_usd, 
          @tasa_cambio, 
          'Abierta'
        );
        SELECT SCOPE_IDENTITY() as id;
      `);

    const jornadaId = insertResult.recordset[0].id;

    // Get the created jornada with details
    const jornadaResult = await pool.request()
      .input('id', jornadaId)
      .query(`
        SELECT 
          ja.id,
          ja.jornada_id,
          ja.usuario_id,
          ja.fecha_trabajo,
          ja.hora_inicio,
          ja.monto_apertura_bs,
          ja.monto_apertura_usd,
          ja.tasa_cambio,
          ja.estado,
          j.nombre as jornada_nombre,
          j.hora_inicio as jornada_hora_inicio,
          j.hora_fin as jornada_hora_fin,
          u.nombre as usuario_nombre
        FROM JornadasAbiertas ja
        INNER JOIN jornadas j ON ja.jornada_id = j.id
        INNER JOIN usuarios u ON ja.usuario_id = u.id
        WHERE ja.id = @id
      `);

    return NextResponse.json({ 
      success: true, 
      jornadaActiva: jornadaResult.recordset[0] 
    });
  } catch (error) {
    console.error('Error starting jornada:', error);
    return NextResponse.json(
      { error: 'Error al iniciar jornada' },
      { status: 500 }
    );
  }
}
