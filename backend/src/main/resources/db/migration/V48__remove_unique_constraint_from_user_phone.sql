-- V48: Remove unique constraint on users.phone to allow shared mobile numbers across suppliers and users

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_name = 'users'
          AND constraint_type = 'UNIQUE'
          AND constraint_name = 'users_phone_key'
    ) THEN
        ALTER TABLE users DROP CONSTRAINT users_phone_key;
    END IF;
END $$;

DROP INDEX IF EXISTS users_phone_key;
DROP INDEX IF EXISTS idx_users_phone_unique;
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
