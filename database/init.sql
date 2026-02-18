-- ============================================================================
-- Script de Inicialización de Base de Datos - Sistema de Gestión de Motel
-- ============================================================================
-- Base de Datos: SQL Server 2016+
-- Descripción: Crea la estructura completa de la base de datos para gestión
--              de habitaciones, reservas, clientes y pagos de un motel
-- Instrucciones: Ejecutar en SQL Server Management Studio o Azure Data Studio
-- ============================================================================

USE master;
GO

-- ============================================================================
-- CREAR BASE DE DATOS
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'MotelDB')
BEGIN
    CREATE DATABASE MotelDB
    COLLATE SQL_Latin1_General_CP1_CI_AS;
    PRINT '✅ Base de datos MotelDB creada';
END
ELSE
BEGIN
    PRINT '⚠️  Base de datos MotelDB ya existe';
END
GO

USE MotelDB;
GO

-- ============================================================================
-- TABLA: Jornadas
-- Descripción: Catálogo de jornadas/turnos de trabajo del motel
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Jornadas')
BEGIN
    CREATE TABLE Jornadas (
        id INT PRIMARY KEY IDENTITY(1,1),
        nombre VARCHAR(50) NOT NULL UNIQUE,
        descripcion NVARCHAR(MAX),
        hora_inicio TIME NOT NULL,
        hora_fin TIME NOT NULL,
        duracion_horas DECIMAL(5,2) NOT NULL,
        activo BIT DEFAULT 1,
        es_noche BIT DEFAULT 0,
        color VARCHAR(7) DEFAULT '#3B82F6',
        fecha_creacion DATETIME2 DEFAULT GETDATE()
    );
    PRINT '✅ Tabla Jornadas creada';
END
GO

-- ============================================================================
-- TABLA: ConfiguracionMotel
-- Descripción: Configuración general del motel (un solo registro)
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ConfiguracionMotel')
BEGIN
    CREATE TABLE ConfiguracionMotel (
        id INT PRIMARY KEY DEFAULT 1,
        nombre_motel NVARCHAR(100) NOT NULL DEFAULT 'Motel Premium',
        direccion NVARCHAR(MAX) DEFAULT '',
        telefono VARCHAR(20) DEFAULT '',
        email VARCHAR(100) DEFAULT '',
        nit VARCHAR(20) DEFAULT '',
        hora_checkin TIME DEFAULT '14:00:00',
        hora_checkout TIME DEFAULT '12:00:00',
        moneda VARCHAR(10) DEFAULT 'PEN',
        simbolo_moneda VARCHAR(5) DEFAULT 'S/',
        tasa_impuesto DECIMAL(5,2) DEFAULT 18.00, -- Porcentaje de impuesto (IGV)
        mensaje_recibo NVARCHAR(MAX) DEFAULT 'Gracias por su visita',
        logo_url NVARCHAR(500) DEFAULT '',
        color_principal VARCHAR(7) DEFAULT '#1E3A8A',
        color_secundario VARCHAR(7) DEFAULT '#3B82F6',
        fecha_actualizacion DATETIME2 DEFAULT GETDATE()
    );
    
    -- Insertar registro por defecto
    INSERT INTO ConfiguracionMotel (id, nombre_motel) VALUES (1, 'Motel Premium');
    
    PRINT '✅ Tabla ConfiguracionMotel creada';
END
GO

-- ============================================================================
-- TABLA: Impresoras
-- Descripción: Configuración de impresoras fiscales/térmicas del motel
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Impresoras')
BEGIN
    CREATE TABLE Impresoras (
        id INT PRIMARY KEY IDENTITY(1,1),
        nombre VARCHAR(100) NOT NULL,
        tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('Fiscal', 'No Fiscal', 'Ticketera')),
        modelo VARCHAR(100),
        puerto VARCHAR(100), -- COM1, COM2, USB, RED
        ip_address VARCHAR(50),
        caracteres_por_linea INT DEFAULT 40,
        activa BIT DEFAULT 1,
        es_predeterminada BIT DEFAULT 0,
       -- Configuración de impresión
        imprimir_logo BIT DEFAULT 1,
        imprimir_qr BIT DEFAULT 0,
        copiar_recibo INT DEFAULT 1,
       -- Mensajes personalizados
        encabezado NVARCHAR(MAX),
        pie_pagina NVARCHAR(MAX),
        observaciones NVARCHAR(MAX),
        fecha_creacion DATETIME2 DEFAULT GETDATE(),
        fecha_actualizacion DATETIME2 DEFAULT GETDATE()
    );
    
    -- Insertar impresora de ejemplo
    INSERT INTO Impresoras (nombre, tipo, modelo, puerto, caracteres_por_linea, activa, es_predeterminada)
    VALUES ('Ticketera Principal', 'Ticketera', 'Epson TM-T88', 'USB', 40, 1, 1);
    
    PRINT '✅ Tabla Impresoras creada';
END
GO

-- ============================================================================
-- TABLA: Usuarios
-- Descripción: Almacena los usuarios del sistema con sus credenciales
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Usuarios')
BEGIN
    CREATE TABLE Usuarios (
        id INT PRIMARY KEY IDENTITY(1,1),
        username VARCHAR(50) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(100),
        rol VARCHAR(20) NOT NULL CHECK (rol IN ('Admin', 'Recepcionista', 'Gerente')),
        activo BIT DEFAULT 1,
        fecha_creacion DATETIME2 DEFAULT GETDATE(),
        ultimo_acceso DATETIME2
    );
    PRINT '✅ Tabla Usuarios creadas';
