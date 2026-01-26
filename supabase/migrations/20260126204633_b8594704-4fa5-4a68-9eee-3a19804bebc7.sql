-- Add foreign key constraint for patient_notes.created_by to profiles table
ALTER TABLE public.patient_notes
ADD CONSTRAINT patient_notes_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;