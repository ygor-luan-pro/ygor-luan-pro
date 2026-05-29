# Checklist Tecnico de Lancamento

Ultima atualizacao: 2026-05-26

Use este arquivo antes de abrir vendas, gravar onboardings finais ou anunciar o acesso aos alunos.

Plano complementar: ver `docs/TECHNICAL_EXECUTION_PLAN.md` para ordem de ataque, dependencias e definicao de pronto.

## Status Atual

- [x] Repo limpo em `staging`
- [x] `pnpm type-check` sem erros
- [x] `pnpm test:unit` com 505 testes passando
- [x] MVP principal implementado
- [x] V1.1 implementada: certificados, progresso, emails, quizzes, materiais, avaliacoes
- [x] V1.2 implementada: comunidade/comentarios
- [ ] Producao validada ponta a ponta com integracoes reais

## Bloqueadores Antes de Vender

- [x] Rodar migrations no Supabase remoto
- [x] Confirmar que as migrations `001` ate `017` aplicaram sem erro
- [ ] Configurar `CAKTO_WEBHOOK_SECRET` no Vercel
- [ ] Configurar `CAL_WEBHOOK_SECRET` no Vercel
- [ ] Configurar variaveis Supabase no Vercel
- [ ] Configurar variaveis Resend no Vercel
- [ ] Configurar variaveis Upstash Redis no Vercel
- [ ] Configurar variaveis Sentry no Vercel, se for usar observabilidade no lancamento
- [ ] Configurar dominio final `ygorluanacademy.com.br` na Vercel
- [ ] Configurar webhook Cakto apontando para `/api/webhook/cakto`
- [ ] Configurar webhook Cal.com apontando para `/api/webhook/cal-booking`
- [ ] Deploy da Edge Function `send-mentorship-reminders`
- [ ] Ativar cron de lembrete de mentoria no Supabase
- [ ] Criar imagem OG em `/public/images/og-cover.jpg`

## Validacao Ponta a Ponta

- [ ] Fazer compra teste/sandbox na Cakto
- [ ] Confirmar webhook Cakto recebendo evento `purchase_approved`
- [ ] Confirmar criacao automatica do usuario no Supabase Auth
- [ ] Confirmar criacao/atualizacao do profile
- [ ] Confirmar criacao do pedido em `orders`
- [ ] Confirmar envio do email de boas-vindas
- [ ] Confirmar link de primeiro acesso/reset de senha funcionando
- [ ] Entrar como aluno recem-comprado
- [ ] Confirmar acesso ao dashboard
- [ ] Confirmar aulas publicadas aparecendo
- [ ] Confirmar player Vimeo carregando videos reais
- [ ] Confirmar progresso de aula salvando
- [ ] Confirmar certificado liberando apos completar aulas
- [ ] Confirmar pagina publica de validacao do certificado
- [ ] Confirmar materiais complementares baixando
- [ ] Confirmar quiz funcionando
- [ ] Confirmar comentarios funcionando
- [ ] Confirmar avaliacao de aula funcionando
- [ ] Confirmar agendamento Cal.com funcionando
- [ ] Confirmar webhook Cal.com registrando agendamento
- [ ] Confirmar email de lembrete de mentoria

## Admin

- [ ] Criar/confirmar usuario admin do Ygor
- [ ] Confirmar login do admin
- [ ] Confirmar acesso ao painel `/admin`
- [ ] Cadastrar ou revisar modulos e aulas reais
- [ ] Conferir slugs, titulos, descricoes e ordem das aulas
- [ ] Conferir links Vimeo privados
- [ ] Conferir materiais de cada aula
- [ ] Conferir quizzes por modulo
- [ ] Conferir lista de alunos
- [ ] Conferir lista de vendas
- [ ] Conferir moderacao de comentarios
- [ ] Conferir certificados no admin

## Conteudo Tecnico Para Gravar/Subir

- [ ] Definir estrutura final dos modulos
- [ ] Definir quantidade final de aulas por modulo
- [ ] Subir videos finais no Vimeo
- [ ] Configurar privacidade dos videos no Vimeo
- [ ] Colar links finais no admin
- [ ] Subir PDFs/materiais complementares
- [ ] Revisar nomes das aulas como aparecem para o aluno
- [ ] Revisar descricao curta de cada aula
- [ ] Revisar ordem de publicacao das aulas

## Segurança e Operacao

- [ ] Confirmar `pnpm audit --audit-level=critical` limpo
- [ ] Confirmar rate limit ativo em producao com Upstash Redis
- [ ] Confirmar `/api/health` respondendo em producao
- [ ] Confirmar Sentry recebendo erro teste, se habilitado
- [ ] Confirmar logs de webhook no painel da Vercel
- [ ] Confirmar que service role key nao aparece no frontend
- [ ] Confirmar RLS habilitado nas tabelas do Supabase
- [ ] Confirmar backups do Supabase ou plano de restore basico
- [ ] Conferir CSP em producao depois do deploy

## Smoke Test Final de Producao

- [ ] Abrir landing no desktop
- [ ] Abrir landing no mobile
- [ ] Testar CTA principal ate checkout
- [ ] Testar login invalido
- [ ] Testar login valido de aluno
- [ ] Testar login valido de admin
- [ ] Testar pagina de aula real
- [ ] Testar logout
- [ ] Testar recuperar senha
- [ ] Testar pagina de termos
- [ ] Testar pagina de privacidade
- [ ] Testar sitemap
- [ ] Testar imagem/preview social com OG

## Debitos Que Nao Bloqueiam Lancamento

- [x] Resolver race condition do webhook Cakto com RPC/transacao atomica
- [x] Adicionar validacao por magic bytes no upload de materiais
- [ ] Adicionar testes E2E do fluxo compra -> acesso -> certificado
- [ ] Adicionar testes de contrato para payloads Cakto e Cal.com
- [ ] Adicionar paginacao em endpoints admin
- [ ] Melhorar tipagem Supabase gerada automaticamente no CI
- [ ] Reduzir casts `as unknown as` restantes nos services
- [ ] Documentar backup/restore com RTO/RPO

## Nao Fazer Antes do Lancamento

- [ ] Nao implementar live classes ainda
- [ ] Nao iniciar app mobile ainda
- [ ] Nao criar programa de afiliados ainda
- [ ] Nao mexer em marketplace/multi-instrutor
- [ ] Nao refatorar arquitetura inteira dos services sem necessidade real

## Comandos de Conferencia

```sh
pnpm type-check
pnpm test:unit
pnpm test:integration
pnpm build
pnpm audit --audit-level=critical
```

## Ordem Recomendada

1. Finalizar videos e materiais reais com o Ygor.
2. Subir conteudo no Vimeo e no admin.
3. Aplicar migrations no Supabase remoto.
4. Configurar env vars e webhooks.
5. Rodar smoke test em staging/producao.
6. Fazer compra sandbox ponta a ponta.
7. Corrigir apenas bugs bloqueadores.
8. Liberar venda.
