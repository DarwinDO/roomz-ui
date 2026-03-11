const fs = require('fs');
const { Client } = require('pg');

const sql = fs.readFileSync('e:/RoomZ/roomz-ui/supabase/migrations/20260311123000_roommate_scoring_phase_2.sql', 'utf8');
const version = '20260311123000';
const password = process.env.SUPABASE_DB_PASSWORD;
const host = 'db.vevnoxlgwisdottaifdn.supabase.co';

if (!password) {
  throw new Error('SUPABASE_DB_PASSWORD is not set');
}

const client = new Client({
  host,
  port: 5432,
  user: 'postgres',
  password,
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
});

(async () => {
  await client.connect();
  const check = await client.query(
    'select exists(select 1 from supabase_migrations.schema_migrations where version = $1) as applied',
    [version],
  );

  if (!check.rows[0].applied) {
    await client.query('begin');
    await client.query(sql);
    await client.query(
      'insert into supabase_migrations.schema_migrations(version, name, statements) values ($1, $2, array[]::text[])',
      [version, 'roommate_scoring_phase_2'],
    );
    await client.query('commit');
  }

  const verify = await client.query(`
    with base_user as (
      select user_id
      from public.roommate_profiles
      where status = 'looking'
      order by updated_at desc nulls last, created_at desc
      limit 1
    )
    select
      exists(select 1 from pg_proc where proname = 'calculate_compatibility_score') as score_fn_exists,
      exists(select 1 from pg_proc where proname = 'get_roommate_matches') as matches_fn_exists,
      (select version from supabase_migrations.schema_migrations where version = $1 limit 1) as applied_version,
      (
        select json_build_object(
          'matched_user_id', matched_user_id,
          'compatibility_score', compatibility_score,
          'confidence_score', confidence_score,
          'sleep_score', sleep_score,
          'noise_score', noise_score,
          'budget_score', budget_score,
          'hobby_score', hobby_score,
          'move_in_score', move_in_score,
          'location_score', location_score
        )
        from public.get_roommate_matches((select user_id from base_user), 1)
        limit 1
      ) as sample_match
  `, [version]);

  console.log(JSON.stringify(verify.rows[0], null, 2));
  await client.end();
})().catch(async (error) => {
  console.error(error);
  try {
    await client.query('rollback');
    await client.end();
  } catch {}
  process.exit(1);
});
