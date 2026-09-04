-- V46: Add password_changed_at to users table for server-side JWT session invalidation
ALTER TABLE users
ADD COLUMN password_changed_at TIMESTAMP WITH TIME ZONE;
