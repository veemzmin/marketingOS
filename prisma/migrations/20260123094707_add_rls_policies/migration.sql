-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- Defense-in-depth tenant isolation at the database level
-- ============================================================================

-- Create app_user role for application connections (not superuser)
-- Some managed Postgres providers disallow CREATE ROLE. In that case, skip role creation/grants.
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_user') THEN
    BEGIN
      CREATE ROLE app_user WITH LOGIN PASSWORD 'app_password_change_in_production';
    EXCEPTION
      WHEN insufficient_privilege THEN
        RAISE NOTICE 'Skipping app_user role creation due to insufficient privileges.';
    END;
  END IF;

  IF EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_user') THEN
    BEGIN
      EXECUTE 'GRANT CONNECT ON DATABASE marketing_os TO app_user';
      EXECUTE 'GRANT USAGE ON SCHEMA public TO app_user';
      EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user';
      EXECUTE 'GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user';
      EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user';
      EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO app_user';
    EXCEPTION
      WHEN insufficient_privilege THEN
        RAISE NOTICE 'Skipping app_user grants due to insufficient privileges.';
    END;
  END IF;
END
$$;

-- ============================================================================
-- ENABLE RLS ON TENANT-SCOPED TABLES
-- ============================================================================

-- Organizations table
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- User organizations join table
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;

-- Audit logs table
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- TENANT ISOLATION POLICIES
-- Uses current_setting('app.current_tenant_id') to filter rows
-- Application must SET this per-request using Prisma Client Extensions
-- ============================================================================

-- Organizations: Users can only access their own organization
CREATE POLICY tenant_isolation_organizations ON organizations
  FOR ALL
  USING (id = current_setting('app.current_tenant_id', TRUE));

-- User Organizations: Users can only see memberships for their current tenant
CREATE POLICY tenant_isolation_user_organizations ON user_organizations
  FOR ALL
  USING ("organizationId" = current_setting('app.current_tenant_id', TRUE));

-- Audit Logs: Users can only see audit logs for their current tenant
-- Note: Separate policies for SELECT vs INSERT due to append-only requirement
CREATE POLICY tenant_isolation_audit_logs_select ON audit_logs
  FOR SELECT
  USING ("organizationId" = current_setting('app.current_tenant_id', TRUE));

CREATE POLICY tenant_isolation_audit_logs_insert ON audit_logs
  FOR INSERT
  WITH CHECK ("organizationId" = current_setting('app.current_tenant_id', TRUE));

-- ============================================================================
-- APPEND-ONLY POLICY FOR AUDIT LOGS
-- Prevents UPDATE and DELETE to ensure immutable audit trail
-- ============================================================================

-- Block all UPDATE operations on audit_logs
CREATE POLICY no_update_audit_logs ON audit_logs
  FOR UPDATE
  USING (false);

-- Block all DELETE operations on audit_logs
CREATE POLICY no_delete_audit_logs ON audit_logs
  FOR DELETE
  USING (false);

-- ============================================================================
-- BYPASS POLICIES FOR SUPERUSER/ADMIN OPERATIONS
-- Allow superuser to bypass RLS for migrations and administrative tasks
-- ============================================================================

-- Superusers automatically bypass RLS, but we make it explicit
ALTER TABLE organizations FORCE ROW LEVEL SECURITY;
ALTER TABLE user_organizations FORCE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;

-- Note: FORCE ROW LEVEL SECURITY means even table owners are subject to policies
-- Only users with BYPASSRLS attribute can bypass (typically only the postgres superuser)

-- ============================================================================
-- VERIFICATION QUERIES
-- Run these to verify RLS is working correctly:
-- ============================================================================

-- Check RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('organizations', 'user_organizations', 'audit_logs');

-- Check policies exist:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual FROM pg_policies WHERE tablename IN ('organizations', 'user_organizations', 'audit_logs');

-- Test tenant isolation (should return 0 rows without setting app.current_tenant_id):
-- SET ROLE app_user;
-- SELECT * FROM organizations;

-- Test with tenant context (should return rows for that tenant):
-- SET app.current_tenant_id = 'your-org-id-here';
-- SELECT * FROM organizations;