END
GO

-- ============================================================================
-- TABLA: Departamentos
-- Descripción: Catálogo de departamentos del motel
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Departamentos')
BEGIN
    CREATE TABLE Departamentos (
        id INT PRIMARY KEY IDENTITY(1,1),
        codigo VARCHAR(4) NOT NULL UNIQUE,
        descripcion VARCHAR(30) NOT NULL,
        activo BIT DEFAULT 1,
        fecha_creacion DATETIME2 DEFAULT GETDATE(),
        fecha_actualizacion DATETIME2 DEFAULT GETDATE()
    );
    
    -- Insertar departamentos de ejemplo
    INSERT INTO Departamentos (codigo, descripcion) VALUES
        ('D001', 'Administracion'),
        ('D002', 'Recepcion'),
        ('D003', 'Mantenimiento'),
        ('D004', 'Limpieza'),
        ('D005', 'Caja');
    
    PRINT '✅ Tabla Departamentos creada';
END
GO

-- ============================================================================
-- TABLA: Articulos
-- Descripción: Catálogo de artículos/productos del motel (tienda/negocio)
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Articulos')
BEGIN
    CREATE TABLE Articulos (
        codigo VARCHAR(15) NOT NULL PRIMARY KEY,
        descripcion VARCHAR(60) NOT NULL,
        departamento VARCHAR(4) NOT NULL,
        tipo_iva VARCHAR(2) NOT NULL DEFAULT '01',
        precio1 DECIMAL(10,2) NOT NULL DEFAULT 0,
        precio2 DECIMAL(10,2) NOT NULL DEFAULT 0,
        precio3 DECIMAL(10,2) NOT NULL DEFAULT 0,
        existencia DECIMAL(10,2) NOT NULL DEFAULT 0,
        inactivo BIT DEFAULT 0,
        fecha_creacion DATE DEFAULT CAST(GETDATE() AS DATE),
        stock_min DECIMAL(10,2) DEFAULT 0,
        stock_max DECIMAL(10,2) DEFAULT 0,
        CONSTRAINT FK_Articulos_Departamentos FOREIGN KEY (departamento) REFERENCES Departamentos(codigo),
        CONSTRAINT FK_Articulos_TiposIva FOREIGN KEY (tipo_iva) REFERENCES TiposIva(codigo)
    );
    
    PRINT '✅ Tabla Articulos creada';
END
GO

-- ============================================================================
-- TABLA: TiposIva
-- Descripción: Catálogo de tipos de IVA/Impuestos del motel
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TiposIva')
BEGIN
    CREATE TABLE TiposIva (
        id INT PRIMARY KEY IDENTITY(1,1),
        codigo VARCHAR(2) NOT NULL UNIQUE,
        descripcion VARCHAR(15) NOT NULL,
        valor DECIMAL(10,2) NOT NULL CHECK (valor >= 0),
        activo BIT DEFAULT 1,
        fecha_creacion DATETIME2 DEFAULT GETDATE(),
        fecha_actualizacion DATETIME2 DEFAULT GETDATE()
    );
    
    -- Insertar tipos de IVA de ejemplo
    INSERT INTO TiposIva (codigo, descripcion, valor) VALUES
        ('01', 'IVA 16%', 16.00),
        ('02', 'IVA 08%', 8.00),
        ('03', 'EXCENTO', 0.00);
    
    PRINT '✅ Tabla TiposIva creada';
END
GO

-- ============================================================================
-- TABLA: LogAccesos
-- Descripción: Registra los accesos al sistema para auditoría
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'LogAccesos')
BEGIN
    CREATE TABLE LogAccesos (
        id INT PRIMARY KEY IDENTITY(1,1),
        usuario_id INT NOT NULL,
        accion VARCHAR(50) NOT NULL,
        ip_address VARCHAR(50),
        fecha DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_LogAccesos_Usuarios FOREIGN KEY (usuario_id) REFERENCES Usuarios(id)
    );
    PRINT '✅ Tabla LogAccesos creada';
END
GO

-- ============================================================================
-- TABLA: Habitaciones
-- Descripción: Almacena información de las habitaciones del motel
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Habitaciones')
BEGIN
    CREATE TABLE Habitaciones (
        id INT PRIMARY KEY IDENTITY(1,1),
        numero VARCHAR(10) NOT NULL UNIQUE,
        tipo VARCHAR(50) NOT NULL, -- Simple, Doble, Suite, etc.
        precio_hora DECIMAL(10,2) NOT NULL CHECK (precio_hora > 0),
        precio_noche DECIMAL(10,2) NOT NULL CHECK (precio_noche > 0),
        estado VARCHAR(20) NOT NULL DEFAULT 'Disponible' CHECK (estado IN ('Disponible', 'Ocupada', 'Mantenimiento', 'Limpieza')),
        descripcion NVARCHAR(MAX),
        capacidad INT NOT NULL CHECK (capacidad > 0),
        activa BIT DEFAULT 1, -- Para habilitar/deshabilitar habitaciones
        fecha_creacion DATETIME2 DEFAULT GETDATE(),
        fecha_actualizacion DATETIME2 DEFAULT GETDATE()
    );
    PRINT '✅ Tabla Habitaciones creada';
END
GO

