-- -----------------------------------------------------------------------------
-- 01-CREATE-JITSI-DATABASE.SQL
-- -----------------------------------------------------------------------------
-- This script creates the database and the database user.
-- Tested on Postgresql 15.
--
-- The installer doesn't use this script to create the database. It run its own
-- commands to create this database with a random password.
--
-- Usage:
--     su -l postgres -c "psql -e -f /tmp/01-create-jitsi-database.sql"
--
-- -----------------------------------------------------------------------------


-- -----------------------------------------------------------------------------
-- USERS
-- -----------------------------------------------------------------------------
CREATE ROLE jitsi WITH LOGIN;
ALTER ROLE jitsi WITH PASSWORD 'jitsi';

-- -----------------------------------------------------------------------------
-- DATABASE
-- -----------------------------------------------------------------------------
CREATE DATABASE jitsi WITH
    TEMPLATE template0
    OWNER jitsi
    ENCODING 'UTF-8'
    LC_COLLATE 'en_US.UTF-8'
    LC_CTYPE 'en_US.UTF-8';
