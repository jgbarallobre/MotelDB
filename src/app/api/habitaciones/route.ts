import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import type { Habitacion } from '@/types';

// GET - Obtener todas las habitaciones
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const activa = searchParams.get('activa');
    
    const pool = await getConnection();
    let query = 'SELECT * FROM Habitaciones WHERE 1=1';
    
    if (estado) {
      query += ' AND estado = @estado';
    }
    
    // Filtro por activa (si no se especifica, muestra todas)
    if (activa !== null && activa !== undefined) {
      query += ' AND activa = @activa';
    }
    
    query += ' ORDER BY numero';
    
    const request_db = pool.request();
    if (estado) {
      request_db.input('estado', estado);
    }
    if (activa !== null && activa !== undefined) {
      request_db.input('activa', activa === 'true' ? 1 : 0);
    }
    
    const result = await request_db.query(query);
    
    return NextResponse.json({
      success: true,
      data: result.recordset as Habitacion[]
    });
  } catch (error) {
    console.error('Error obteniendo habitaciones:', error);
    return NextResponse.json(
      { success: false, error: 'Error obteniendo habitaciones' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva habitación
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { numero, tipo, precio_hora, precio_noche, capacidad, descripcion, activa } = body;
    
    if (!numero || !tipo || !precio_hora || !precio_noche || !capacidad) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }
    
    const pool = await getConnection();
    const result = await pool.request()
      .input('numero', numero)
      .input('tipo', tipo)
      .input('precio_hora', precio_hora)
      .input('precio_noche', precio_noche)
      .input('capacidad', capacidad)
      .input('descripcion', descripcion || null)
      .input('activa', activa !== false ? 1 : 0)
      .query(`
        INSERT INTO Habitaciones (numero, tipo, precio_hora, precio_noche, capacidad, descripcion, activa)
        OUTPUT INSERTED.*
        VALUES (@numero, @tipo, @precio_hora, @precio_noche, @capacidad, @descripcion, @activa)
      `);
    
    return NextResponse.json({
      success: true,
      data: result.recordset[0]
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creando habitación:', error);
    
    if (error.number === 2627) { // Duplicate key error
      return NextResponse.json(
        { success: false, error: 'El número de habitación ya existe' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Error creando habitación' },
      { status: 500 }
    );
  }
}
