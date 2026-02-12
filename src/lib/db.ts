import sql from 'mssql';

// Configuración de la conexión a SQL Server
const config: sql.config = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'YourPassword123!',
  server: process.env.DB_SERVER || 'DESKTOP\\EXPRESS',
  database: process.env.DB_NAME || 'MotelDB',
  options: {
    encrypt: false, // Deshabilitar encriptación para compatibilidad
    trustServerCertificate: true, // Para desarrollo local
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// Pool de conexiones
let pool: sql.ConnectionPool | null = null;

export async function getConnection() {
  try {
    if (!pool) {
      pool = await sql.connect(config);
      console.log('✅ Conectado a SQL Server');
    }
    return pool;
  } catch (error) {
    console.error('❌ Error conectando a SQL Server:', error);
    throw error;
  }
}

export async function closeConnection() {
  try {
    if (pool) {
      await pool.close();
      pool = null;
      console.log('✅ Conexión cerrada');
    }
  } catch (error) {
    console.error('❌ Error cerrando conexión:', error);
  }
}

// Función para ejecutar queries
export async function query<T = any>(
  queryText: string,
  params?: Array<{ name: string; type: string; value: any }>
): Promise<T[]> {
  try {
    const connection = await getConnection();
    const request = connection.request();
    
    // Agregar parámetros si existen
    if (params) {
      params.forEach((param) => {
        // Usar el tipo de SQL correcto
        const sqlType = (sql as any)[param.type];
        request.input(param.name, sqlType, param.value);
      });
    }
    
    const result = await request.query(queryText);
    return result.recordset as T[];
  } catch (error) {
    console.error('❌ Error ejecutando query:', error);
    throw error;
  }
}

export { sql };
