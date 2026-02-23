-- Seed site_content with current hardcoded content from frontend pages

INSERT INTO site_content (page, section, content_key, content_en, content_type) VALUES
-- HOME PAGE
('home', 'hero', 'title', 'Where Little Minds Grow Big', 'text'),
('home', 'hero', 'subtitle', 'A dual-language early learning center with curriculum-based education in Edgewater, NJ', 'text'),
('home', 'hero', 'cta_primary', 'Schedule a Tour', 'text'),
('home', 'hero', 'cta_secondary', 'Our Programs', 'text'),
('home', 'features', 'heading', 'Why Choose Scribbles?', 'text'),
('home', 'features', 'subheading', 'An early learning center, not just childcare', 'text'),
('home', 'programs_section', 'heading', 'Our Programs', 'text'),
('home', 'programs_section', 'subheading', 'Age-appropriate learning experiences for every stage', 'text'),
('home', 'testimonials', 'heading', 'What Parents Say', 'text'),
('home', 'testimonials', 'subheading', 'Real stories from our Scribbles family', 'text'),
('home', 'cta', 'heading', 'Ready to Join Our Family?', 'text'),
('home', 'cta', 'body', 'Schedule a tour and see why families have trusted Scribbles since 2008!', 'text'),

-- ABOUT PAGE
('about', 'hero', 'title', 'About Us', 'text'),
('about', 'hero', 'subtitle', 'Learn about our story, mission, and the dedicated team behind Scribbles', 'text'),
('about', 'story', 'heading', 'The Scribbles Difference', 'text'),
('about', 'story', 'subheading', 'Nurturing Young Minds Since 2008', 'text'),
('about', 'story', 'body_1', 'Scribbles Learning Center is a family-owned childcare facility dedicated to providing a safe, loving, and educational environment for children. Founded in 2008, we''ve spent over 17 years caring for the children of Edgewater and surrounding communities, becoming a trusted partner for hundreds of families.', 'text'),
('about', 'story', 'body_2', 'With a capacity of 45 children, we maintain an intimate, family-like atmosphere where every child receives the individual attention they deserve. Our experienced staff knows each child by name and works closely with parents to support their child''s unique development journey.', 'text'),
('about', 'stats', 'founded', '2008', 'text'),
('about', 'stats', 'capacity', '45', 'text'),
('about', 'stats', 'families', '500+', 'text'),
('about', 'stats', 'years', '17+', 'text'),
('about', 'mission', 'heading', 'Our Mission & Values', 'text'),
('about', 'mission', 'subheading', 'The principles that guide everything we do', 'text'),
('about', 'mission', 'body', 'Our mission is to create a nurturing home away from home where every child can learn, grow, and thrive. We believe every child is unique and deserves individualized attention to reach their full potential.', 'text'),
('about', 'healthcare', 'heading', 'Healthcare Network On-Site', 'text'),
('about', 'healthcare', 'subtitle', 'Convenient access to pediatric care', 'text'),
('about', 'healthcare', 'body', 'One of the unique advantages of Scribbles Learning Center is our location within a healthcare network. We share our building with trusted medical professionals, providing parents with convenient access to healthcare services for their children.', 'text'),

-- CONTACT PAGE
('contact', 'hero', 'title', 'Contact Us', 'text'),
('contact', 'hero', 'subtitle', 'We''d love to hear from you! Schedule a tour or ask us a question.', 'text'),
('contact', 'info', 'address', '725 River Rd, Suite 103', 'text'),
('contact', 'info', 'city', 'Edgewater', 'text'),
('contact', 'info', 'state', 'NJ', 'text'),
('contact', 'info', 'zip', '07020', 'text'),
('contact', 'info', 'phone', '(201) 945-9445', 'text'),
('contact', 'info', 'mobile', '(201) 957-9779', 'text'),
('contact', 'info', 'email', 'info@scribbleslearning.com', 'text'),
('contact', 'info', 'hours_weekday', '7:30 AM - 6:30 PM', 'text'),
('contact', 'info', 'hours_weekend', 'Closed', 'text'),
('contact', 'cta', 'heading', 'Prefer to Talk?', 'text'),
('contact', 'cta', 'body', 'Give us a call and we''ll be happy to answer your questions!', 'text'),

-- CAREERS PAGE
('careers', 'hero', 'title', 'Join Our Team', 'text'),
('careers', 'hero', 'subtitle', 'Build your career while making a difference in children''s lives', 'text'),
('careers', 'intro', 'heading', 'Why Work at Scribbles?', 'text'),
('careers', 'intro', 'body', 'At Scribbles Learning Center, we believe that happy teachers create happy classrooms. We invest in our staff because we know that when our team thrives, our children thrive. Join a supportive, family-like environment where your passion for early childhood education is valued and nurtured.', 'text'),
('careers', 'cta', 'heading', 'Ready to Make a Difference?', 'text'),
('careers', 'cta', 'body', 'Join our team of passionate educators and help shape young minds', 'text'),

-- CURRICULUM PAGE
('curriculum', 'hero', 'title', 'Our Curriculum', 'text'),
('curriculum', 'hero', 'subtitle', 'A comprehensive, dual-language approach to early childhood education', 'text'),
('curriculum', 'intro', 'heading', 'An Early Learning Center, Not Just Childcare', 'text'),
('curriculum', 'intro', 'body', 'At Scribbles Learning Center, we are an early learning facility with curriculum implemented from infancy through pre-kindergarten. Our approach combines proven educational frameworks with a nurturing environment, preparing children for academic success while fostering their natural curiosity and love of learning.', 'text'),
('curriculum', 'dual_language', 'heading', 'Dual-Language Learning Center', 'text'),
('curriculum', 'dual_language', 'subtitle', 'English and Spanish instruction throughout our curriculum', 'text')

ON CONFLICT (page, section, content_key) DO NOTHING;
