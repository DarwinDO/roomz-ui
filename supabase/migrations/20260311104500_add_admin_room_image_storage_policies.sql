drop policy if exists "Admins can upload room images" on storage.objects;
drop policy if exists "Admins can update room images" on storage.objects;
drop policy if exists "Admins can delete room images" on storage.objects;

create policy "Admins can upload room images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'room-images'
  and public.is_admin()
);

create policy "Admins can update room images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'room-images'
  and public.is_admin()
)
with check (
  bucket_id = 'room-images'
  and public.is_admin()
);

create policy "Admins can delete room images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'room-images'
  and public.is_admin()
);
