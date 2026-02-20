-- Add Pre-Kindergarten program between Preschool and Summer Camp

-- First, bump Summer Camp's sort_order to make room
UPDATE programs SET sort_order = 5 WHERE slug = 'summer-camp';

-- Insert Pre-Kindergarten program
INSERT INTO programs (name, slug, age_range, description, features, image_url, color, sort_order)
VALUES (
  'Pre-Kindergarten',
  'pre-k',
  '4–5 years',
  'Comprehensive kindergarten readiness through our curriculum-based approach. Children develop literacy, math, science, and social-emotional skills needed for academic success. Our program ensures your child is fully prepared for their educational journey ahead.',
  '["Kindergarten readiness curriculum", "Advanced literacy and math concepts", "Science experiments and discovery", "Creative arts and dramatic play", "Aligned with NJ Preschool Standards", "Kindergarten readiness assessment"]',
  'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800',
  '#768E78',
  4
);
