-- Create shared visibility enum type
CREATE TYPE public.visibility_type AS ENUM (
    'private',      -- Only owner can access
    'public',       -- Anyone can access
    'team',         -- Team members can access
    'shared',       -- Specific users can access
    'unlisted'      -- Accessible via link only
);
