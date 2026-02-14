import { NextResponse } from 'next/server';
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
          id,
          nombre,
          apellido,
          documento,
          tipo_documento,
          telefono,
          email,
          direccion,
          rif,
          razon_social,
          direccion_fiscal,
          telefono_facturacion,
          fecha_registro,
          ultima_visita,
          total_visitas
        FROM Clientes
        WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.recordset[0]);
  } catch (error) {
    console.error('Error fetching cliente:', error);
    return NextResponse.json(
      { error: 'Error al obtener cliente' },
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
    const { 
      nombre, 
      apellido, 
      documento, 
      tipo_documento, 
      telefono, 
      email, 
      direccion,
      rif,
      razon_social,
      direccion_fiscal,
      telefono_facturacion
    } = body;

    const pool = await getConnection();
    
    await pool.request()
      .input('id', parseInt(id))
      .input('nombre', nombre)
      .input('apellido', apellido)
      .input('documento', documento)
      .input('tipo_documento', tipo_documento)
      .input('telefono', telefono || null)
      .input('email', email || null)
      .input('direccion', direccion || null)
      .input('rif', rif || null)
      .input('razon_social', razon_social || null)
      .input('direccion_fiscal', direccion_fiscal || null)
      .input('telefono_facturacion', telefono_facturacion || null)
      .query(`
        UPDATE Clientes
        SET nombre = @nombre,
            apellido = @apellido,
            documento = @documento,
            tipo_documento = @tipo_documento,
            telefono = @telefono,
            email = @email,
            direccion = @direccion,
            rif = @rif,
            razon_social = @razon_social,
            direccion_fiscal = @direccion_fiscal,
            telefono_facturacion = @telefono_facturacion
        WHERE id = @id
      `);

    return NextResponse.json({ message: 'Cliente actualizado exitosamente' });
  } catch (error) {
    console.error('Error updating cliente:', error);
    return NextResponse.json(
      { error: 'Error al actualizar cliente' },
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
    
    // Verificar si tiene reservas asociadas
    const checkReservas = await pool.request()
      .input('id', parseInt(id))
      .query('SELECT COUNT(*) as count FROM Reservas WHERE cliente_id = @id');

    if (checkReservas.recordset[0].count > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar el cliente porque tiene reservas asociadas' },
        { status: 400 }
      );
    }

    await pool.request()
      .input('id', parseInt(id))
      .query(`DELETE FROM Clientes WHERE id = @id`);

    return NextResponse.json({ message: 'Cliente eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting cliente:', error);
    return NextResponse.json(
      { error: 'Error al eliminar cliente' },
      { status: 500 }
    );
  }
}
