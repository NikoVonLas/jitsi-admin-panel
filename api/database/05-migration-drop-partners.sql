-- -----------------------------------------------------------------------------
-- 05-MIGRATION-DROP-PARTNERS.SQL
-- -----------------------------------------------------------------------------
-- Drops partner/invite tables (room_partner, room_partner_candidate,
-- room_invite, domain_partner, domain_partner_candidate, domain_invite).
--
-- Usage:
--     psql -U jitsi -h postgres -d jitsi -e -f 05-migration-drop-partners.sql
-- -----------------------------------------------------------------------------

BEGIN;

DROP TABLE IF EXISTS room_invite CASCADE;
DROP TABLE IF EXISTS room_partner_candidate CASCADE;
DROP TABLE IF EXISTS room_partner CASCADE;
DROP TABLE IF EXISTS domain_invite CASCADE;
DROP TABLE IF EXISTS domain_partner_candidate CASCADE;
DROP TABLE IF EXISTS domain_partner CASCADE;

COMMIT;
