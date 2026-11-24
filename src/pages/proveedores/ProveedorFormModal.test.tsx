// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ProveedorFormModal } from './ProveedorFormModal';
import { ApiError } from '../../services/api';
import {
  LineaProducto,
  Marca,
  Proveedor,
  proveedoresService,
} from '../../services/proveedores.service';

const PROVEEDORES_EXISTENTES: Proveedor[] = [
  {
    id_proveedor: 1,
    nit: '1020304050',
    razon_social: 'Distribuidora Escolar S.A.',
    nombre_contacto: 'Carlos Valenzuela',
    telefono_contacto: '71234567',
    ciudad: 'La Paz',
    estado: true,
    marcas: ['Faber-Castell'],
    lineas_productos: ['Lápices'],
  },
];

const MARCAS_CATALOGO: Marca[] = [
  { id_marca: 1, nombre_marca: 'Faber-Castell' },
  { id_marca: 2, nombre_marca: 'Norma' },
];

const LINEAS_CATALOGO: LineaProducto[] = [
  { id_linea: 1, nombre_linea: 'Lápices' },
  { id_linea: 2, nombre_linea: 'Cuadernos' },
];

describe('ProveedorFormModal', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('impide vincular marcas o líneas repetidas y valida en tiempo real con normalización', () => {
    render(
      <ProveedorFormModal
        open={true}
        proveedor={PROVEEDORES_EXISTENTES[0]}
        proveedoresExistentes={PROVEEDORES_EXISTENTES}
        marcas={MARCAS_CATALOGO}
        lineas={LINEAS_CATALOGO}
        onClose={vi.fn()}
        onGuardado={vi.fn()}
        onMarcaCreada={vi.fn()}
        onLineaCreada={vi.fn()}
        onToast={vi.fn()}
      />,
    );

    // El select oculta las ya vinculadas ("Faber-Castell" y "Lápices")
    const selectMarca = screen.getByLabelText('Vincular marca existente');
    expect(within(selectMarca).queryByRole('option', { name: 'Faber-Castell' })).toBeNull();
    expect(within(selectMarca).getByRole('option', { name: 'Norma' })).toBeTruthy();

    const selectLinea = screen.getByLabelText('Vincular línea existente');
    expect(within(selectLinea).queryByRole('option', { name: 'Lápices' })).toBeNull();
    expect(within(selectLinea).getByRole('option', { name: 'Cuadernos' })).toBeTruthy();

    // Validación en tiempo real de marca ya vinculada (distintas mayúsculas/espacios)
    const inputMarca = screen.getByLabelText('Crear nueva marca');
    const btnAgregarMarca = screen.getByRole('button', { name: /Agregar marca/i }) as HTMLButtonElement;

    fireEvent.change(inputMarca, { target: { value: '  faber-castell ' } });
    expect(
      screen.getByText('La marca "Faber-Castell" ya está vinculada a este proveedor.'),
    ).toBeTruthy();
    expect(btnAgregarMarca.disabled).toBe(true);

    // Validación en tiempo real de marca existente en catálogo pero aún no vinculada
    fireEvent.change(inputMarca, { target: { value: 'norma' } });
    expect(
      screen.getByText(
        'La marca "Norma" ya existe en el catálogo; selecciónala en la lista superior.',
      ),
    ).toBeTruthy();
    expect(btnAgregarMarca.disabled).toBe(true);

    // Validación en tiempo real de línea ya vinculada (sin tildes / diferente case)
    const inputLinea = screen.getByLabelText('Crear nueva línea');
    const btnAgregarLinea = screen.getByRole('button', { name: /Agregar línea/i }) as HTMLButtonElement;

    fireEvent.change(inputLinea, { target: { value: 'lapices' } });
    expect(
      screen.getByText('La línea "Lápices" ya está vinculada a este proveedor.'),
    ).toBeTruthy();
    expect(btnAgregarLinea.disabled).toBe(true);

    // Validación en tiempo real de línea existente en catálogo
    fireEvent.change(inputLinea, { target: { value: 'cuadernos' } });
    expect(
      screen.getByText(
        'La línea "Cuadernos" ya existe en el catálogo; selecciónala en la lista superior.',
      ),
    ).toBeTruthy();
    expect(btnAgregarLinea.disabled).toBe(true);
  });

  it('permite crear marca y línea nuevas y muestra conflicto 409 inline si ocurre en servidor', async () => {
    const createMarcaSpy = vi
      .spyOn(proveedoresService, 'createMarca')
      .mockResolvedValueOnce({ id_marca: 3, nombre_marca: 'Pilot' })
      .mockRejectedValueOnce(new ApiError("La marca 'Stabilo' ya existe.", 409, {}));

    const createLineaSpy = vi
      .spyOn(proveedoresService, 'createLineaProducto')
      .mockResolvedValueOnce({ id_linea: 3, nombre_linea: 'Mochilas' });

    const onMarcaCreada = vi.fn();
    const onLineaCreada = vi.fn();

    render(
      <ProveedorFormModal
        open={true}
        proveedor={null}
        proveedoresExistentes={PROVEEDORES_EXISTENTES}
        marcas={MARCAS_CATALOGO}
        lineas={LINEAS_CATALOGO}
        onClose={vi.fn()}
        onGuardado={vi.fn()}
        onMarcaCreada={onMarcaCreada}
        onLineaCreada={onLineaCreada}
        onToast={vi.fn()}
      />,
    );

    const inputMarca = screen.getByLabelText('Crear nueva marca');
    fireEvent.change(inputMarca, { target: { value: '  Pilot  ' } });
    expect(screen.getByText('Marca disponible para crear')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Agregar marca/i }));

    await waitFor(() => {
      expect(createMarcaSpy).toHaveBeenCalledWith('Pilot');
      expect(onMarcaCreada).toHaveBeenCalledWith({ id_marca: 3, nombre_marca: 'Pilot' });
    });

    // Ahora probar línea nueva
    const inputLinea = screen.getByLabelText('Crear nueva línea');
    fireEvent.change(inputLinea, { target: { value: 'Mochilas' } });
    expect(screen.getByText('Línea disponible para crear')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Agregar línea/i }));

    await waitFor(() => {
      expect(createLineaSpy).toHaveBeenCalledWith('Mochilas');
      expect(onLineaCreada).toHaveBeenCalledWith({ id_linea: 3, nombre_linea: 'Mochilas' });
    });

    // Probar manejo inline de 409 en segunda creación de marca
    fireEvent.change(inputMarca, { target: { value: 'Stabilo' } });
    fireEvent.click(screen.getByRole('button', { name: /Agregar marca/i }));

    await waitFor(() => {
      expect(screen.getByText("La marca 'Stabilo' ya existe.")).toBeTruthy();
    });
  });

  it('conserva la validación en tiempo real de NIT/CI y teléfono', () => {
    render(
      <ProveedorFormModal
        open={true}
        proveedor={null}
        proveedoresExistentes={PROVEEDORES_EXISTENTES}
        marcas={MARCAS_CATALOGO}
        lineas={LINEAS_CATALOGO}
        onClose={vi.fn()}
        onGuardado={vi.fn()}
        onMarcaCreada={vi.fn()}
        onLineaCreada={vi.fn()}
        onToast={vi.fn()}
      />,
    );

    const nitInput = screen.getByLabelText(/NIT \/ CI/i);
    fireEvent.change(nitInput, { target: { value: '1020304050' } });
    expect(
      screen.getByText('NIT/CI ya registrado en: "Distribuidora Escolar S.A." (Activo).'),
    ).toBeTruthy();

    fireEvent.change(nitInput, { target: { value: '99887766' } });
    expect(screen.getByText('NIT/CI disponible y válido')).toBeTruthy();
  });
});
