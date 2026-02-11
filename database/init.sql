-- Script de inicialización de base de datos para Sistema de Gestión de Motel
-- Ejecutar este script en SQL Server Management Studio o Azure Data Studio

USE master;
GO

-- Crear base de datos si no existe
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'MotelDB')
BEGIN
    CREATE DATABASE MotelDB;
END
GO

USE MotelDB;
GO

-- Tabla de Habitaciones
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Habitaciones')
BEGIN
    CREATE TABLE Habitaciones (
        id INT PRIMARY KEY IDENTITY(1,1),
        numero VARCHAR(10) NOT NULL UNIQUE,
        tipo VARCHAR(50) NOT NULL, -- Simple, Doble, Suite, etc.
        precio_hora DECIMAL(10,2) NOT NULL,
        precio_noche DECIMAL(10,2) NOT NULL,
        estado VARCHAR(20) NOT NULL DEFAULT 'Disponible', -- Disponible, Ocupada, Mantenimiento, Limpieza
        descripcion TEXT,
        capacidad INT NOT NULL,
        fecha_creacion DATETIME DEFAULT GETDATE(),
        fecha_actualizacion DATETIME DEFAULT GETDATE()
    );
END
GO

-- Tabla de Clientes
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Clientes')
BEGIN
    CREATE TABLE Clientes (
        id INT PRIMARY KEY IDENTITY(1,1),
        nombre VARCHAR(100) NOT NULL,
        apellido VARCHAR(100) NOT NULL,
        documento VARCHAR(20) NOT NULL UNIQUE,
        tipo_documento VARCHAR(20) NOT NULL, -- DNI, Pasaporte, etc.
        telefono VARCHAR(20),
        email VARCHAR(100),
        direccion TEXT,
        fecha_registro DATETIME DEFAULT GETDATE()
    );
END
GO

-- Tabla de Reservas/Check-ins
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Reservas')
BEGIN
    CREATE TABLE Reservas (
        id INT PRIMARY KEY IDENTITY(1,1),
        habitacion_id INT NOT NULL,
        cliente_id INT NOT NULL,
        fecha_entrada DATETIME NOT NULL,
        fecha_salida DATETIME,
        tipo_estadia VARCHAR(20) NOT NULL, -- Por Hora, Por Noche
        horas_contratadas INT,
        precio_total DECIMAL(10,2),
        estado VARCHAR(20) NOT NULL DEFAULT 'Activa', -- Activa, Finalizada, Cancelada
        observaciones TEXT,
        fecha_creacion DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (habitacion_id) REFERENCES Habitaciones(id),
        FOREIGN KEY (cliente_id) REFERENCES Clientes(id)
    );
END
GO

-- Tabla de Pagos
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Pagos')
BEGIN
    CREATE TABLE Pagos (
        id INT PRIMARY KEY IDENTITY(1,1),
        reserva_id INT NOT NULL,
        monto DECIMAL(10,2) NOT NULL,
        metodo_pago VARCHAR(50) NOT NULL, -- Efectivo, Tarjeta, Transferencia
        fecha_pago DATETIME DEFAULT GETDATE(),
        comprobante VARCHAR(100),
        observaciones TEXT,
        FOREIGN KEY (reserva_id) REFERENCES Reservas(id)
    );
END
GO

-- Tabla de Servicios Adicionales
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ServiciosAdicionales')
BEGIN
    CREATE TABLE ServiciosAdicionales (
        id INT PRIMARY KEY IDENTITY(1,1),
        nombre VARCHAR(100) NOT NULL,
        descripcion TEXT,
        precio DECIMAL(10,2) NOT NULL,
        activo BIT DEFAULT 1
    );
END
GO

-- Tabla de Servicios por Reserva
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ReservaServicios')
BEGIN
    CREATE TABLE ReservaServicios (
        id INT PRIMARY KEY IDENTITY(1,1),
        reserva_id INT NOT NULL,
        servicio_id INT NOT NULL,
        cantidad INT DEFAULT 1,
        precio_unitario DECIMAL(10,2) NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        fecha_agregado DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (reserva_id) REFERENCES Reservas(id),
        FOREIGN KEY (servicio_id) REFERENCES ServiciosAdicionales(id)
    );
END
GO

-- Insertar datos de ejemplo
-- Habitaciones
INSERT INTO Habitaciones (numero, tipo, precio_hora, precio_noche, capacidad, descripcion)
VALUES 
    ('101', 'Simple', 15.00, 80.00, 2, 'Habitación simple con cama matrimonial'),
    ('102', 'Simple', 15.00, 80.00, 2, 'Habitación simple con cama matrimonial'),
    ('201', 'Doble', 20.00, 120.00, 4, 'Habitación doble con dos camas matrimoniales'),
    ('202', 'Doble', 20.00, 120.00, 4, 'Habitación doble con dos camas matrimoniales'),
    ('301', 'Suite', 35.00, 200.00, 4, 'Suite de lujo con jacuzzi'),
    ('302', 'Suite', 35.00, 200.00, 4, 'Suite de lujo con jacuzzi');
GO

-- Servicios Adicionales
INSERT INTO ServiciosAdicionales (nombre, descripcion, precio)
VALUES 
    ('Bebidas', 'Bebidas y snacks', 5.00),
    ('Toallas Extra', 'Juego de toallas adicionales', 3.00),
    ('Room Service', 'Servicio a la habitación', 10.00),
    ('Extensión de Hora', 'Hora adicional de estadía', 15.00);
GO

-- Crear índices para mejorar rendimiento
CREATE INDEX idx_habitaciones_estado ON Habitaciones(estado);
CREATE INDEX idx_reservas_estado ON Reservas(estado);
CREATE INDEX idx_reservas_fechas ON Reservas(fecha_entrada, fecha_salida);
CREATE INDEX idx_clientes_documento ON Clientes(documento);
GO

PRINT '✅ Base de datos inicializada correctamente';
GO