-- ============================================================================
-- TABLA: TiposEstadia
-- Descripción: Catálogo de tipos de estadía con precios
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TiposEstadia')
BEGIN
    CREATE TABLE TiposEstadia (
        id INT PRIMARY KEY IDENTITY(1,1),
        nombre VARCHAR(50) NOT NULL UNIQUE,
        descripcion NVARCHAR(MAX),
        duracion_horas INT NOT NULL CHECK (duracion_horas > 0),
        precio DECIMAL(10,2) NOT NULL CHECK (precio > 0),
        precio_adicional DECIMAL(10,2) DEFAULT 0, -- Precio por hora adicional
        activo BIT DEFAULT 1,
        es_paquete BIT DEFAULT 0, -- Si es un paquete especial
        orden INT DEFAULT 0, -- Para排序
        fecha_creacion DATETIME2 DEFAULT GETDATE()
    );
    PRINT '✅ Tabla TiposEstadia creada';
END
GO

-- ============================================================================
-- TABLA: Clientes
-- Descripción: Almacena información de los clientes del motel (huéspedes)
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Clientes')
BEGIN
    CREATE TABLE Clientes (
        id INT PRIMARY KEY IDENTITY(1,1),
        nombre VARCHAR(100) NOT NULL,
        apellido VARCHAR(100) NOT NULL,
        documento VARCHAR(20) NOT NULL UNIQUE,
        tipo_documento VARCHAR(20) NOT NULL CHECK (tipo_documento IN ('DNI', 'Pasaporte', 'Cédula', 'RUC')),
        telefono VARCHAR(20),
        email VARCHAR(100),
        direccion NVARCHAR(MAX),
        -- Datos de facturación (nuevos)
        rif VARCHAR(20), -- RIF del cliente para facturación
        razon_social VARCHAR(200), -- Razón social para facturas
        direccion_fiscal NVARCHAR(MAX), -- Dirección para factura
        telefono_facturacion VARCHAR(20),
        -- Historial
        fecha_registro DATETIME2 DEFAULT GETDATE(),
        ultima_visita DATETIME2,
        total_visitas INT DEFAULT 0
    );
    PRINT '✅ Tabla Clientes creada';
END
GO

-- ============================================================================
-- TABLA: Reservas
-- Descripción: Almacena las reservas y check-ins de los clientes
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Reservas')
BEGIN
    CREATE TABLE Reservas (
        id INT PRIMARY KEY IDENTITY(1,1),
        habitacion_id INT NOT NULL,
        cliente_id INT NOT NULL,
        fecha_entrada DATETIME2 NOT NULL,
        fecha_salida DATETIME2,
        tipo_estadia VARCHAR(20) NOT NULL CHECK (tipo_estadia IN ('Por Hora', 'Por Noche')),
        horas_contratadas INT CHECK (horas_contratadas > 0),
        precio_total DECIMAL(10,2) CHECK (precio_total >= 0),
        estado VARCHAR(20) NOT NULL DEFAULT 'Activa' CHECK (estado IN ('Activa', 'Finalizada', 'Cancelada')),
        observaciones NVARCHAR(MAX),
        fecha_creacion DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_Reservas_Habitaciones FOREIGN KEY (habitacion_id) REFERENCES Habitaciones(id),
        CONSTRAINT FK_Reservas_Clientes FOREIGN KEY (cliente_id) REFERENCES Clientes(id)
    );
    PRINT '✅ Tabla Reservas creada';
END
GO

-- ============================================================================
-- TABLA: Pagos
-- Descripción: Registra los pagos realizados por las reservas
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Pagos')
BEGIN
    CREATE TABLE Pagos (
        id INT PRIMARY KEY IDENTITY(1,1),
        reserva_id INT NOT NULL,
        monto DECIMAL(10,2) NOT NULL CHECK (monto > 0),
        metodo_pago VARCHAR(50) NOT NULL CHECK (metodo_pago IN ('Efectivo', 'Tarjeta', 'Transferencia', 'Yape', 'Plin')),
        fecha_pago DATETIME2 DEFAULT GETDATE(),
        comprobante VARCHAR(100),
        observaciones NVARCHAR(MAX),
        CONSTRAINT FK_Pagos_Reservas FOREIGN KEY (reserva_id) REFERENCES Reservas(id)
    );
    PRINT '✅ Tabla Pagos creada';
END
GO

-- ============================================================================
-- TABLA: ServiciosAdicionales
-- Descripción: Catálogo de servicios adicionales disponibles
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ServiciosAdicionales')
BEGIN
    CREATE TABLE ServiciosAdicionales (
        id INT PRIMARY KEY IDENTITY(1,1),
        nombre VARCHAR(100) NOT NULL,
        descripcion NVARCHAR(MAX),
        precio DECIMAL(10,2) NOT NULL CHECK (precio >= 0),
        activo BIT DEFAULT 1
    );
    PRINT '✅ Tabla ServiciosAdicionales creada';
END
GO

-- ============================================================================
-- TABLA: ReservaServicios
-- Descripción: Relación entre reservas y servicios adicionales contratados
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ReservaServicios')
BEGIN
    CREATE TABLE ReservaServicios (
        id INT PRIMARY KEY IDENTITY(1,1),
        reserva_id INT NOT NULL,
        servicio_id INT NOT NULL,
        cantidad INT DEFAULT 1 CHECK (cantidad > 0),
        precio_unitario DECIMAL(10,2) NOT NULL CHECK (precio_unitario >= 0),
        subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
        fecha_agregado DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_ReservaServicios_Reservas FOREIGN KEY (reserva_id) REFERENCES Reservas(id),
        CONSTRAINT FK_ReservaServicios_Servicios FOREIGN KEY (servicio_id) REFERENCES ServiciosAdicionales(id)
    );
    PRINT '✅ Tabla ReservaServicios creada';
