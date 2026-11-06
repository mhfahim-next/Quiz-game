-- Public bucket for question / category images. Anyone can read; only admins write.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('quiz-images', 'quiz-images', true, 2097152,
        array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "quiz-images: public read" on storage.objects for select
  using (bucket_id = 'quiz-images');
create policy "quiz-images: admin insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'quiz-images' and public.is_admin());
create policy "quiz-images: admin update" on storage.objects for update to authenticated
  using (bucket_id = 'quiz-images' and public.is_admin());
create policy "quiz-images: admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'quiz-images' and public.is_admin());
