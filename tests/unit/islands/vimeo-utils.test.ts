import { describe, it, expect } from 'vitest';
import { shouldSaveWatchTime, shouldAutoComplete, extractVimeoId } from '../../../src/islands/vimeo-utils';

describe('shouldSaveWatchTime', () => {
  it('deve salvar quando avançou 30s exatos', () => {
    expect(shouldSaveWatchTime(30, 0)).toBe(true);
  });

  it('não deve salvar quando avançou menos de 30s', () => {
    expect(shouldSaveWatchTime(29, 0)).toBe(false);
  });

  it('deve salvar quando acumulou mais 30s a partir do último save', () => {
    expect(shouldSaveWatchTime(65, 35)).toBe(true);
  });

  it('não deve salvar com diferença de 29s', () => {
    expect(shouldSaveWatchTime(64, 35)).toBe(false);
  });
});

describe('shouldAutoComplete', () => {
  it('deve auto-completar exato em 90%', () => {
    expect(shouldAutoComplete(90, 100)).toBe(true);
  });

  it('não deve auto-completar em 89%', () => {
    expect(shouldAutoComplete(89, 100)).toBe(false);
  });

  it('não deve auto-completar quando duration é 0', () => {
    expect(shouldAutoComplete(0, 0)).toBe(false);
  });

  it('deve suportar threshold customizável', () => {
    expect(shouldAutoComplete(80, 100, 0.8)).toBe(true);
  });
});

describe('extractVimeoId', () => {
  it('extrai ID de URL padrão', () => {
    expect(extractVimeoId('https://vimeo.com/123456')).toBe('123456');
  });

  it('extrai ID de URL com path adicional', () => {
    expect(extractVimeoId('https://vimeo.com/123456/abc')).toBe('123456');
  });

  it('retorna null para URL não-Vimeo', () => {
    expect(extractVimeoId('https://youtube.com/watch?v=abc')).toBeNull();
  });

  it('retorna null para string vazia', () => {
    expect(extractVimeoId('')).toBeNull();
  });

  it('retorna null para URL sem número', () => {
    expect(extractVimeoId('https://vimeo.com/channels/staffpicks')).toBeNull();
  });
});
