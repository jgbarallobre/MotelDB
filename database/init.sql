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
        fecha_creacion DATETIME2 DEFAULT GETDATE(),
        fecha_actualizacion DATETIME2 DEFAULT GETDATE()
    );
    PRINT '✅ Tabla Habitaciones creada';
END
GO

-- ============================================================================
-- TABLA: Clientes
-- Descripción: Almacena información de los clientes del motel
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
        fecha_registro DATETIME2 DEFAULT GETDATE()
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

-- Verificar si ya existen datos
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
PRINT '';
PRINT '============================================================================';
PRINT '✅ BASE DE DATOS INICIALIZADA CORRECTAMENTE';
PRINT '============================================================================';
PRINT 'Base de datos: MotelDB';
PRINT 'Tablas creadas: 6';
PRINT 'Índices creados: 7';
PRINT 'Triggers creados: 3';
PRINT 'Vistas creadas: 2';
PRINT 'Procedimientos almacenados: 1';
PRINT 'Datos de ejemplo: Habitaciones y Servicios';
PRINT '============================================================================';
GO
