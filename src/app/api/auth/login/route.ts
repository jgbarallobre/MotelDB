import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Usuario y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Consultar usuario en la base de datos
    const result = await query(
      `SELECT id, username, nombre, rol, activo 
       FROM Usuarios 
       WHERE username = @username AND password_hash = @password AND activo = 1`,
      [
        { name: 'username', type: 'VarChar', value: username },
        { name: 'password', type: 'VarChar', value: password }, // En producción usar hash
      ]
    );

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Credenciales incorrectas' },
        { status: 401 }
      );
    }

    const user = result[0];

    // Registrar el inicio de sesión
    await query(
      `INSERT INTO LogAccesos (usuario_id, accion, ip_address) 
       VALUES (@usuario_id, 'login', @ip)`,
      [
        { name: 'usuario_id', type: 'Int', value: user.id },
        { name: 'ip', type: 'VarChar', value: request.headers.get('x-forwarded-for') || 'unknown' },
      ]
    );

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        nombre: user.nombre,
        rol: user.rol,
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json(
      { success: false, error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}
