# Supabase Setup Guide

## Quick Start

### 1. Run Migrations

Go to **Supabase Dashboard** > **SQL Editor** > **New Query**

Copy and paste the contents of `migrations/001_rpc_functions.sql` and click **Run**.

### 2. Verify Setup

After running, you should see:
- RPC functions: `increment_favorite_count`, `decrement_favorite_count`, `increment_view_count`
- RLS policies on: `favorites`, `rooms`, `users`, `bookings`, `messages`

### 3. Test Functions

```sql
-- Test increment_favorite_count
SELECT increment_favorite_count('your-room-uuid-here');

-- Test increment_view_count  
SELECT increment_view_count('your-room-uuid-here');
```

## Environment Variables

Make sure these are set in your `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Troubleshooting

### Error: "Could not find the function"
Run the SQL migration again or check if the function exists:
```sql
SELECT * FROM pg_proc WHERE proname LIKE '%favorite%';
```

### Error: "Permission denied"
Check RLS policies are enabled and correct:
```sql
SELECT * FROM pg_policies WHERE tablename = 'favorites';
```
