// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminMaterialsManager from '../../../src/islands/AdminMaterialsManager';

describe('AdminMaterialsManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'material-1',
        lesson_id: 'lesson-1',
        title: 'Checklist de apoio',
        file_url: 'lesson-1/material.pdf',
        file_type: 'PDF',
        file_size: 128,
        created_at: new Date().toISOString(),
      }),
    }));
  });

  it('envia FormData para o endpoint de upload e atualiza a lista', async () => {
    render(<AdminMaterialsManager lessonId="lesson-1" initialMaterials={[]} />);

    fireEvent.change(screen.getByPlaceholderText('Ex: Checklist de Barbearia'), {
      target: { value: 'Checklist de apoio' },
    });

    const file = new File(['pdf'], 'checklist.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByLabelText('Arquivo *');
    Object.defineProperty(fileInput, 'files', {
      configurable: true,
      value: [file],
    });
    fireEvent.change(fileInput, {
      target: { files: [file] },
    });

    const form = screen.getByRole('button', { name: 'Enviar material' }).closest('form');
    if (!form) throw new Error('form não encontrado');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    const [url, options] = vi.mocked(fetch).mock.calls[0]!;
    expect(url).toBe('/api/admin/materials/upload');
    expect(options?.method).toBe('POST');
    expect(options?.body).toBeInstanceOf(FormData);

    const body = options?.body as FormData;
    expect(body.get('lessonId')).toBe('lesson-1');
    expect(body.get('title')).toBe('Checklist de apoio');
    expect(body.get('file')).toBe(file);

    await waitFor(() => {
      expect(screen.getByText('Checklist de apoio')).toBeInTheDocument();
    });
  });
});
