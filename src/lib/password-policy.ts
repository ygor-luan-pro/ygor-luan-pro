const COMMON_PASSWORDS = new Set([
  '123456', 'password', '12345678', '123456789', '1234567890',
  'qwerty', 'abc123', '111111', '123123', 'admin',
  'letmein', 'welcome', 'monkey', 'dragon', 'master',
  'password1', 'iloveyou', 'sunshine', 'princess', 'football',
  'shadow', 'superman', 'michael', 'mustang', 'jessica',
  'batman', 'hunter', 'ranger', 'trustno1', 'thomas',
  'robert', 'tigger', 'soccer', 'hockey', 'harley',
  'ranger', 'daniel', 'jordan', 'harley', 'yankees',
  'donald', 'ranger1', 'buster', 'passw0rd', 'killer',
  'testing', 'iamgod', 'pass', 'senha', 'senhaminha',
  '987654321', 'password123', 'zxcvbnm', 'asdfgh', 'qwerty123',
]);

export function validatePassword(
  password: string,
  email?: string,
): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];

  if (password.length < 8) {
    reasons.push('A senha deve ter no mínimo 8 caracteres.');
  }

  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    reasons.push('Esta senha é muito comum. Escolha uma mais segura.');
  }

  if (email) {
    const emailPrefix = email.split('@')[0]?.toLowerCase() ?? '';
    if (emailPrefix && password.toLowerCase().includes(emailPrefix)) {
      reasons.push('A senha não pode conter seu endereço de e-mail.');
    }
  }

  return { ok: reasons.length === 0, reasons };
}
