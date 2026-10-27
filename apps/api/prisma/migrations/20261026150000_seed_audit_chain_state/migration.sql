
INSERT INTO "AuditChainState" ("id", "lastSequence", "updatedAt")
VALUES ('global', 0, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
