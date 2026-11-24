// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { PedidoFormModal, ordenarProductosPorStock } from './PedidoFormModal';
import { pedidosService } from '../../services/pedidos-proveedor.service';
import { Producto } from '../../services/productos.service';
import { Proveedor } from '../../services/proveedores.service';
import { Usuario } from '../../services/usuarios.service';

vi.mock('../../components/SelectorComprobante/SelectorComprobante', () => ({
  SelectorComprobante: () => <div data-testid="selector-comprobante" />,
}));

const USUARIOS: Usuario[] = [
  {
    id_usuario: 1,
    nombre_completo: 'Nelly Admin',
    username: 'nelly',
    rol: 'ADMIN',
    turno: 'mañana',
    estado: true,
  },
];

const PROVEEDORES: Proveedor[] = [
  {
    id_proveedor: 10,
    nit: '1001001',
    razon_social: 'Distribuidora Faber',
    nombre_contacto: 'Juan',
    telefono_contacto: '71111111',
    ciudad: 'La Paz',
    estado: true,
    marcas: ['Faber-Castell'],
    ids_marcas: [1],
    lineas_productos: ['Escritura'],
  },
  {
    id_proveedor: 20,
    nit: '2002002',
    razon_social: 'Papelera Norma Uno',
    nombre_contacto: 'Ana',
    telefono_contacto: '72222222',
    ciudad: 'El Alto',
    estado: true,
    marcas: ['Norma'],
    ids_marcas: [2],
    lineas_productos: ['Cuadernos'],
  },
  {
    id_proveedor: 30,
    nit: '3003003',
    razon_social: 'Mayorista Norma Dos',
    nombre_contacto: 'Luis',
    telefono_contacto: '73333333',
    ciudad: 'La Paz',
    estado: true,
    marcas: ['Norma'],
    ids_marcas: [2],
    lineas_productos: ['Cuadernos'],
  },
];

const PRODUCTOS: Producto[] = [
  {
    id_producto: 1,
    codigo_barras: '777001',
    nombre_producto: 'Bolígrafo Azul',
    id_marca: 1,
    nombre_marca: 'Faber-Castell',
    nombre_linea: 'Escritura',
    precio: 3,
    precio_compra: 2,
    stock_actual: 80,
    stock_minimo: 10,
    estado: true,
  },
  {
    id_producto: 2,
    codigo_barras: '777002',
    nombre_producto: 'Cuaderno Empastado',
    id_marca: 2,
    nombre_marca: 'Norma',
    nombre_linea: 'Cuadernos',
    precio: 20,
    precio_compra: 14,
    stock_actual: 3,
    stock_minimo: 5,
    estado: true,
  },
  {
    id_producto: 3,
    codigo_barras: '777003',
    nombre_producto: 'Marcador Acrílico',
    id_marca: 1,
    nombre_marca: 'Faber-Castell',
    nombre_linea: 'Escritura',
    precio: 10,
    precio_compra: 6.5,
    stock_actual: 0,
    stock_minimo: 8,
    estado: true,
  },
  {
    id_producto: 4,
    codigo_barras: '777004',
    nombre_producto: 'Regla Sin Proveedor',
    id_marca: 99,
    nombre_marca: 'Genérica',
    nombre_linea: 'Geometría',
    precio: 5,
    precio_compra: 3,
    stock_actual: 1,
    stock_minimo: 5,
    estado: true,
  },
];

