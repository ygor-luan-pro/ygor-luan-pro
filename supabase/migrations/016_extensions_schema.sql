CREATE SCHEMA IF NOT EXISTS extensions;

-- pg_net: extension registrada em 'public' mas funções vivem em schema 'net'
-- ALTER EXTENSION pg_net SET SCHEMA extensions falharia (objetos em net != public)
-- Não há exposição real em public. Schema 'extensions' criado para futuras extensões.
