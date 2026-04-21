import { describe, expect, it } from 'vitest';
import {
  extractGoogleDriveFileId,
  getFilenameFromContentDisposition,
  inferExtension,
  isExternalUrl,
  sanitizeFilename,
  toDownloadableMaterialUrl,
} from '../../../scripts/materials-migration-lib.mjs';

describe('materials migration helpers', () => {
  it('detecta URLs externas', () => {
    expect(isExternalUrl('https://drive.google.com/file/d/abc/view')).toBe(true);
    expect(isExternalUrl('lesson-1/material.pdf')).toBe(false);
  });

  it('extrai file id de links do Google Drive', () => {
    expect(extractGoogleDriveFileId('https://drive.google.com/file/d/1XQfoBxmptBo-6oynok_0NrWhqavC6WK9/view?usp=sharing')).toBe('1XQfoBxmptBo-6oynok_0NrWhqavC6WK9');
    expect(extractGoogleDriveFileId('https://drive.google.com/uc?export=download&id=abc123')).toBe('abc123');
    expect(extractGoogleDriveFileId('https://example.com/file.pdf')).toBe(null);
  });

  it('converte links do Google Drive para download direto', () => {
    expect(
      toDownloadableMaterialUrl('https://drive.google.com/file/d/1XQfoBxmptBo-6oynok_0NrWhqavC6WK9/view?usp=sharing'),
    ).toBe('https://drive.google.com/uc?export=download&id=1XQfoBxmptBo-6oynok_0NrWhqavC6WK9');
    expect(toDownloadableMaterialUrl('https://example.com/file.pdf')).toBe('https://example.com/file.pdf');
  });

  it('lê nome de arquivo do content-disposition', () => {
    expect(
      getFilenameFromContentDisposition(`attachment; filename="arquivo.pdf"`),
    ).toBe('arquivo.pdf');
    expect(
      getFilenameFromContentDisposition(`attachment; filename*=UTF-8''Clube%20dos%20Fornecedores%20Fitness%20-%20Edicao%207.pdf`),
    ).toBe('Clube dos Fornecedores Fitness - Edicao 7.pdf');
    expect(getFilenameFromContentDisposition(null)).toBe(null);
  });

  it('sanitiza nomes de arquivo', () => {
    expect(sanitizeFilename('Clube dos Fornecedores Fitness – Edição 7.pdf')).toBe('Clube-dos-Fornecedores-Fitness-Edicao-7.pdf');
  });

  it('infere extensão pelo nome do arquivo ou mime type', () => {
    expect(inferExtension({ fileName: 'arquivo.pdf', contentType: 'application/octet-stream' })).toBe('pdf');
    expect(inferExtension({ fileName: 'arquivo', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })).toBe('xlsx');
    expect(inferExtension({ fileName: 'arquivo', contentType: null })).toBe('bin');
  });
});