describe('PedidoFormModal', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('ordena productos dejando bajo stock y agotados arriba de menor a mayor stock', () => {
    const ordenados = ordenarProductosPorStock(PRODUCTOS);
    expect(ordenados.map((p) => p.nombre_producto)).toEqual([
      'Marcador Acrílico', // stock 0 (bajo)
      'Regla Sin Proveedor', // stock 1 (bajo)
      'Cuaderno Empastado', // stock 3 (bajo)
      'Bolígrafo Azul', // stock 80 (normal)
    ]);
  });

  it('permite buscar y pedir directamente por producto autoseleccionando al proveedor compatible', async () => {
    const createSpy = vi.spyOn(pedidosService, 'create').mockResolvedValue({
      id_pedido: 99,
      id_proveedor: 10,
      id_usuario: 1,
      fecha_pedido: '2026-11-17T00:00:00.000Z',
      estado_pedido: 'Pendiente',
      total_pedido: 13,
      detalles: [],
    });
    const onGuardado = vi.fn();

    render(
      <PedidoFormModal
        open={true}
        editando={null}
        productos={PRODUCTOS}
        proveedores={PROVEEDORES}
        usuarios={USUARIOS}
        onClose={vi.fn()}
        onGuardado={onGuardado}
        onError={vi.fn()}
      />,
    );

    // Cambiar al modo "Por Producto"
    fireEvent.click(screen.getByRole('tab', { name: /Por Producto/i }));

    // Verificar orden inicial: agotado (0) primero y stock normal (80) al final
    const listaProductos = screen.getByRole('list', {
      name: /Productos disponibles por stock/i,
    });
    const items = within(listaProductos).getAllByRole('listitem');
    expect(items.length).toBe(4);
    expect(items[0].textContent).toContain('Marcador Acrílico');
    expect(items[1].textContent).toContain('Regla Sin Proveedor');
    expect(items[2].textContent).toContain('Cuaderno Empastado');
    expect(items[3].textContent).toContain('Bolígrafo Azul');

    // El producto sin proveedor ("Regla Sin Proveedor") aparece con el botón deshabilitado
    const sinProvBtn = within(items[1]).getByRole('button', {
      name: /Agregar/i,
    }) as HTMLButtonElement;
    expect(sinProvBtn.disabled).toBe(true);
    expect(within(items[1]).getByText('Sin proveedor asociado')).toBeTruthy();

    // Agregar "Marcador Acrílico" (1 solo proveedor compatible: Distribuidora Faber)
    fireEvent.click(within(items[0]).getByRole('button', { name: /Agregar/i }));

    // Autoselecciona "Distribuidora Faber" y llena la primera línea
    const provSelect = screen.getByRole('combobox', { name: /Proveedor/i }) as HTMLSelectElement;
    expect(provSelect.value).toBe('10');

    // Al volver a pulsar sobre el mismo producto, suma +1 a la cantidad
    fireEvent.click(within(listaProductos).getByRole('button', { name: /Sumar \(\+1 · 1\)/i }));
    expect(within(listaProductos).getByRole('button', { name: /Sumar \(\+1 · 2\)/i })).toBeTruthy();

    // Los productos de otra marca quedan atenuados y deshabilitados hasta limpiar proveedor
    expect(within(listaProductos).getByText('Otro proveedor')).toBeTruthy();

    // Enviar pedido
    fireEvent.click(screen.getByRole('button', { name: /Guardar/i }));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id_proveedor: 10,
          id_usuario: 1,
          detalles: [
            expect.objectContaining({
              id_producto: 3,
              cantidad_solicitada: 2,
              unidad_venta: 'Unidad',
              factor_conversion: 1,
              precio_unitario_compra: 6.5,
            }),
          ],
        }),
      );
      expect(onGuardado).toHaveBeenCalledWith('Pedido registrado correctamente.');
    });
  });

  it('filtra por texto o solo bajo stock y muestra proveedores compatibles cuando hay varios', () => {
    render(
      <PedidoFormModal
        open={true}
        editando={null}
        productos={PRODUCTOS}
        proveedores={PROVEEDORES}
        usuarios={USUARIOS}
        onClose={vi.fn()}
        onGuardado={vi.fn()}
        onError={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('tab', { name: /Por Producto/i }));

    const listaProductos = screen.getByRole('list', {
      name: /Productos disponibles por stock/i,
    });

    // Activar chip "Solo bajo stock" -> oculta "Bolígrafo Azul" (stock 80)
    fireEvent.click(screen.getByRole('button', { name: /Solo bajo stock/i }));
    expect(within(listaProductos).queryByText('Bolígrafo Azul')).toBeNull();
    expect(within(listaProductos).getByText('Cuaderno Empastado')).toBeTruthy();

    // Buscar "Cuaderno" y agregarlo -> tiene 2 proveedores compatibles (Norma Uno y Norma Dos)
    const searchInput = screen.getByLabelText('Buscar producto para pedir');
    fireEvent.change(searchInput, { target: { value: 'Cuaderno' } });

    expect(within(listaProductos).queryByText('Marcador Acrílico')).toBeNull();
    fireEvent.click(within(listaProductos).getByRole('button', { name: /Agregar/i }));

    const provSelect = screen.getByRole('combobox', { name: /Proveedor/i });
    expect(within(provSelect).getByRole('option', { name: 'Papelera Norma Uno' })).toBeTruthy();
    expect(within(provSelect).getByRole('option', { name: 'Mayorista Norma Dos' })).toBeTruthy();
    expect(within(provSelect).queryByRole('option', { name: 'Distribuidora Faber' })).toBeNull();

    // Limpiar proveedor permite volver a pedir otra marca
    fireEvent.click(screen.getByRole('button', { name: /Limpiar proveedor/i }));
    expect((provSelect as HTMLSelectElement).value).toBe('');
  });
});
