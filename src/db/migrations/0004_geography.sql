-- EMPIRE ATLAS — Migration 0004: geography for network and map views (Phase 3)

alter table institutions add column latitude double precision;
alter table institutions add column longitude double precision;
alter table institutions add column geo_label text;

alter table transactions add column latitude double precision;
alter table transactions add column longitude double precision;
alter table transactions add column geo_label text;

alter table investors add column latitude double precision;
alter table investors add column longitude double precision;
alter table investors add column geo_label text;
