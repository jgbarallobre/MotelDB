import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

export async function GET() {
  try {
    const connection = await getConnection();
    return NextResponse.json({
      success: true,
      message: '✅ Conexión a base de datos establecida',
      database: 'MotelDB',
      connected: true
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: '❌ Error de conexión a base de datos',
      connected: false,
      error: 'Verifique la configuración de SQL Server'
    }, { status: 500 });
  }
}
