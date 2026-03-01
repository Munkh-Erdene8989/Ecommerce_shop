-- Popup цонхны тохиргоо (store_settings key='popup')
INSERT INTO public.store_settings (key, value)
VALUES (
  'popup',
  '{"enabled":false,"title":"","message":"","image_url":"","cta_text":"","cta_url":""}'::jsonb
)
ON CONFLICT (key) DO NOTHING;
