# 🏨 Sistema de Gestión de Motel

Sistema completo de gestión para moteles desarrollado con Next.js 16, TypeScript y SQL Server.

## 🚀 Características

- ✅ **Dashboard en tiempo real** con estadísticas
- 🏠 **Gestión de habitaciones** (disponibilidad, precios, estados)
- 📋 **Sistema de reservas** (check-in/check-out)
- 👥 **Gestión de clientes** automática
- 💰 **Control de pagos** (efectivo, tarjeta, transferencia)
- 📊 **Reportes e ingresos** diarios y mensuales
- 🎨 **Interfaz moderna y responsive**

## 📋 Requisitos Previos

- Node.js 20+ o Bun
- SQL Server (local o Azure)
- SQL Server Management Studio o Azure Data Studio (para ejecutar el script de BD)

## 🛠️ Instalación

### 1. Clonar el repositorio

```bash
git clone <tu-repositorio>
cd motel-management
```

### 2. Instalar dependencias

```bash
bun install
# o
npm install
```

### 3. Configurar la base de datos

#### Opción A: SQL Server Local

1. Instala SQL Server Express (gratuito)
2. Abre SQL Server Management Studio
3. Ejecuta el script `database/init.sql`
4. Esto creará la base de datos `MotelDB` con todas las tablas y datos de ejemplo

#### Opción B: Azure SQL Database

1. Crea una base de datos en Azure
2. Ejecuta el script `database/init.sql` en Azure Data Studio
3. Actualiza las credenciales en `.env.local`

### 4. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
DB_USER=sa
DB_PASSWORD=TuPassword123
DB_SERVER=localhost
DB_NAME=MotelDB
```

**Importante:** Cambia estos valores según tu configuración de SQL Server.

### 5. Ejecutar el proyecto

```bash
bun dev
# o
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📁 Estructura del Proyecto

```
├── database/
│   └── init.sql                    # Script de inicialización de BD
├── src/
│   ├── app/
│   │   ├── api/                    # API Routes
│   │   │   ├── dashboard/          # Estadísticas
│   │   │   ├── habitaciones/       # CRUD habitaciones
│   │   │   └── reservas/           # Check-in/Check-out
│   │   ├── habitaciones/           # Página de habitaciones
│   │   ├── reservas/               # Página de reservas
│   │   │   └── nueva/              # Formulario check-in
│   │   ├── page.tsx                # Dashboard principal
│   │   └── layout.tsx              # Layout raíz
│   ├── lib/
│   │   └── db.ts                   # Conexión a SQL Server
│   └── types/
│       └── index.ts                # Tipos TypeScript
└── .env.local                      # Variables de entorno
```

## 🎯 Uso del Sistema

### Dashboard Principal

- Ver estadísticas en tiempo real
- Habitaciones disponibles/ocupadas
- Ingresos del día y del mes
- Últimas reservas

### Gestión de Habitaciones

1. Ve a "Habitaciones"
2. Filtra por estado (Disponible, Ocupada, Limpieza, Mantenimiento)
3. Cambia el estado de las habitaciones
4. Haz check-in directamente desde una habitación disponible

### Realizar Check-in

1. Haz clic en "Nueva Reserva" o "Hacer Check-in" en una habitación
2. Selecciona la habitación
3. Ingresa los datos del cliente
4. Elige el tipo de estadía (Por Hora o Por Noche)
5. Confirma la reserva

### Realizar Check-out

1. Ve a "Reservas"
2. Filtra por "Activas"
3. Haz clic en "Check-out" en la reserva deseada
4. Selecciona el método de pago
5. Confirma el check-out

## 🗄️ Estructura de la Base de Datos

### Tablas Principales

- **Habitaciones**: Información de las habitaciones del motel
- **Clientes**: Datos de los clientes (se crean automáticamente)
- **Reservas**: Registro de check-ins y check-outs
- **Pagos**: Historial de pagos
- **ServiciosAdicionales**: Servicios extra (bebidas, toallas, etc.)
- **ReservaServicios**: Servicios agregados a cada reserva

## 🔧 Comandos Disponibles

```bash
# Desarrollo
bun dev

# Compilar para producción
bun build

# Iniciar en producción
bun start

# Verificar tipos
bun typecheck

# Linter
bun lint
```

## 🌐 API Endpoints

### Habitaciones

- `GET /api/habitaciones` - Listar habitaciones
- `GET /api/habitaciones?estado=Disponible` - Filtrar por estado
- `GET /api/habitaciones/[id]` - Obtener una habitación
- `POST /api/habitaciones` - Crear habitación
- `PUT /api/habitaciones/[id]` - Actualizar habitación
- `PATCH /api/habitaciones/[id]` - Cambiar estado
- `DELETE /api/habitaciones/[id]` - Eliminar habitación

### Reservas

- `GET /api/reservas` - Listar reservas
- `GET /api/reservas?estado=Activa` - Filtrar por estado
- `POST /api/reservas` - Crear reserva (Check-in)
- `POST /api/reservas/[id]/checkout` - Realizar check-out

### Dashboard

- `GET /api/dashboard` - Obtener estadísticas

## 🎨 Tecnologías Utilizadas

- **Frontend**: Next.js 16, React 19, TypeScript
- **Estilos**: Tailwind CSS 4
- **Base de Datos**: SQL Server
- **ORM**: mssql (driver nativo)
- **Package Manager**: Bun

## 🔒 Seguridad

- Las contraseñas de BD deben estar en `.env.local` (no subir a Git)
- El archivo `.env.local` está en `.gitignore`
- Usa conexiones encriptadas en producción
- Valida todos los inputs del usuario

## 📝 Datos de Ejemplo

El script `database/init.sql` incluye:

- 6 habitaciones de ejemplo (Simple, Doble, Suite)
- 4 servicios adicionales
- Precios configurables

## 🚀 Despliegue

### Vercel + Azure SQL

1. Sube el código a GitHub
2. Conecta con Vercel
3. Configura las variables de entorno en Vercel
4. Despliega

### Otras opciones

- Railway + SQL Server
- DigitalOcean + SQL Server
- AWS + RDS SQL Server

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Haz fork del proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 💡 Próximas Mejoras

- [ ] Sistema de autenticación
- [ ] Reportes en PDF
- [ ] Gráficos de ocupación
- [ ] Notificaciones por email/SMS
- [ ] App móvil
- [ ] Sistema de limpieza
- [ ] Control de inventario

## 📞 Soporte

Si tienes problemas o preguntas, abre un issue en GitHub.

---

Desarrollado con ❤️ usando Next.js y SQL Server
