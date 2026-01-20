
-- Restore Global Superadmin Access for stigmagnebrekken@gmail.com

-- 1. Ensure org_admin is present for 'test-forening' (Already seems to be there, but safe to keep)
INSERT INTO user_org_access (user_id, organization_id, role)
SELECT 
    auth.users.id,
    organizations.id,
    'org_admin'
FROM auth.users, organizations
WHERE auth.users.email = 'stigmagnebrekken@gmail.com'
AND organizations.slug = 'test-forening'
ON CONFLICT (user_id, organization_id) 
DO UPDATE SET role = 'org_admin';

-- 2. Restore Global Superadmin Access (organization_id is NULL)
INSERT INTO user_org_access (user_id, organization_id, role)
SELECT 
    auth.users.id,
    NULL, -- Global access
    'superadmin'
FROM auth.users
WHERE auth.users.email = 'stigmagnebrekken@gmail.com'
ON CONFLICT (user_id, organization_id) WHERE organization_id IS NULL
DO UPDATE SET role = 'superadmin';
