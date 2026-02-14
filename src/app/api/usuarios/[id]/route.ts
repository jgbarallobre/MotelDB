import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const pool = await getConnection();
    const result = await pool.request()
      .input('id', parseInt(id))
      .query(`
        SELECT 
          id, username, nombre, email, rol, activo, 
          fecha_creacion, ultimo_acceso
        FROM Usuarios
        WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.recordset[0]);
  } catch (error) {
    console.error('Error fetching usuario:', error);
    return NextResponse.json(
      { error: 'Error al obtener usuario' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nombre, email, rol, activo, password } = body;

    // Validar rol si se proporciona
    if (rol) {
      const rolesValidos = ['Admin', 'Recepcionista', 'Gerente'];
      if (!rolesValidos.includes(rol)) {
        return NextResponse.json(
          { error: 'Rol inválido' },
          { status: 400 }
        );
      }
    }

    const pool = await getConnection();

    // Verificar si el usuario existe
    const existingUser = await pool.request()
      .input('id', parseInt(id))
      .query('SELECT id FROM Usuarios WHERE id = @id');

    if (existingUser.recordset.length === 0) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Construir query dinámico
    const request_db = pool.request().input('id', parseInt(id));
    let updateFields = [];

    if (nombre !== undefined) {
      updateFields.push('nombre = @nombre');
      request_db.input('nombre', nombre);
    }
    if (email !== undefined) {
      updateFields.push('email = @email');
      request_db.input('email', email);
    }
    if (rol !== undefined) {
      updateFields.push('rol = @rol');
      request_db.input('rol', rol);
    }
    if (activo !== undefined) {
      updateFields.push('activo = @activo');
      request_db.input('activo', activo);
    }
    if (password !== undefined && password !== '') {
      updateFields.push('password_hash = @password');
      request_db.input('password', password);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No hay campos para actualizar' },
        { status: 400 }
      );
    }

    const query = `UPDATE Usuarios SET ${updateFields.join(', ')} WHERE id = @id`;
    
    await request_db.query(query);

    return NextResponse.json({ message: 'Usuario actualizado exitosamente' });
  } catch (error) {
    console.error('Error updating usuario:', error);
    return NextResponse.json(
      { error: 'Error al actualizar usuario' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const pool = await getConnection();

    // Verificar si el usuario existe
    const existingUser = await pool.request()
      .input('id', parseInt(id))
      .query('SELECT id FROM Usuarios WHERE id = @id');

    if (existingUser.recordset.length === 0) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    await pool.request()
      .input('id', parseInt(id))
      .query('DELETE FROM Usuarios WHERE id = @id');

    return NextResponse.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting usuario:', error);
    return NextResponse.json(
      { error: 'Error al eliminar usuario' },
      { status: 500 }
    );
  }
}
