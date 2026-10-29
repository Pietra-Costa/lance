SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('AuditChainState', 'RefreshSession')
ORDER BY tablename;