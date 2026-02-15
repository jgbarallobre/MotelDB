import { getConnection } from './db';

/**
 * Valida si existe una jornada activa (abierta)
 * @returns Objeto con { valida: boolean, jornada: object|null, error: string|null }
 */
export async function validarJornadaActiva() {
  try {
    const pool = await getConnection();
    
    const result = await pool.request().query(`
      SELECT TOP 1 
        ja.id,
        ja.jornada_id,
        ja.usuario_id,
        ja.fecha_trabajo,
        ja.hora_inicio,
        ja.estado,
        j.nombre as jornada_nombre,
        u.nombre as usuario_nombre
      FROM JornadasAbiertas ja
      INNER JOIN jornadas j ON ja.jornada_id = j.id
      INNER JOIN usuarios u ON ja.usuario_id = u.id
      WHERE ja.estado = 'Abierta'
      ORDER BY ja.hora_inicio DESC
    `);

    if (result.recordset.length === 0) {
      return {
        valida: false,
        jornada: null,
        error: 'No hay una jornada activa. Debe iniciar una jornada antes de realizar operaciones.'
      };
    }

    return {
      valida: true,
      jornada: result.recordset[0],
      error: null
    };
  } catch (error) {
    console.error('Error al validar jornada:', error);
    return {
      valida: false,
      jornada: null,
      error: 'Error al validar la jornada activa'
    };
  }
}

/**
 * Versión simplificada que lanza error si no hay jornada activa
 * Útil para usar en endpoints que requieren jornada
 * @throws Error si no hay jornada activa
 */
export async function requireJornadaActiva() {
  const { valida, jornada, error } = await validarJornadaActiva();
  
  if (!valida) {
    const err = new Error(error || 'No hay jornada activa');
    (err as any).code = 'JORNADA_INACTIVA';
    throw err;
  }
  
  return jornada;
}
