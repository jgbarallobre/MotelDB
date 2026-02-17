import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

// GET - Buscar artículos por código o descripción
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    const pool = await getConnection();
    if (!pool) {
      return NextResponse.json({ error: 'Error de conexión a la base de datos' }, { status: 500 });
    }

    let result;
    if (query) {
      // Buscar por código o descripción
      result = await pool.request()
        .input('query', `%${query}%`)
        .query(`
          SELECT 
            a.codigo,
            a.descripcion,
            a.departamento,
            d.descripcion as departamento_descripcion,
            a.tipo_iva,
            t.descripcion as tipo_iva_descripcion,
            a.precio1,
            a.precio2,
            a.precio3,
            a.existencia,
            a.inactivo
          FROM Articulos a
          LEFT JOIN Departamentos d ON a.departamento = d.codigo
          LEFT JOIN TiposIva t ON a.tipo_iva = t.codigo
          WHERE a.codigo LIKE @query 
             OR a.descripcion LIKE @query
             AND a.inactivo = 0
          ORDER BY a.codigo
          LIMIT 20
        `);
    } else {
      // Si no hay query, devolver todos los activos
      result = await pool.request()
        .query(`
          SELECT 
            a.codigo,
            a.descripcion,
            a.departamento,
            d.descripcion as departamento_descripcion,
            a.tipo_iva,
            t.descripcion as tipo_iva_descripcion,
            a.precio1,
            a.precio2,
            a.precio3,
            a.existencia,
            a.inactivo
          FROM Articulos a
          LEFT JOIN Departamentos d ON a.departamento = d.codigo
          LEFT JOIN TiposIva t ON a.tipo_iva = t.codigo
          WHERE a.inactivo = 0
          ORDER BY a.codigo
          LIMIT 20
        `);
    }

    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error('Error searching articulos:', error);
    return NextResponse.json({ error: 'Error al buscar artículos' }, { status: 500 });
  }
}
