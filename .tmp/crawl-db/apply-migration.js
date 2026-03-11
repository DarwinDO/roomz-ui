const fs = require('fs');
const { Client } = require('pg');
const sql = fs.readFileSync('e:/RoomZ/roomz-ui/supabase/migrations/20260311050000_improve_crawl_dedupe_and_debug.sql', 'utf8');
const version = '20260311050000';
const password = process.env.SUPABASE_DB_PASSWORD;
const host = 'db.vevnoxlgwisdottaifdn.supabase.co';
const client = new Client({ host, port: 5432, user: 'postgres', password, database: 'postgres', ssl: { rejectUnauthorized: false } });
(async () => {
  await client.connect();
  const check = await client.query("select exists(select 1 from supabase_migrations.schema_migrations where version = $1) as applied", [version]);
  if (!check.rows[0].applied) {
    await client.query('begin');
    await client.query(sql);
    await client.query('insert into supabase_migrations.schema_migrations(version, name, statements) values ($1, $2, array[]::text[])', [version, 'improve_crawl_dedupe_and_debug']);
    await client.query('commit');
  }
  const verify = await client.query(`
    select
      exists(select 1 from pg_indexes where schemaname='public' and indexname='idx_partner_crawl_ingestions_source_url') as old_partner_source_url_index_exists,
      exists(select 1 from pg_indexes where schemaname='public' and indexname='idx_partner_crawl_ingestions_source_url_lookup') as new_partner_source_url_index_exists,
      exists(select 1 from pg_indexes where schemaname='public' and indexname='idx_location_crawl_ingestions_source_url') as old_location_source_url_index_exists,
      exists(select 1 from pg_indexes where schemaname='public' and indexname='idx_location_crawl_ingestions_source_url_lookup') as new_location_source_url_index_exists,
      exists(select 1 from information_schema.columns where table_schema='public' and table_name='partner_crawl_ingestions' and column_name='crawl_job_id') as partner_job_link_exists,
      exists(select 1 from information_schema.columns where table_schema='public' and table_name='location_crawl_ingestions' and column_name='crawl_job_id') as location_job_link_exists,
      exists(
        select 1
        from pg_constraint
        where conname = 'partner_crawl_ingestions_review_status_check'
          and pg_get_constraintdef(oid) ilike '%low_confidence%'
      ) as partner_low_confidence_status_exists
  `);
  console.log(JSON.stringify(verify.rows[0], null, 2));
  await client.end();
})().catch(async (error) => { console.error(error); try { await client.query('rollback'); await client.end(); } catch {} process.exit(1); });
