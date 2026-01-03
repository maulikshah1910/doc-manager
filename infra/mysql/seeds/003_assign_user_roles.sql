-- Seed: Assign Roles to Users
-- Created: 2026-01-03
-- Description: Assign appropriate roles to the seeded users
-- Note: This seed should run after 001_seed_users.sql and 002_seed_rbac.sql

-- ===========================================
-- Assign Roles to Users
-- ===========================================

-- User 1: admin@example.com -> Super Admin (role_id = 1)
UPDATE users SET role_id = 1 WHERE id = 1;

-- User 2: maulik@example.com -> Super Admin (role_id = 1)
UPDATE users SET role_id = 1 WHERE id = 2;

-- User 3: manager@example.com -> Manager (role_id = 3)
UPDATE users SET role_id = 3 WHERE id = 3;

-- User 4: employee@example.com -> Employee (role_id = 4)
UPDATE users SET role_id = 4 WHERE id = 4;

-- User 5: john.doe@example.com -> Employee (role_id = 4)
UPDATE users SET role_id = 4 WHERE id = 5;

-- User 6: jane.smith@example.com -> Viewer (role_id = 5)
UPDATE users SET role_id = 5 WHERE id = 6;


-- ===========================================
-- Display Users with Roles
-- ===========================================

SELECT '=== USERS WITH ROLES ===' AS '';
SELECT
    u.id,
    CONCAT(u.first_name, ' ', u.last_name) AS name,
    u.email,
    r.display_name AS role,
    u.status,
    u.created_at
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
WHERE u.id IN (1, 2, 3, 4, 5, 6)
ORDER BY u.id;

-- Display user permissions summary
SELECT '=== USER PERMISSIONS SUMMARY ===' AS '';
SELECT
    u.email,
    r.display_name as role,
    COUNT(rp.permission_id) as permission_count
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
WHERE u.id IN (1, 2, 3, 4, 5, 6)
GROUP BY u.id, u.email, r.display_name
ORDER BY u.id;