END
GO

-- ============================================================================
-- ÍNDICES PARA OPTIMIZACIÓN DE CONSULTAS
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_habitaciones_estado')
    CREATE INDEX idx_habitaciones_estado ON Habitaciones(estado);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_habitaciones_tipo')
    CREATE INDEX idx_habitaciones_tipo ON Habitaciones(tipo);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_reservas_estado')
    CREATE INDEX idx_reservas_estado ON Reservas(estado);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_reservas_fechas')
    CREATE INDEX idx_reservas_fechas ON Reservas(fecha_entrada, fecha_salida);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_reservas_habitacion')
    CREATE INDEX idx_reservas_habitacion ON Reservas(habitacion_id);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_clientes_documento')
    CREATE INDEX idx_clientes_documento ON Clientes(documento);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_pagos_reserva')
    CREATE INDEX idx_pagos_reserva ON Pagos(reserva_id);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_usuarios_username')
    CREATE INDEX idx_usuarios_username ON Usuarios(username);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_logaccesos_usuario')
    CREATE INDEX idx_logaccesos_usuario ON LogAccesos(usuario_id);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_tipos_estadia_activo')
    CREATE INDEX idx_tipos_estadia_activo ON TiposEstadia(activo);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_jornadas_activo')
    CREATE INDEX idx_jornadas_activo ON Jornadas(activo);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_clientes_documento')
    CREATE INDEX idx_clientes_documento ON Clientes(documento);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_clientes_rif')
    CREATE INDEX idx_clientes_rif ON Clientes(rif);

PRINT '✅ Índices creados';
GO

