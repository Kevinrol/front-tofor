// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ClienteFormModal } from './ClienteFormModal';
import { ApiError } from '../../services/api';
import { Cliente, clientesService } from '../../services/clientes.service';

const CLIENTES_EXISTENTES: Cliente[] = [
  {
    id_cliente: 1,
    razon_social_nombre: 'Librería El Estudiante',
    nit_ci: '4523189',
    telefono: '71122334',
    direccion: 'Av. 6 de Marzo #450',
    tipo_cliente: 'Mayorista',
    estado: true,
  },
  {
    id_cliente: 2,
    razon_social_nombre: 'Papelería Choque',
    nit_ci: '1034567028',
    telefono: '72233445',
    direccion: 'Calle Murillo #233',
    tipo_cliente: 'Mayorista',
    estado: false,
  },
];

describe('ClienteFormModal', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('valida NIT / CI en tiempo real: solo números, longitud y duplicados al crear', () => {
    render(
      <ClienteFormModal
        open={true}
        cliente={null}
        clientesExistentes={CLIENTES_EXISTENTES}
        onClose={vi.fn()}
        onGuardado={vi.fn()}
      />,
    );

    expect(screen.getByText('Nuevo Cliente')).toBeTruthy();

    const nitInput = screen.getByLabelText(/NIT \/ CI/i);
    const submitBtn = screen.getByRole('button', { name: /Guardar/i }) as HTMLButtonElement;

    // 1. Letras o guiones -> error inmediato
    fireEvent.change(nitInput, { target: { value: '4523-1B' } });
    expect(screen.getByText('El NIT / CI debe contener únicamente números.')).toBeTruthy();
    expect(submitBtn.disabled).toBe(true);

    // 2. Espacios intermedios -> error inmediato
    fireEvent.change(nitInput, { target: { value: '4523 189' } });
    expect(screen.getByText('El NIT / CI no debe contener espacios.')).toBeTruthy();
    expect(submitBtn.disabled).toBe(true);

    // 3. Menos de 5 dígitos -> error inmediato
    fireEvent.change(nitInput, { target: { value: '1234' } });
    expect(screen.getByText('El NIT / CI debe tener al menos 5 dígitos.')).toBeTruthy();
    expect(submitBtn.disabled).toBe(true);

    // 4. Duplicado existente (inactivo) -> indica nombre y estado
    fireEvent.change(nitInput, { target: { value: '1034567028' } });
    expect(
      screen.getByText('NIT / CI ya registrado en: "Papelería Choque" (Inactivo).'),
    ).toBeTruthy();
    expect(submitBtn.disabled).toBe(true);

    // 5. Vaciar el campo -> no muestra error intrusivo mientras escribe
    fireEvent.change(nitInput, { target: { value: '' } });
    expect(screen.queryByText(/NIT \/ CI/)).toBeTruthy();
    expect(screen.queryByText(/debe|registrado|disponible/i)).toBeNull();
    expect(submitBtn.disabled).toBe(false);

    // 6. Numérico válido y disponible -> indicador verde
    fireEvent.change(nitInput, { target: { value: '9876543' } });
    expect(screen.getByText('NIT / CI disponible y válido')).toBeTruthy();
    expect(submitBtn.disabled).toBe(false);
  });

  it('permite mantener el propio NIT / CI al editar, pero rechaza el de otro cliente', async () => {
    const updateSpy = vi
      .spyOn(clientesService, 'update')
      .mockResolvedValue({ ...CLIENTES_EXISTENTES[0], telefono: '79999999' });
    const onGuardado = vi.fn();

    render(
      <ClienteFormModal
        open={true}
        cliente={CLIENTES_EXISTENTES[0]}
        clientesExistentes={CLIENTES_EXISTENTES}
        onClose={vi.fn()}
        onGuardado={onGuardado}
      />,
    );

    expect(screen.getByText('Editar Cliente')).toBeTruthy();
    expect(screen.getByText('NIT / CI disponible y válido')).toBeTruthy();

    const nitInput = screen.getByLabelText(/NIT \/ CI/i);
    fireEvent.change(nitInput, { target: { value: '1034567028' } });
    expect(
      screen.getByText('NIT / CI ya registrado en: "Papelería Choque" (Inactivo).'),
    ).toBeTruthy();

    // Restaurar su propio NIT / CI
    fireEvent.change(nitInput, { target: { value: '4523189' } });
    expect(screen.getByText('NIT / CI disponible y válido')).toBeTruthy();

    const telInput = screen.getByLabelText(/Teléfono/i);
    fireEvent.change(telInput, { target: { value: '79999999' } });

    fireEvent.click(screen.getByRole('button', { name: /Guardar/i }));

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(1, {
        razon_social_nombre: 'Librería El Estudiante',
        nit_ci: '4523189',
        tipo_cliente: 'Mayorista',
        estado: true,
        telefono: '79999999',
        direccion: 'Av. 6 de Marzo #450',
      });
      expect(onGuardado).toHaveBeenCalledWith('Cliente actualizado correctamente.');
    });
  });

  it('exige campos obligatorios al enviar y mapea error 409 del servidor a NIT / CI', async () => {
    const createSpy = vi
      .spyOn(clientesService, 'create')
      .mockRejectedValue(new ApiError('El cliente con NIT/CI 9988776 ya existe.', 409, {}));

    render(
      <ClienteFormModal
        open={true}
        cliente={null}
        clientesExistentes={CLIENTES_EXISTENTES}
        onClose={vi.fn()}
        onGuardado={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Guardar/i }));
    expect(screen.getByText('El nombre o razón social es obligatorio.')).toBeTruthy();
    expect(screen.getByText('El NIT / CI es obligatorio.')).toBeTruthy();
    expect(createSpy).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/Nombre o razón social/i), {
      target: { value: 'Librería Nueva' },
    });
    fireEvent.change(screen.getByLabelText(/NIT \/ CI/i), {
      target: { value: '9988776' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Guardar/i }));

    await waitFor(() => {
      expect(screen.getByText('El cliente con NIT/CI 9988776 ya existe.')).toBeTruthy();
    });
  });
});
