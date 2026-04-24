# DB Optimization — Backlog Técnico

Melhorias mapeadas após auditoria de schema (2026-04-23). Não implementar antes de >500 alunos ativos ou evidência de slow queries no Supabase → Reports → Query Performance.

## Fase 3 — Escala Futura

### F3-1 · View materializada `lesson_stats`

**Problema:** cada load de `/dashboard/aulas` e `/aula/[id]` executa `COUNT` em `lesson_comments` e `AVG` em `lesson_ratings` on-the-fly.

**Solução:**
```sql
CREATE MATERIALIZED VIEW lesson_stats AS
SELECT
  l.id AS lesson_id,
  COUNT(c.id) FILTER (WHERE c.deleted_at IS NULL) AS comment_count,
  ROUND(AVG(r.rating), 1) AS avg_rating,
  COUNT(r.id) AS rating_count
FROM lessons l
LEFT JOIN lesson_comments c ON c.lesson_id = l.id
LEFT JOIN lesson_ratings r ON r.lesson_id = l.id
GROUP BY l.id;

CREATE UNIQUE INDEX ON lesson_stats(lesson_id);
```

**Refresh:** via trigger em `lesson_comments` e `lesson_ratings` (INSERT/UPDATE/DELETE) ou cron a cada 5min.

**Quando fazer:** load de `/dashboard/aulas` acima de 200ms medido no Supabase.

---

### F3-2 · FK formal `quiz_questions.module_number → modules.order_number`

**Problema:** `module_number` em `quiz_questions` é `integer` solto — sem constraint referencial. Permite inserir questões para módulos inexistentes.

**Solução:**
```sql
ALTER TABLE quiz_questions
  ADD CONSTRAINT quiz_questions_module_number_fkey
  FOREIGN KEY (module_number) REFERENCES modules(order_number)
  ON DELETE RESTRICT;
```

**Pré-requisito:** garantir que `modules.order_number` tem índice UNIQUE (verificar antes de aplicar).

**Quando fazer:** antes de permitir criação de módulos dinâmica pelo admin (hoje são fixos).

---

### F3-3 · Índice parcial `orders` para `hasActiveAccess()`

**Problema:** `idx_orders_user_status` cobre `(user_id, status)` mas inclui todos os status (`pending`, `refunded`, `paid`). O middleware só precisa de `paid`.

**Solução:**
```sql
CREATE INDEX idx_orders_user_paid
  ON orders(user_id)
  WHERE status = 'paid';
```

Após criar, pode remover `idx_orders_user_status` se não houver queries filtrando outros status.

**Quando fazer:** se `hasActiveAccess()` aparecer nas top queries do Supabase Reports.

---

## Contexto da Auditoria (2026-04-23)

| Item | Status |
|---|---|
| Índices de FK faltantes (7) | ✅ Aplicado — migration 015 |
| `generate_certificate_number` search_path | ✅ Aplicado — migration 014 |
| N+1 em `admin/quiz/index.astro` | ✅ Corrigido — `getCountsPerModule()` |
| Schema `extensions` | ✅ Aplicado — migration 016 |
| `pg_net` em schema public | ✅ Falso positivo — funções estão em `net`, não `public` |
| Leaked password protection | ⚠️ Requer Pro plan |
| Secure password change | ✅ Ativar no Supabase Dashboard |
