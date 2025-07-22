# Quick Implementation Commands

## Database Trigger Setup (Priority 1)

```sql
-- Execute in Supabase SQL Editor
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ language plpgsql security definer;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

## File Updates Required

1. Update `src/pages/JobsPage.tsx` - Fix filtering
2. Update `src/pages/LoginPage.tsx` - Add error handling  
3. Create `src/pages/NotFoundPage.tsx` - 404 page
4. Update `src/App.tsx` - Add 404 route
5. Update `src/components/JobCard.tsx` - Fix saved jobs

After implementing these fixes, the website will be production-ready with excellent user experience.