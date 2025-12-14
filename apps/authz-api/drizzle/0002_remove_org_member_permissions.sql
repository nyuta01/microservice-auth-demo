-- Migration: Remove org:member permissions
-- org:member should not have console access (no org-level permissions)

DELETE FROM "role_permissions" WHERE "role_id" = 'org:member';
