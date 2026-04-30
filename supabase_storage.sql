-- ============================================================
-- FinFlow — Criar Bucket de Avatares (Upload de Foto)
-- Executar no Supabase Dashboard → SQL Editor
-- ============================================================

-- Cria o bucket 'avatars' (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Configura as permissões (RLS) para o bucket
CREATE POLICY "Public Access"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'avatars' );

CREATE POLICY "Users can upload their own avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatars"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
  );
