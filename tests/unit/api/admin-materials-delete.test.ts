import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/services/materials.service', () => ({
  MaterialsService: {
    getById: vi.fn(),
    delete: vi.fn(),
    removeFile: vi.fn(),
  },
}));

import { DELETE } from '../../../src/pages/api/admin/materials/[id]';
import { MaterialsService } from '../../../src/services/materials.service';

describe('DELETE /api/admin/materials/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('remove arquivo do bucket quando file_url é caminho relativo', async () => {
    vi.mocked(MaterialsService.getById).mockResolvedValue({
      id: 'material-1',
      lesson_id: 'lesson-1',
      title: 'Checklist',
      file_url: 'lesson-1/checklist.pdf',
      file_type: 'PDF',
      file_size: 128,
      created_at: new Date().toISOString(),
    });

    const response = await DELETE({
      locals: { isAdmin: true },
      params: { id: 'material-1' },
    } as never);

    expect(response.status).toBe(204);
    expect(MaterialsService.delete).toHaveBeenCalledWith('material-1');
    expect(MaterialsService.removeFile).toHaveBeenCalledWith('lesson-1/checklist.pdf');
    expect(vi.mocked(MaterialsService.delete).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(MaterialsService.removeFile).mock.invocationCallOrder[0],
    );
  });

  it('não tenta remover do bucket quando file_url é externo', async () => {
    vi.mocked(MaterialsService.getById).mockResolvedValue({
      id: 'material-1',
      lesson_id: 'lesson-1',
      title: 'Checklist',
      file_url: 'https://drive.google.com/file/d/abc/view',
      file_type: 'PDF',
      file_size: null,
      created_at: new Date().toISOString(),
    });

    const response = await DELETE({
      locals: { isAdmin: true },
      params: { id: 'material-1' },
    } as never);

    expect(response.status).toBe(204);
    expect(MaterialsService.removeFile).not.toHaveBeenCalled();
    expect(MaterialsService.delete).toHaveBeenCalledWith('material-1');
  });

  it('mantém 204 quando a limpeza do bucket falha depois de remover o registro', async () => {
    vi.mocked(MaterialsService.getById).mockResolvedValue({
      id: 'material-1',
      lesson_id: 'lesson-1',
      title: 'Checklist',
      file_url: 'lesson-1/checklist.pdf',
      file_type: 'PDF',
      file_size: 128,
      created_at: new Date().toISOString(),
    });
    vi.mocked(MaterialsService.removeFile).mockRejectedValueOnce(new Error('storage down'));

    const response = await DELETE({
      locals: { isAdmin: true },
      params: { id: 'material-1' },
    } as never);

    expect(response.status).toBe(204);
    expect(MaterialsService.delete).toHaveBeenCalledWith('material-1');
    expect(MaterialsService.removeFile).toHaveBeenCalledWith('lesson-1/checklist.pdf');
  });
});