-- ============================================================================
-- TRIGGER: Actualizar fecha_actualizacion en Habitaciones
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_Habitaciones_Update')
BEGIN
    EXEC('
    CREATE TRIGGER trg_Habitaciones_Update
    ON Habitaciones
    AFTER UPDATE
    AS
    BEGIN
        SET NOCOUNT ON;
        UPDATE Habitaciones
        SET fecha_actualizacion = GETDATE()
        FROM Habitaciones h
        INNER JOIN inserted i ON h.id = i.id;
    END
    ');
    PRINT '✅ Trigger trg_Habitaciones_Update creado';
END
GO

-- ============================================================================
-- TRIGGER: Actualizar estado de habitación al crear reserva
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_Reservas_Insert')
BEGIN
    EXEC('
    CREATE TRIGGER trg_Reservas_Insert
    ON Reservas
    AFTER INSERT
    AS
    BEGIN
        SET NOCOUNT ON;
        UPDATE Habitaciones
        SET estado = ''Ocupada''
        FROM Habitaciones h
        INNER JOIN inserted i ON h.id = i.habitacion_id
        WHERE i.estado = ''Activa'';
    END
    ');
    PRINT '✅ Trigger trg_Reservas_Insert creado';
END
GO

-- ============================================================================
-- TRIGGER: Actualizar estado de habitación al finalizar reserva
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_Reservas_Update')
BEGIN
    EXEC('
    CREATE TRIGGER trg_Reservas_Update
    ON Reservas
    AFTER UPDATE
    AS
    BEGIN
        SET NOCOUNT ON;
        
        -- Liberar habitación cuando la reserva se finaliza
        UPDATE Habitaciones
        SET estado = ''Limpieza''
        FROM Habitaciones h
        INNER JOIN inserted i ON h.id = i.habitacion_id
        WHERE i.estado = ''Finalizada''
        AND NOT EXISTS (
            SELECT 1 FROM deleted d
            WHERE d.id = i.id AND d.estado = ''Finalizada''
        );
    END
    ');
    PRINT '✅ Trigger trg_Reservas_Update creado';
END
GO

-- ============================================================================
-- DATOS DE EJEMPLO
-- ============================================================================

-- Usuarios de ejemplo
IF NOT EXISTS (SELECT * FROM Usuarios)
BEGIN
    INSERT INTO Usuarios (username, password_hash, nombre, email, rol, activo)
    VALUES
        ('admin', 'admin123', 'Administrador', 'admin@motel.com', 'Admin', 1),
        ('recepcion', 'recep123', 'Recepcionista', 'recepcion@motel.com', 'Recepcionista', 1),
        ('gerente', 'gerente123', 'Gerente', 'gerente@motel.com', 'Gerente', 1);
    
    PRINT '✅ Usuarios de ejemplo insertados';
END
GO

-- Verificar si ya existen datos
IF NOT EXISTS (SELECT * FROM TiposEstadia)
BEGIN
    -- Tipos de Estadía
    INSERT INTO TiposEstadia (nombre, descripcion, duracion_horas, precio, precio_adicional, activo, orden)
    VALUES
        ('Hora', 'Estadía por una hora', 1, 15.00, 10.00, 1, 1),
        ('2 Horas', 'Estadía por dos horas', 2, 25.00, 10.00, 1, 2),
        ('3 Horas', 'Estadía por tres horas', 3, 35.00, 10.00, 1, 3),
        ('Pernocta', 'Estadía hasta las 12:00 PM', 12, 70.00, 10.00, 1, 4),
        ('Día Completo', 'Estadía de 24 horas', 24, 120.00, 10.00, 1, 5),
        ('Paquete Noche', 'Paquete especial de fin de semana', 10, 90.00, 15.00, 1, 6);
    
    PRINT '✅ Tipos de estadía de ejemplo insertados';
END
GO

IF NOT EXISTS (SELECT * FROM Habitaciones)
BEGIN
    -- Habitaciones
    INSERT INTO Habitaciones (numero, tipo, precio_hora, precio_noche, capacidad, descripcion)
    VALUES
        ('101', 'Simple', 15.00, 80.00, 2, 'Habitación simple con cama matrimonial, TV cable y baño privado'),
        ('102', 'Simple', 15.00, 80.00, 2, 'Habitación simple con cama matrimonial, TV cable y baño privado'),
        ('103', 'Simple', 15.00, 80.00, 2, 'Habitación simple con cama matrimonial, TV cable y baño privado'),
        ('201', 'Doble', 20.00, 120.00, 4, 'Habitación doble con dos camas matrimoniales, TV cable y baño privado'),
        ('202', 'Doble', 20.00, 120.00, 4, 'Habitación doble con dos camas matrimoniales, TV cable y baño privado'),
        ('203', 'Doble', 20.00, 120.00, 4, 'Habitación doble con dos camas matrimoniales, TV cable y baño privado'),
        ('301', 'Suite', 35.00, 200.00, 4, 'Suite de lujo con jacuzzi, TV Smart, minibar y baño con hidromasaje'),
        ('302', 'Suite', 35.00, 200.00, 4, 'Suite de lujo con jacuzzi, TV Smart, minibar y baño con hidromasaje');
    
    PRINT '✅ Habitaciones de ejemplo insertadas';
END
GO

IF NOT EXISTS (SELECT * FROM ServiciosAdicionales)
BEGIN
    -- Servicios Adicionales
    INSERT INTO ServiciosAdicionales (nombre, descripcion, precio, activo)
    VALUES
        ('Bebidas', 'Bebidas frías y snacks', 5.00, 1),
        ('Toallas Extra', 'Juego de toallas adicionales', 3.00, 1),
        ('Room Service', 'Servicio de comida a la habitación', 10.00, 1),
        ('Extensión de Hora', 'Hora adicional de estadía', 15.00, 1),
        ('Minibar', 'Acceso al minibar de la habitación', 20.00, 1),
        ('Desayuno', 'Desayuno continental', 12.00, 1);
    
    PRINT '✅ Servicios adicionales de ejemplo insertados';
END
GO

-- Datos de ejemplo para Jornadas
IF NOT EXISTS (SELECT * FROM Jornadas)
BEGIN
    -- Jornadas de trabajo
    INSERT INTO Jornadas (nombre, descripcion, hora_inicio, hora_fin, duracion_horas, activo, es_noche, color)
    VALUES
        ('Mañana', 'Turno de mañana', '06:00:00', '14:00:00', 8, 1, 0, '#22C55E'),
        ('Tarde', 'Turno de tarde', '14:00:00', '22:00:00', 8, 1, 0, '#F59E0B'),
        ('Noche', 'Turno de noche', '22:00:00', '06:00:00', 8, 1, 1, '#8B5CF6'),
        ('Diurno Completo', 'Jornada diurna completa', '08:00:00', '20:00:00', 12, 1, 0, '#3B82F6'),
        ('Nocturno Completo', 'Jornada nocturna completa', '20:00:00', '08:00:00', 12, 1, 1, '#7C3AED');
    
    PRINT '✅ Jornadas de ejemplo insertadas';
END
GO

-- Tasa de cambio de ejemplo
IF NOT EXISTS (SELECT * FROM TasasCambio)
BEGIN
    INSERT INTO TasasCambio (tasa, observaciones)
    VALUES (36.50, 'Tasa oficial del día');
    
    PRINT '✅ Tasa de cambio de ejemplo insertada';
END
GO

-- ============================================================================
-- TABLA: HistorialLimpieza
-- Descripción: Registra el historial de limpieza y mantenimiento de habitaciones
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'HistorialLimpieza')
BEGIN
    CREATE TABLE HistorialLimpieza (
        id INT PRIMARY KEY IDENTITY(1,1),
        habitacion_id INT NOT NULL,
        tipo_accion VARCHAR(20) NOT NULL CHECK (tipo_accion IN ('Limpieza', 'Mantenimiento')),
        fecha_inicio DATETIME2 NOT NULL DEFAULT GETDATE(),
        fecha_fin DATETIME2,
        usuario_inicio_id INT,
        usuario_fin_id INT,
        observaciones NVARCHAR(MAX),
        duracion_minutos INT, -- Calculated when finished
        CONSTRAINT FK_HistorialLimpieza_Habitaciones FOREIGN KEY (habitacion_id) REFERENCES Habitaciones(id),
        CONSTRAINT FK_HistorialLimpieza_UsuarioInicio FOREIGN KEY (usuario_inicio_id) REFERENCES Usuarios(id),
        CONSTRAINT FK_HistorialLimpieza_UsuarioFin FOREIGN KEY (usuario_fin_id) REFERENCES Usuarios(id)
    );
    PRINT '✅ Tabla HistorialLimpieza creada';
END
GO

-- ============================================================================
-- TABLA: TasasCambio
-- Descripción: Historial de tasas de cambio USD/Bs
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TasasCambio')
BEGIN
    CREATE TABLE TasasCambio (
        id INT PRIMARY KEY IDENTITY(1,1),
        tasa DECIMAL(10,2) NOT NULL CHECK (tasa > 0),
        fecha_registro DATETIME2 DEFAULT GETDATE(),
        usuario_registro_id INT,
        observaciones NVARCHAR(MAX),
        CONSTRAINT FK_TasasCambio_Usuarios FOREIGN KEY (usuario_registro_id) REFERENCES Usuarios(id)
    );
    
    -- Insertar tasa inicial de ejemplo
    INSERT INTO TasasCambio (tasa, observaciones)
    VALUES (36.50, 'Tasa inicial');
    
    PRINT '✅ Tabla TasasCambio creada';
END
GO

-- ============================================================================
-- TABLA: JornadasAbiertas
-- Descripción: Control de jornadas/trabajos activos del sistema
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'JornadasAbiertas')
BEGIN
    CREATE TABLE JornadasAbiertas (
        id INT PRIMARY KEY IDENTITY(1,1),
        jornada_id INT NOT NULL, -- FK a Jornadas (catálogo)
        usuario_id INT NOT NULL, -- Usuario que inicia la jornada
        fecha_trabajo DATE NOT NULL,
        hora_inicio DATETIME2 NOT NULL DEFAULT GETDATE(),
        hora_fin DATETIME2,
        -- Montos de apertura
        monto_apertura_bs DECIMAL(12,2) DEFAULT 0,
        monto_apertura_usd DECIMAL(12,2) DEFAULT 0,
        tasa_cambio DECIMAL(10,2) NOT NULL,
        -- Estado
        estado VARCHAR(20) NOT NULL DEFAULT 'Abierta' CHECK (estado IN ('Abierta', 'Cerrada')),
        -- Observaciones
        observaciones NVARCHAR(MAX),
        CONSTRAINT FK_JornadasAbiertas_Jornadas FOREIGN KEY (jornada_id) REFERENCES Jornadas(id),
        CONSTRAINT FK_JornadasAbiertas_Usuarios FOREIGN KEY (usuario_id) REFERENCES Usuarios(id)
    );
    
    PRINT '✅ Tabla JornadasAbiertas creada';
END
GO

-- ============================================================================
-- VISTAS ÚTILES
-- ============================================================================

-- Vista de habitaciones con información de reserva actual
IF NOT EXISTS (SELECT * FROM sys.views WHERE name = 'vw_HabitacionesConReserva')
BEGIN
    EXEC('
    CREATE VIEW vw_HabitacionesConReserva AS
    SELECT
        h.id,
        h.numero,
        h.tipo,
        h.precio_hora,
        h.precio_noche,
        h.estado,
        h.capacidad,
        r.id as reserva_id,
        r.fecha_entrada,
        r.fecha_salida,
        c.nombre + '' '' + c.apellido as cliente_nombre,
        c.documento as cliente_documento
    FROM Habitaciones h
    LEFT JOIN Reservas r ON h.id = r.habitacion_id AND r.estado = ''Activa''
    LEFT JOIN Clientes c ON r.cliente_id = c.id
    ');
    PRINT '✅ Vista vw_HabitacionesConReserva creada';
END
GO

-- Vista de resumen de ingresos
IF NOT EXISTS (SELECT * FROM sys.views WHERE name = 'vw_ResumenIngresos')
BEGIN
    EXEC('
    CREATE VIEW vw_ResumenIngresos AS
    SELECT
        CAST(p.fecha_pago AS DATE) as fecha,
        COUNT(DISTINCT p.reserva_id) as total_reservas,
        SUM(p.monto) as total_ingresos,
        AVG(p.monto) as promedio_por_reserva
    FROM Pagos p
    GROUP BY CAST(p.fecha_pago AS DATE)
    ');
    PRINT '✅ Vista vw_ResumenIngresos creada';
END
GO

-- ============================================================================
-- PROCEDIMIENTOS ALMACENADOS
-- ============================================================================

-- Procedimiento para obtener dashboard
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_GetDashboard')
    DROP PROCEDURE sp_GetDashboard;
GO

CREATE PROCEDURE sp_GetDashboard
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Estadísticas generales
    SELECT
        (SELECT COUNT(*) FROM Habitaciones WHERE estado = 'Disponible') as habitaciones_disponibles,
        (SELECT COUNT(*) FROM Habitaciones WHERE estado = 'Ocupada') as habitaciones_ocupadas,
        (SELECT COUNT(*) FROM Reservas WHERE estado = 'Activa') as reservas_activas,
        (SELECT ISNULL(SUM(monto), 0) FROM Pagos WHERE CAST(fecha_pago AS DATE) = CAST(GETDATE() AS DATE)) as ingresos_hoy,
        (SELECT ISNULL(SUM(monto), 0) FROM Pagos WHERE MONTH(fecha_pago) = MONTH(GETDATE()) AND YEAR(fecha_pago) = YEAR(GETDATE())) as ingresos_mes;
    
    -- Habitaciones por estado
    SELECT estado, COUNT(*) as cantidad
    FROM Habitaciones
    GROUP BY estado;
    
    -- Últimas reservas
    SELECT TOP 10
        r.id,
        h.numero as habitacion_numero,
        c.nombre + ' ' + c.apellido as cliente_nombre,
        r.fecha_entrada,
        r.fecha_salida,
        r.estado
    FROM Reservas r
    INNER JOIN Habitaciones h ON r.habitacion_id = h.id
    INNER JOIN Clientes c ON r.cliente_id = c.id
    ORDER BY r.fecha_creacion DESC;
END
GO
PRINT '✅ Procedimiento sp_GetDashboard creado';
GO

-- ============================================================================
-- FINALIZACIÓN
-- ============================================================================

-- ============================================================================
-- TABLA: TasasCambio
-- Descripción: Historial de tasas de cambio USD/Bs
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TasasCambio')
BEGIN
    CREATE TABLE TasasCambio (
        id INT PRIMARY KEY IDENTITY(1,1),
        tasa DECIMAL(10,2) NOT NULL,
        fecha_registro DATETIME2 DEFAULT GETDATE(),
        usuario_registro_id INT,
        observaciones NVARCHAR(MAX),
        FOREIGN KEY (usuario_registro_id) REFERENCES usuarios(id)
    );
    PRINT '✅ Tabla TasasCambio creada';
END
GO

-- ============================================================================
-- TABLA: JornadasAbiertas
-- Descripción: Control de jornadas activas con montos de apertura
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'JornadasAbiertas')
BEGIN
    CREATE TABLE JornadasAbiertas (
        id INT PRIMARY KEY IDENTITY(1,1),
        jornada_id INT NOT NULL,
        usuario_id INT NOT NULL,
        fecha_trabajo DATE NOT NULL,
        hora_inicio DATETIME2 NOT NULL DEFAULT GETDATE(),
        hora_fin DATETIME2,
        monto_apertura_bs DECIMAL(12,2) DEFAULT 0,
        monto_apertura_usd DECIMAL(12,2) DEFAULT 0,
        monto_cierre_bs DECIMAL(12,2),
        monto_cierre_usd DECIMAL(12,2),
        tasa_cambio DECIMAL(10,2) NOT NULL,
        estado VARCHAR(20) NOT NULL DEFAULT 'Abierta',
        observaciones NVARCHAR(MAX),
        FOREIGN KEY (jornada_id) REFERENCES jornadas(id),
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );
    PRINT '✅ Tabla JornadasAbiertas creada';
END
GO

-- ============================================================================
-- TABLA: Ventas
-- Descripción: Registro de ventas del punto de venta (POS)
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Ventas')
BEGIN
    CREATE TABLE Ventas (
        id INT PRIMARY KEY IDENTITY(1,1),
        fecha DATE NOT NULL DEFAULT GETDATE(),
        hora TIME NOT NULL DEFAULT CAST(GETDATE() AS TIME),
        monto_total DECIMAL(12,2) NOT NULL,
        monto_bs DECIMAL(12,2) NOT NULL,
        metodo_pago VARCHAR(20) NOT NULL,
        usuario_id INT NOT NULL,
        tasa_cambio DECIMAL(10,2) NOT NULL,
        cliente_id INT,
        observaciones NVARCHAR(MAX),
        FOREIGN KEY (usuario_id) REFERENCES Usuarios(id),
        FOREIGN KEY (cliente_id) REFERENCES Clientes(id)
    );
    PRINT '✅ Tabla Ventas creada';
END
GO

-- ============================================================================
-- TABLA: VentasDetalle
-- Descripción: Detalle de cada venta (artículos vendidos)
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'VentasDetalle')
BEGIN
    CREATE TABLE VentasDetalle (
        id INT PRIMARY KEY IDENTITY(1,1),
        venta_id INT NOT NULL,
        codigo VARCHAR(20) NOT NULL,
        cantidad INT NOT NULL,
        precio_unitario DECIMAL(12,2) NOT NULL,
        iva_porcentaje DECIMAL(5,2) DEFAULT 0,
        subtotal DECIMAL(12,2) NOT NULL,
        tasa_cambio DECIMAL(12,2) NOT NULL DEFAULT 1,
        FOREIGN KEY (venta_id) REFERENCES Ventas(id)
    );
    PRINT '✅ Tabla VentasDetalle actualizada';
END
GO

-- ============================================================================
-- TABLA: FormasPago (Catálogo de métodos de pago del sistema)
-- Descripción: Catálogo unificado de formas de pago para todo el sistema
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'FormasPago')
BEGIN
    CREATE TABLE FormasPago (
        id INT PRIMARY KEY IDENTITY(1,1),
        codigo VARCHAR(20) NOT NULL UNIQUE,
        nombre VARCHAR(50) NOT NULL,
        descripcion NVARCHAR(MAX),
        acepta_vuelto BIT DEFAULT 1,
        es_efectivo BIT DEFAULT 0,
        es_divisa BIT DEFAULT 0,
        requiere_referencia BIT DEFAULT 0,
        activo BIT DEFAULT 1,
        orden INT DEFAULT 0,
        icono VARCHAR(50) DEFAULT '💰',
        color VARCHAR(7) DEFAULT '#3B82F6',
        fecha_creacion DATETIME2 DEFAULT GETDATE()
    );
    
    -- Insertar métodos de pago por defecto
    INSERT INTO FormasPago (codigo, nombre, descripcion, acepta_vuelto, es_efectivo, es_divisa, requiere_referencia, orden, icono, color)
    VALUES 
        ('EFECTIVO_BS', 'Efectivo BS', 'Pago en efectivo en Bolívar Soberano', 1, 1, 0, 0, 1, '💵', '#22C55E'),
        ('TARJETA_DEBITO', 'Tarjeta Débito', 'Pago con tarjeta de débito', 0, 0, 0, 0, 2, '💳', '#3B82F6'),
        ('TARJETA_CREDITO', 'Tarjeta Crédito', 'Pago con tarjeta de crédito', 0, 0, 0, 0, 3, '💳', '#8B5CF6'),
        ('PAGO_MOVIL', 'Pago Móvil', 'Pago móvil con referencia', 0, 0, 0, 1, 4, '📱', '#EC4899'),
        ('TRANSFERENCIA', 'Transferencia', 'Transferencia bancaria con referencia', 0, 0, 0, 1, 5, '🏦', '#6366F1'),
        ('DIVISAS', 'Divisas', 'Pago en efectivo en dólares ($)', 1, 1, 1, 0, 6, '💲', '#F59E0B');
    
    PRINT '✅ Tabla FormasPago creada';
