import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';
import type { Habitacion } from '@/types';

// GET - Obtener todas las habitaciones
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    
    const pool = await getConnection();
    let query = 'SELECT * FROM Habitaciones';
    
    if (estado) {
      query += ' WHERE estado = @estado';
    }
    
    query += ' ORDER BY numero';
    
    const request_db = pool.request();
    if (estado) {
      request_db.input('estado', estado);
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
    const { numero, tipo, precio_hora, precio_noche, capacidad, descripcion } = body;
    
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
      .query(`
        INSERT INTO Habitaciones (numero, tipo, precio_hora, precio_noche, capacidad, descripcion)
        OUTPUT INSERTED.*
        VALUES (@numero, @tipo, @precio_hora, @precio_noche, @capacidad, @descripcion)
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
