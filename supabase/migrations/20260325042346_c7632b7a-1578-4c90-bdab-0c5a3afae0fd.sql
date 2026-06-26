INSERT INTO public.user_roles (user_id, role)
SELECT 'e14d7f2d-ca61-408e-97cf-7b971df6daf8', 'admin'::app_role
WHERE EXISTS (
  SELECT 1 FROM auth.users WHERE id = 'e14d7f2d-ca61-408e-97cf-7b971df6daf8'
)
ON CONFLICT (user_id, role) DO NOTHING;