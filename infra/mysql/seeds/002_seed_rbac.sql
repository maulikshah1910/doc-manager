-- Seed: RBAC (Roles, Permissions, Role-Permission Mappings)
-- Created: 2026-01-03
-- Description: Create default roles, permissions, and their mappings for the document management system

-- ===========================================
-- STEP 1: Seed Roles
-- ===========================================

INSERT INTO roles (id, name, display_name, description, is_active)
VALUES
    (1, 'super_admin', 'Super Administrator', 'Full system access with all permissions. Can manage users, roles, permissions, and all system settings.', TRUE),
    (2, 'admin', 'Administrator', 'Administrative access with most permissions. Can manage users and documents but cannot modify roles or permissions.', TRUE),
    (3, 'manager', 'Manager', 'Management level access. Can manage documents, view reports, and manage team members.', TRUE),
    (4, 'employee', 'Employee', 'Standard employee access. Can create, view, and edit own documents. Limited access to other resources.', TRUE),
    (5, 'viewer', 'Viewer', 'Read-only access. Can only view documents and reports assigned to them.', TRUE)
ON DUPLICATE KEY UPDATE
    display_name = VALUES(display_name),
    description = VALUES(description),
    is_active = VALUES(is_active),
    updated_at = CURRENT_TIMESTAMP;


-- ===========================================
-- STEP 2: Seed Permissions
-- ===========================================

-- Document Management Permissions
INSERT INTO permissions (name, display_name, description, module, is_active)
VALUES
    -- Documents
    ('documents.view', 'View Documents', 'View and read documents', 'documents', TRUE),
    ('documents.view_all', 'View All Documents', 'View all documents in the system', 'documents', TRUE),
    ('documents.create', 'Create Documents', 'Upload and create new documents', 'documents', TRUE),
    ('documents.edit', 'Edit Documents', 'Edit own documents', 'documents', TRUE),
    ('documents.edit_all', 'Edit All Documents', 'Edit any document in the system', 'documents', TRUE),
    ('documents.delete', 'Delete Documents', 'Delete own documents', 'documents', TRUE),
    ('documents.delete_all', 'Delete All Documents', 'Delete any document in the system', 'documents', TRUE),
    ('documents.share', 'Share Documents', 'Share documents with other users', 'documents', TRUE),
    ('documents.approve', 'Approve Documents', 'Approve or reject documents', 'documents', TRUE),
    ('documents.download', 'Download Documents', 'Download documents', 'documents', TRUE),

    -- User Management Permissions
    ('users.view', 'View Users', 'View user profiles and information', 'users', TRUE),
    ('users.create', 'Create Users', 'Create new user accounts', 'users', TRUE),
    ('users.edit', 'Edit Users', 'Edit user information and profiles', 'users', TRUE),
    ('users.delete', 'Delete Users', 'Delete user accounts', 'users', TRUE),
    ('users.manage_roles', 'Manage User Roles', 'Assign roles to users', 'users', TRUE),
    ('users.suspend', 'Suspend Users', 'Suspend or activate user accounts', 'users', TRUE),

    -- Role & Permission Management
    ('roles.view', 'View Roles', 'View roles and their permissions', 'roles', TRUE),
    ('roles.create', 'Create Roles', 'Create new roles', 'roles', TRUE),
    ('roles.edit', 'Edit Roles', 'Edit existing roles', 'roles', TRUE),
    ('roles.delete', 'Delete Roles', 'Delete roles', 'roles', TRUE),
    ('permissions.view', 'View Permissions', 'View all permissions', 'permissions', TRUE),
    ('permissions.manage', 'Manage Permissions', 'Assign permissions to roles', 'permissions', TRUE),

    -- Reports & Analytics
    ('reports.view', 'View Reports', 'View reports and analytics', 'reports', TRUE),
    ('reports.view_all', 'View All Reports', 'View all system reports', 'reports', TRUE),
    ('reports.create', 'Create Reports', 'Generate custom reports', 'reports', TRUE),
    ('reports.export', 'Export Reports', 'Export reports to various formats', 'reports', TRUE),

    -- System Settings
    ('settings.view', 'View Settings', 'View system settings', 'settings', TRUE),
    ('settings.edit', 'Edit Settings', 'Modify system settings', 'settings', TRUE),

    -- Audit & Logs
    ('audit.view', 'View Audit Logs', 'View system audit logs and user activities', 'audit', TRUE),
    ('audit.export', 'Export Audit Logs', 'Export audit logs', 'audit', TRUE)
ON DUPLICATE KEY UPDATE
    display_name = VALUES(display_name),
    description = VALUES(description),
    module = VALUES(module),
    is_active = VALUES(is_active),
    updated_at = CURRENT_TIMESTAMP;


-- ===========================================
-- STEP 3: Map Permissions to Roles
-- ===========================================

-- Super Admin: ALL PERMISSIONS
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions WHERE is_active = TRUE;

-- Admin: Most permissions (excluding role/permission management)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions
WHERE name IN (
    -- Documents: All permissions
    'documents.view', 'documents.view_all', 'documents.create', 'documents.edit', 'documents.edit_all',
    'documents.delete', 'documents.delete_all', 'documents.share', 'documents.approve', 'documents.download',
    -- Users: All user management
    'users.view', 'users.create', 'users.edit', 'users.delete', 'users.manage_roles', 'users.suspend',
    -- Reports: All reporting
    'reports.view', 'reports.view_all', 'reports.create', 'reports.export',
    -- Settings: View and edit
    'settings.view', 'settings.edit',
    -- Audit: View and export
    'audit.view', 'audit.export'
);

-- Manager: Document management + reporting + team oversight
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 3, id FROM permissions
WHERE name IN (
    -- Documents: View all, create, edit all, delete own, share, approve, download
    'documents.view', 'documents.view_all', 'documents.create', 'documents.edit', 'documents.edit_all',
    'documents.delete', 'documents.share', 'documents.approve', 'documents.download',
    -- Users: View only
    'users.view',
    -- Reports: View all and create
    'reports.view', 'reports.view_all', 'reports.create', 'reports.export',
    -- Settings: View only
    'settings.view',
    -- Audit: View only
    'audit.view'
);

-- Employee: Basic document operations
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 4, id FROM permissions
WHERE name IN (
    -- Documents: View, create, edit own, delete own, share, download
    'documents.view', 'documents.create', 'documents.edit', 'documents.delete',
    'documents.share', 'documents.download',
    -- Reports: View own reports
    'reports.view',
    -- Settings: View only
    'settings.view'
);

-- Viewer: Read-only access
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 5, id FROM permissions
WHERE name IN (
    -- Documents: View and download only
    'documents.view', 'documents.download',
    -- Reports: View only
    'reports.view',
    -- Settings: View only
    'settings.view'
);


-- ===========================================
-- Display Summary
-- ===========================================

-- Show roles
SELECT '=== ROLES ===' AS '';
SELECT id, name, display_name, is_active FROM roles ORDER BY id;

-- Show permissions count by module
SELECT '=== PERMISSIONS BY MODULE ===' AS '';
SELECT module, COUNT(*) as permission_count FROM permissions GROUP BY module ORDER BY module;

-- Show role-permission mappings count
SELECT '=== ROLE PERMISSIONS COUNT ===' AS '';
SELECT
    r.name as role,
    r.display_name,
    COUNT(rp.permission_id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.id, r.name, r.display_name
ORDER BY r.id;