END
GO

-- ============================================================================
-- TABLA: PagosDetalle (Registro detallado de pagos)
-- Descripción: Registra los pagos detallados para cualquier operación
--               (check-in, ventas, reservas, etc.)
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PagosDetalle')
BEGIN
    CREATE TABLE PagosDetalle (
        id INT PRIMARY KEY IDENTITY(1,1),
        tipo_operacion VARCHAR(20) NOT NULL CHECK (tipo_operacion IN ('CHECKIN', 'VENTA', 'RESERVA', 'EGRESO')),
        operacion_id INT NOT NULL,
        forma_pago_id INT NOT NULL,
        forma_pago_codigo VARCHAR(20) NOT NULL,
        monto DECIMAL(12,2) NOT NULL CHECK (monto >= 0),
        monto_bs DECIMAL(12,2) NOT NULL CHECK (monto_bs >= 0),
        tasa_cambio DECIMAL(12,2) NOT NULL DEFAULT 1,
        referencia VARCHAR(100),
        monto_vuelto DECIMAL(12,2) DEFAULT 0,
        observaciones NVARCHAR(MAX),
        jornada_id INT,
        usuario_id INT,
        fecha_pago DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (forma_pago_id) REFERENCES FormasPago(id),
        FOREIGN KEY (jornada_id) REFERENCES Jornadas(id),
        FOREIGN KEY (usuario_id) REFERENCES Usuarios(id)
    );
    PRINT '✅ Tabla PagosDetalle creada';
