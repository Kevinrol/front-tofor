# 00 — Visión general

## 1. Contexto institucional

La Librería Tiahunacota / TOFOR es una empresa unipersonal con más de 30 años de trayectoria, ubicada en la zona Villa Dolores del municipio de El Alto (La Paz, Bolivia), en las inmediaciones de unidades educativas de primaria y secundaria. La administración es familiar y el equipo operativo está formado por 7 vendedores en turnos de tiempo completo y medio tiempo, que cubren 14 horas continuas de atención diaria.

## 2. Modelo operativo

La librería atiende a dos tipos de cliente:

- **Minorista (al detalle):** estudiantes, padres de familia y docentes de la zona.
- **Mayorista (al por mayor):** pequeñas librerías de barrio que compran en volumen (docenas o cajas) para reventa, con precios preferenciales.

## 3. Situación actual (problemática)

### Abastecimiento e inventario
- Los faltantes se detectan mirando estantes o por pedidos no satisfechos en mostrador.
- Los datos de proveedores están en agendas personales y fólderes sueltos.
- Las notas de pedido son físicas y no se cruzan con lo realmente recibido.
- Las compras se anotan en cuadernos (solo gasto), sin inventario ni kardex permanente.
- Adhesivos, témperas y pinturas se secan o deterioran sin registro de bajas.

### Ventas
- Minorista: revisión manual de listas de útiles, total con calculadora, cobro en efectivo o QR (Yape / Altoke), sin comprobante ni registro de ítems.
- Mayorista: anotaciones en papel suelto y notas de venta manuscritas eventuales.
- Los mayoristas se reconocen "de memoria" por el vendedor de turno, lo que causa precios inconsistentes y reclamos cuando rota el personal.

### Cierre y reportes
- No es posible un arqueo real: no hay forma de cuadrar el dinero cobrado con los productos que salieron.
- No existen indicadores de rotación, margen de rentabilidad ni consolidado mensual de compras.

## 4. Problema central

La ausencia de registro sistemático de inventario, compras y ventas impide controlar el stock, cuadrar la caja, aplicar precios de forma consistente y tomar decisiones con datos.

## 5. Objetivo general

Desarrollar un sistema web que permita controlar el stock y gestionar las ventas de la Librería TOFOR.

## 6. Objetivos específicos

1. Registrar el catálogo de productos con su stock actual y movimientos (kardex).
2. Centralizar el registro de proveedores y las compras con su recepción de mercadería.
3. Registrar clientes mayoristas con su tarifa asignada, eliminando la dependencia de la memoria del vendedor.
4. Registrar ventas minoristas y mayoristas con comprobante, descontando stock automáticamente.
5. Permitir el arqueo de caja por turno, cuadrando efectivo y QR con las ventas registradas.
6. Registrar bajas por deterioro o pérdida de productos.
7. Generar reportes de rotación, rentabilidad y compras mensuales.

## 7. Alcance

**Incluye:** los 8 módulos documentados en `docs/modulos/`.

**No incluye (por definir con el tutor):** facturación electrónica del SIN, integración automática con pasarelas de pago QR, tienda en línea para clientes, aplicación móvil.

## 8. Usuarios del sistema

| Rol | Descripción |
|---|---|
| Administrador | Administración familiar; acceso total, reportes y configuración |
| Vendedor | Registra ventas, consulta stock y clientes, cierra su caja de turno |
