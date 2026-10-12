# Módulo: Caja y arqueo

## Propósito

Permitir que cada turno abra y cierre su caja, y comparar el dinero cobrado (efectivo y QR) contra las ventas registradas en el sistema.

## Problema que resuelve

Hoy es imposible hacer un **arqueo real**: no hay forma verificable de hacer coincidir el efectivo y los pagos QR recibidos con los productos que salieron de las estanterías. La librería atiende 14 horas diarias con varios vendedores en turnos, lo que agrava el problema.

## Flujo

```
Inicio de turno: abrir caja (monto inicial)
        ↓
Durante el turno: las ventas se asocian a la caja
        ↓
Fin de turno: contar efectivo → cerrar caja → arqueo (esperado vs. contado)
```

## Funcionalidades

1. Abrir caja con monto inicial.
2. Ver el resumen de la caja en curso: ventas por método de pago y total.
3. Cerrar caja ingresando el efectivo contado.
4. Calcular automáticamente:
   - Efectivo esperado = monto inicial + ventas en efectivo.
   - QR esperado = suma de pagos por QR registrados.
   - Diferencia = efectivo contado − efectivo esperado.
5. Registrar observaciones del arqueo.
6. Consultar el historial de cajas y arqueos por fecha y por vendedor.
7. Resaltar arqueos con diferencia.

## Reglas de negocio

- Un usuario solo puede tener **una caja abierta** a la vez.
- No se pueden registrar ventas sin una caja abierta.
- Una caja cerrada no se puede reabrir ni modificar (solo el administrador puede corregir con justificación).
- Toda diferencia distinta de cero queda registrada y visible para el administrador.
- Los pagos QR se verifican contra el reporte de la app de pago (Yape / Altoke); el sistema registra el monto y una referencia, sin integrarse automáticamente con la pasarela.

## Tablas involucradas

`caja`, `arqueo`, `venta`, `pago`. Ver [base de datos](../02-base-de-datos.md).

## Endpoints propuestos

| Método | Ruta | Descripción | Acceso |
|---|---|---|---|
| POST | `/caja/abrir` | Abrir caja | Autenticado |
| GET | `/caja/actual` | Resumen de la caja abierta | Autenticado |
| POST | `/caja/cerrar` | Cerrar caja y generar arqueo | Autenticado |
| GET | `/caja` | Historial de cajas | Administrador |
| GET | `/caja/:id/arqueo` | Detalle del arqueo | Administrador |

## Casos de uso

- **CU-19 Abrir caja:** el vendedor inicia su turno e ingresa el monto inicial.
- **CU-20 Cerrar caja:** al terminar el turno, cuenta el efectivo y el sistema muestra si cuadra.
- **CU-21 Revisar diferencias:** el administrador revisa los arqueos con diferencia.

## Requisitos relacionados

RF-24, RF-25, RF-26, RNF-10.
