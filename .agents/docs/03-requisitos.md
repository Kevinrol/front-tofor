# 03 — Requisitos

## 1. Requisitos funcionales

### Autenticación y usuarios
- **RF-01** El sistema debe permitir iniciar y cerrar sesión con usuario y contraseña.
- **RF-02** El administrador debe poder crear, editar y desactivar usuarios y asignarles un rol.
- **RF-03** El sistema debe restringir las funciones según el rol (administrador / vendedor).

### Productos e inventario
- **RF-04** Registrar, editar, consultar y desactivar productos con código, categoría, precios y stock mínimo.
- **RF-05** Mantener el stock actual de cada producto.
- **RF-06** Registrar cada entrada y salida en un kardex consultable por producto y por fechas.
- **RF-07** Registrar bajas por deterioro o pérdida con motivo (adhesivos, témperas, pinturas, etc.).
- **RF-08** Alertar los productos cuyo stock esté en o por debajo del mínimo.

### Proveedores
- **RF-09** Registrar proveedores con razón social, marcas, tipo de material, teléfono y ciudad.
- **RF-10** Consultar y buscar proveedores, y ver el historial de compras de cada uno.

### Compras
- **RF-11** Registrar notas de pedido a proveedores con productos y cantidades.
- **RF-12** Registrar la recepción de mercadería y comparar lo pedido con lo recibido.
- **RF-13** Al recibir una compra, aumentar el stock y registrar el movimiento en el kardex.
- **RF-14** Anular una compra revirtiendo sus movimientos.

### Clientes
- **RF-15** Registrar clientes mayoristas (librerías de barrio) con sus datos de contacto.
- **RF-16** Asociar a cada cliente su tipo (minorista o mayorista) para aplicar la tarifa correspondiente.
- **RF-17** Buscar clientes por nombre o negocio durante la venta.

### Ventas
- **RF-18** Registrar ventas minoristas con búsqueda de productos y cálculo automático del total.
- **RF-19** Registrar ventas mayoristas aplicando automáticamente el precio mayorista del cliente.
- **RF-20** Registrar el pago en efectivo, QR o combinado.
- **RF-21** Descontar el stock automáticamente y bloquear ventas sin stock suficiente.
- **RF-22** Generar un comprobante de venta imprimible o descargable.
- **RF-23** Consultar el historial de ventas y anular ventas (solo administrador).

### Caja y arqueo
- **RF-24** Abrir la caja al inicio del turno con un monto inicial.
- **RF-25** Cerrar la caja y comparar lo esperado (según ventas registradas) con lo contado.
- **RF-26** Registrar y consultar las diferencias de cada arqueo.

### Reportes
- **RF-27** Reporte de productos más y menos vendidos (rotación).
- **RF-28** Reporte de rentabilidad (margen) por producto y por período.
- **RF-29** Consolidado mensual de compras y de ventas.
- **RF-30** Reporte de stock actual y productos bajo el mínimo.
- **RF-31** Reporte de ventas por vendedor y por turno.

## 2. Requisitos no funcionales

| Código | Categoría | Requisito |
|---|---|---|
| RNF-01 | Usabilidad | Interfaz simple que un vendedor pueda usar con poca capacitación |
| RNF-02 | Rendimiento | Registrar una venta típica debe tomar pocos segundos |
| RNF-03 | Seguridad | Contraseñas almacenadas con hash; acceso protegido con token |
| RNF-04 | Seguridad | Control de acceso por rol en cada operación |
| RNF-05 | Integridad | Operaciones críticas atómicas (transacciones) |
| RNF-06 | Disponibilidad | Accesible durante las 14 horas de atención diaria |
| RNF-07 | Compatibilidad | Funciona en navegadores modernos de escritorio |
| RNF-08 | Respaldo | Copias de seguridad periódicas de la base de datos |
| RNF-09 | Mantenibilidad | Código organizado por módulos y documentado |
| RNF-10 | Trazabilidad | Cada operación registra usuario y fecha |

## 3. Restricciones

- Debe poder operar con el hardware y la conexión disponibles en la librería (por confirmar).
- El sistema reemplaza los cuadernos y papeles; no incluye facturación electrónica.
