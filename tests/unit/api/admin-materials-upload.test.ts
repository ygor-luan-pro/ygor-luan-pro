import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/services/users.service', () => ({
  UsersService: {
    isAdmin: vi.fn(),
  },
}));

vi.mock('../../../src/services/materials.service', () => ({
  MaterialsService: {
    create: vi.fn(),
  },
}));

import { POST } from '../../../src/pages/api/admin/materials/upload';
import { UsersService } from '../../../src/services/users.service';
import { MaterialsService } from '../../../src/services/materials.service';
import { supabaseAdmin } from '../../../src/lib/supabase-admin';

const mockUser = { id: 'admin-user-id' };
const lessonId = '714b19ea-3e06-404b-9084-f1201ba47db3';

function buildRequest(file: File) {
  const formData = new FormData();
  formData.set('file', file);
  formData.set('lessonId', lessonId);
  formData.set('title', 'Planilha de apoio');

  return new Request('http://localhost/api/admin/materials/upload', {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: formData,
  });
}

describe('POST /api/admin/materials/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(UsersService.isAdmin).mockResolvedValue(true);
    vi.mocked(MaterialsService.create).mockResolvedValue({
      id: 'material-1',
      lesson_id: lessonId,
      title: 'Planilha de apoio',
      file_url: `${lessonId}/arquivo.xlsx`,
      file_type: 'XLSX',
      file_size: 128,
      created_at: new Date().toISOString(),
    });
  });

  it('retorna 413 antes de fazer parse do multipart quando content-length excede o limite', async () => {
    const formData = vi.fn();
    const request = {
      headers: new Headers({ 'content-length': String(52 * 1024 * 1024) }),
      formData,
    } as unknown as Request;

    const response = await POST({
      request,
      locals: { user: mockUser },
    } as never);

    expect(response.status).toBe(413);
    expect(formData).not.toHaveBeenCalled();
  });

  it('aceita upload de xlsx alinhado com a allowlist do bucket', async () => {
    const upload = vi.fn().mockResolvedValue({ data: { path: 'test/path.xlsx' }, error: null });
    vi.mocked(supabaseAdmin.storage.from).mockReturnValueOnce({
      upload,
    } as never);

    const file = new File(['xlsx'], 'apoio.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const response = await POST({
      request: buildRequest(file),
      locals: { user: mockUser },
    } as never);

    expect(response.status).toBe(201);
    expect(upload).toHaveBeenCalledTimes(1);
    const [storagePath, uploadedFile, options] = upload.mock.calls[0]!;
    expect(storagePath).toMatch(new RegExp(`^${lessonId}/[0-9a-f-]+\\.xlsx$`));
    expect(uploadedFile).toBeInstanceOf(File);
    expect((uploadedFile as File).name).toBe('apoio.xlsx');
    expect(options).toEqual({ contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    expect(MaterialsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        lesson_id: lessonId,
        title: 'Planilha de apoio',
        file_type: 'XLSX',
      }),
    );
  });

  it('rejeita docx porque o bucket materials não aceita esse tipo', async () => {
    const file = new File(['docx'], 'apostila.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    const response = await POST({
      request: buildRequest(file),
      locals: { user: mockUser },
    } as never);

    expect(response.status).toBe(400);
    expect(await response.text()).toContain('Tipo de arquivo não permitido');
    expect(MaterialsService.create).not.toHaveBeenCalled();
  });
});
