import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

// GET - Obtener todas las formas de pago activas
export async function GET() {
  try {
    const pool = await getConnection();
    
    const result = await pool.request()
      .query(`
        SELECT * FROM FormasPago 
        WHERE activo = 1 
        ORDER BY orden ASC
      `);

    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error('Error al obtener formas de pago:', error);
    return NextResponse.json(
      { error: 'Error al obtener formas de pago' },
      { status: 500 }
    );
  }
}

// POST - Crear una nueva forma de pago
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      codigo, 
      nombre, 
      descripcion, 
      acepta_vuelto, 
      es_efectivo, 
      es_divisa, 
      requiere_referencia,
      icono,
      color,
      orden
    } = body;

    if (!codigo || !nombre) {
      return NextResponse.json(
        { error: 'El código y nombre son requeridos' },
        { status: 400 }
      );
    }

    const pool = await getConnection();
    
    // Verificar que el código no exista
    const existing = await pool.request()
      .input('codigo', codigo)
      .query('SELECT id FROM FormasPago WHERE codigo = @codigo');

    if (existing.recordset.length > 0) {
      return NextResponse.json(
        { error: 'Ya existe una forma de pago con ese código' },
        { status: 400 }
      );
    }

    const result = await pool.request()
      .input('codigo', codigo)
      .input('nombre', nombre)
      .input('descripcion', descripcion || '')
      .input('acepta_vuelto', acepta_vuelto || 0)
      .input('es_efectivo', es_efectivo || 0)
      .input('es_divisa', es_divisa || 0)
      .input('requiere_referencia', requiere_referencia || 0)
      .input('icono', icono || '💰')
      .input('color', color || '#3B82F6')
      .input('orden', orden || 0)
      .query(`
        INSERT INTO FormasPago (codigo, nombre, descripcion, acepta_vuelto, es_efectivo, es_divisa, requiere_referencia, icono, color, orden)
        OUTPUT INSERTED.id
        VALUES (@codigo, @nombre, @descripcion, @acepta_vuelto, @es_efectivo, @es_divisa, @requiere_referencia, @icono, @color, @orden)
      `);

    return NextResponse.json({
      success: true,
      id: result.recordset[0].id
    }, { status: 201 });
  } catch (error) {
    console.error('Error al crear forma de pago:', error);
    return NextResponse.json(
      { error: 'Error al crear forma de pago' },
      { status: 500 }
    );
  }
}
