import { NextResponse } from 'next/server';
import { getConnection } from '@/lib/db';

export async function GET() {
  try {
    const pool = await getConnection();
    
    // Get today's sales
    const today = new Date().toISOString().split('T')[0];
    
    const result = await pool.request()
      .query(`
        SELECT 
          v.id,
          v.fecha,
          v.hora,
          v.monto_total,
          v.monto_bs,
          v.metodo_pago,
          v.usuario_id,
          u.nombre as usuario_nombre,
          (SELECT COUNT(*) FROM VentasDetalle WHERE venta_id = v.id) as items_count
        FROM Ventas v
        LEFT JOIN usuarios u ON v.usuario_id = u.id
        WHERE CONVERT(DATE, v.fecha) = CONVERT(DATE, '${today}')
        ORDER BY v.hora DESC
      `);
    
    return NextResponse.json({ ventas: result.recordset });
  } catch (error) {
    console.error('Error fetching ventas:', error);
    return NextResponse.json(
      { error: 'Error al obtener ventas' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let pool;
  
  try {
    const body = await request.json();
    const { 
      items, 
      metodoPago, 
      montoRecibidoUSD, 
      montoRecibidoBS,
      tasaCambio,
      usuarioId 
    } = body;

    // Validate required fields
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'No hay artículos en la venta' },
        { status: 400 }
      );
    }

    if (!metodoPago || !usuarioId) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }

    pool = await getConnection();
    
    // Start transaction
    const transaction = pool.transaction();
    
    // Calculate totals
    let subtotal = 0;
    let totalIVA = 0;
    
    // Validate inventory and calculate totals
    for (const item of items) {
      const articuloResult = await pool.request()
        .input('codigo', item.codigo)
        .query('SELECT precio1, existencia, iva_porcentaje FROM Articulos WHERE codigo = @codigo');
      
      if (articuloResult.recordset.length === 0) {
        return NextResponse.json(
          { error: `Artículo ${item.codigo} no encontrado` },
          { status: 400 }
        );
      }
      
      const articulo = articuloResult.recordset[0];
      
      if (articulo.existencia < item.cantidad) {
        return NextResponse.json(
          { error: `Stock insuficiente para ${item.codigo}` },
          { status: 400 }
        );
      }
      
      const itemSubtotal = item.precioUnitario * item.cantidad;
      const itemIVA = itemSubtotal * (item.ivaPorcentaje / 100);
      
      subtotal += itemSubtotal;
      totalIVA += itemIVA;
    }
    
    const total = subtotal + totalIVA;
    
    // Insert sale header
    const fecha = new Date().toISOString().split('T')[0];
    const hora = new Date().toTimeString().split(' ')[0].substring(0, 8);
    
    const insertVentaResult = await pool.request()
      .input('fecha', fecha)
      .input('hora', hora)
      .input('monto_total', montoRecibidoUSD || total)
      .input('monto_bs', montoRecibidoBS || (total * tasaCambio))
      .input('metodo_pago', metodoPago)
      .input('usuario_id', usuarioId)
      .input('tasa_cambio', tasaCambio)
      .query(`
        INSERT INTO Ventas (fecha, hora, monto_total, monto_bs, metodo_pago, usuario_id, tasa_cambio)
        VALUES (@fecha, @hora, @monto_total, @monto_bs, @metodo_pago, @usuario_id, @tasa_cambio);
        SELECT SCOPE_IDENTITY() as id;
      `);
    
    const ventaId = insertVentaResult.recordset[0].id;
    
    // Insert sale details and update inventory
    for (const item of items) {
      const itemSubtotal = item.precioUnitario * item.cantidad;
      const itemIVA = itemSubtotal * (item.ivaPorcentaje / 100);
      
      // Insert detail
      await pool.request()
        .input('venta_id', ventaId)
        .input('codigo', item.codigo)
        .input('cantidad', item.cantidad)
        .input('precio_unitario', item.precioUnitario)
        .input('iva_porcentaje', item.ivaPorcentaje)
        .input('subtotal', itemSubtotal)
        .query(`
          INSERT INTO VentasDetalle (venta_id, codigo, cantidad, precio_unitario, iva_porcentaje, subtotal)
          VALUES (@venta_id, @codigo, @cantidad, @precio_unitario, @iva_porcentaje, @subtotal)
        `);
      
      // Update inventory
      await pool.request()
        .input('codigo', item.codigo)
        .input('cantidad', item.cantidad)
        .query(`
          UPDATE Articulos 
          SET existencia = existencia - @cantidad 
          WHERE codigo = @codigo
        `);
    }
    
    // Get the created sale
    const ventaResult = await pool.request()
      .input('id', ventaId)
      .query(`
        SELECT v.*, u.nombre as usuario_nombre
        FROM Ventas v
        LEFT JOIN usuarios u ON v.usuario_id = u.id
        WHERE v.id = @id
      `);
    
    // Get sale details
    const detallesResult = await pool.request()
      .input('venta_id', ventaId)
      .query(`
        SELECT vd.*, a.descripcion
        FROM VentasDetalle vd
        LEFT JOIN Articulos a ON vd.codigo = a.codigo
        WHERE vd.venta_id = @venta_id
      `);
    
    return NextResponse.json({
      success: true,
      venta: {
        ...ventaResult.recordset[0],
        detalles: detallesResult.recordset
      }
    });
    
  } catch (error) {
    console.error('Error processing venta:', error);
    return NextResponse.json(
      { error: 'Error al procesar la venta' },
      { status: 500 }
    );
  }
}
