INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'materials', 'materials', false, 52428800,
  ARRAY['application/pdf','image/jpeg','image/png','application/zip',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "materials_storage_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'materials' AND (public.has_paid_access() OR public.is_admin()));

CREATE POLICY "materials_storage_insert_admin"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'materials' AND public.is_admin());

CREATE POLICY "materials_storage_delete_admin"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'materials' AND public.is_admin());
