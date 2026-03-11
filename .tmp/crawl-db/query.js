const { Client } = require('pg');
const password = process.env.SUPABASE_DB_PASSWORD;
const host = 'db.vevnoxlgwisdottaifdn.supabase.co';
const client = new Client({ host, port: 5432, user: 'postgres', password, database: 'postgres', ssl: { rejectUnauthorized: false } });
(async () => {
  await client.connect();
  const job = await client.query(`
    select id, source_name, source_url, status, total_count, inserted_count, ready_count, duplicate_count, error_count, skipped_count, error_message, log, created_at
    from public.crawl_jobs
    where source_url like '%topbrands.vn/top-dich-vu-chuyen-nha-tro-sinh-vien-tot-nhat-tai-tphcm%'
       or source_name ilike '%Thành Ph? H? Chí Minh%'
    order by created_at desc
    limit 5
  `);
  const rows = await client.query(`
    select id, source_name, source_url, company_name, email, phone, website, review_status, import_error, created_at
    from public.partner_crawl_ingestions
    where source_url like '%topbrands.vn/top-dich-vu-chuyen-nha-tro-sinh-vien-tot-nhat-tai-tphcm%'
       or source_name ilike '%Thành Ph? H? Chí Minh%'
    order by created_at desc
    limit 20
  `);
  console.log(JSON.stringify({ jobs: job.rows, ingestions: rows.rows }, null, 2));
  await client.end();
})().catch(async (error) => { console.error(error); try { await client.end(); } catch {} process.exit(1); });