END
GO

-- ============================================================================
-- ACTUALIZAR TABLA: Pagos (Agregar nuevos métodos de pago)
-- ============================================================================
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Pagos')
BEGIN
    -- Eliminar constraint existente si hay uno
    DECLARE @constraintName NVARCHAR(128);
    SELECT @constraintName = dc.name 
    FROM sys.default_constraints dc 
    JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id 
    WHERE dc.parent_object_id = OBJECT_ID('Pagos') AND c.name = 'metodo_pago';
    
    IF @constraintName IS NOT NULL
    BEGIN
        EXEC('ALTER TABLE Pagos DROP CONSTRAINT ' + @constraintName);
    END
    
    -- Agregar columna monto_bs si no existe
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Pagos') AND name = 'monto_bs')
    BEGIN
        ALTER TABLE Pagos ADD monto_bs DECIMAL(12,2) DEFAULT 0;
    END
    
    -- Agregar columna tasa_cambio si no existe
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Pagos') AND name = 'tasa_cambio')
    BEGIN
        ALTER TABLE Pagos ADD tasa_cambio DECIMAL(12,2) DEFAULT 1;
    END
    
    -- Agregar columna jornada_id si no existe
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Pagos') AND name = 'jornada_id')
    BEGIN
        ALTER TABLE Pagos ADD jornada_id INT;
        ALTER TABLE Pagos ADD CONSTRAINT FK_Pagos_Jornadas FOREIGN KEY (jornada_id) REFERENCES Jornadas(id);
    END
    
    -- Agregar columna usuario_id si no existe
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Pagos') AND name = 'usuario_id')
    BEGIN
        ALTER TABLE Pagos ADD usuario_id INT;
        ALTER TABLE Pagos ADD CONSTRAINT FK_Pagos_Usuarios FOREIGN KEY (usuario_id) REFERENCES Usuarios(id);
    END
    
    -- Agregar columna referencia si no existe
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Pagos') AND name = 'referencia')
    BEGIN
        ALTER TABLE Pagos ADD referencia VARCHAR(100);
    END
    
    PRINT '✅ Tabla Pagos actualizada con nuevos campos';
END
GO

PRINT '';
PRINT '============================================================================';
PRINT '✅ BASE DE DATOS INICIALIZADA CORRECTAMENTE';
PRINT '============================================================================';
PRINT 'Base de datos: MotelDB';
PRINT 'Tablas creadas: 10 (Usuarios, LogAccesos, Habitaciones, Clientes, Reservas, Pagos, ServiciosAdicionales, ReservaServicios, FormasPago, PagosDetalle)';
PRINT 'Índices creados: 9';
PRINT 'Triggers creados: 3';
PRINT 'Vistas creadas: 2';
PRINT 'Procedimientos almacenados: 1';
PRINT 'Datos de ejemplo: Usuarios, Habitaciones y Servicios';
PRINT '============================================================================';
GO
