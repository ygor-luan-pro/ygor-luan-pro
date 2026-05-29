# Contribuindo

## Workflow Git

```bash
# Feature branch
git checkout -b feature/nome-da-feature

# Commits semanticos
git commit -m "feat: adiciona player de video"
git commit -m "fix: corrige bug no checkout"
git commit -m "docs: atualiza README"

# Push e PR
git push origin feature/nome-da-feature
```

## Conventional Commits
- `feat`: Nova funcionalidade
- `fix`: Correcao de bug
- `docs`: Documentacao
- `style`: Formatacao (nao afeta codigo)
- `refactor`: Refatoracao
- `test`: Adiciona testes
- `chore`: Manutencao

## Definition of Done (Produto)

Antes de considerar feature pronta para producao:

- [ ] Funciona no mobile (testar viewport 375px)
- [ ] Spec em `docs/specs/` atendida (se feature >2h)
- [ ] Quality Gate CI verde
- [ ] Rollback plan definido (flag, revert, ou deploy anterior)

## Contato

**Cliente**: Ygor Luan
**Instagram**: @ygorluan

## Licenca

Projeto proprietario - Todos os direitos reservados.
Consulte o arquivo `LICENSE` na raiz para os termos completos.
