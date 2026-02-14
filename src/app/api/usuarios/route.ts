import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

// GET - Obtener todos los usuarios
export async function GET() {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT 
        id, username, nombre, email, rol, activo, 
        fecha_creacion, ultimo_acceso
      FROM Usuarios
      ORDER BY nombre ASC
    `);
    
    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error('Error fetching usuarios:', error);
    return NextResponse.json(
      { error: 'Error al obtener usuarios' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo usuario
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password, nombre, email, rol } = body;

    // Validar campos requeridos
    if (!username || !password || !nombre || !rol) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    // Validar rol
    const rolesValidos = ['Admin', 'Recepcionista', 'Gerente'];
    if (!rolesValidos.includes(rol)) {
      return NextResponse.json(
        { error: 'Rol inválido' },
        { status: 400 }
      );
    }

    const pool = await getConnection();

    // Verificar si el username ya existe
    const existingUser = await pool.request()
      .input('username', username)
      .query('SELECT id FROM Usuarios WHERE username = @username');

    if (existingUser.recordset.length > 0) {
      return NextResponse.json(
        { error: 'El nombre de usuario ya existe' },
        { status: 400 }
      );
    }

    // Insertar usuario (en producción, hashear la contraseña)
    const result = await pool.request()
      .input('username', username)
      .input('password', password)
      .input('nombre', nombre)
      .input('email', email || null)
      .input('rol', rol)
      .query(`
        INSERT INTO Usuarios (username, password_hash, nombre, email, rol, activo)
        VALUES (@username, @password, @nombre, @email, @rol, 1);
        SELECT SCOPE_IDENTITY() as id;
      `);

    const newUserId = result.recordset[0].id;

    return NextResponse.json(
      { message: 'Usuario creado exitosamente', id: newUserId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating usuario:', error);
    return NextResponse.json(
      { error: 'Error al crear usuario' },
      { status: 500 }
    );
  }
}
