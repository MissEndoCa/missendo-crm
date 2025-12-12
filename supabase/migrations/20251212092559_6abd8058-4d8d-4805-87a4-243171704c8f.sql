-- Add star_rating and room type prices to hotels table
ALTER TABLE public.hotels
ADD COLUMN star_rating integer DEFAULT 3,
ADD COLUMN single_room_price numeric,
ADD COLUMN double_room_price numeric,
ADD COLUMN family_room_price numeric;

-- Add comment for clarity
COMMENT ON COLUMN public.hotels.star_rating IS 'Hotel star rating (1-5)';
COMMENT ON COLUMN public.hotels.single_room_price IS 'Price per night for single room';
COMMENT ON COLUMN public.hotels.double_room_price IS 'Price per night for double room';
COMMENT ON COLUMN public.hotels.family_room_price IS 'Price per night for family room';