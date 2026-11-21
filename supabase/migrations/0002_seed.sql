-- Initial data. Prices come from the price-board photo supplied by the owner.
-- They are stored but NOT shown publicly until the owner confirms them in the dashboard
-- (Manage → Prices → "Confirm and publish prices").
-- Cardio prices were unreadable in the photo, so they are left empty (NULL) on purpose.
insert into public.gym_settings (id, rating_value, rating_count) values (1, 4.5, 30) on conflict (id) do nothing;

insert into public.membership_plans (category, name_fr, name_ar, name_en, detail_fr, detail_ar, detail_en, price_da, is_featured, sort_order) values
 ('musculation','Séance unique','حصة واحدة','Single session','1 séance','حصة واحدة','1 session',250,false,10),
 ('musculation','2 séances / semaine','حصتان في الأسبوع','2 sessions / week','2 séances par semaine','حصتان في الأسبوع','2 sessions per week',1600,false,20),
 ('musculation','3 séances / semaine','3 حصص في الأسبوع','3 sessions / week','3 séances par semaine','3 حصص في الأسبوع','3 sessions per week',1800,false,30),
 ('musculation','4 séances / semaine','4 حصص في الأسبوع','4 sessions / week','4 séances par semaine','4 حصص في الأسبوع','4 sessions per week',2000,false,40),
 ('musculation','Illimité','غير محدود','Unlimited','Accès illimité','دخول غير محدود','Unlimited access',2600,true,50),
 ('musculation','Offre spéciale 3 mois','عرض خاص 3 أشهر','Special 3-month offer','Offre de 3 mois','عرض لمدة 3 أشهر','3-month offer',5000,true,60),
 ('cardio','Cardio · Tapis de course','كارديو · جهاز الجري','Cardio · Treadmill','Forfait tapis de course','باقة جهاز الجري','Treadmill package',null,false,70),
 ('cardio','Cardio · Vélo','كارديو · دراجة','Cardio · Bike','Forfait vélo','باقة الدراجة','Bike package',null,false,80);

insert into public.services (name_fr, name_ar, name_en, sort_order) values
 ('Séance de musculation','حصة بناء الأجسام','Strength-training session',10),
 ('Séance de cardio','حصة كارديو','Cardio session',20),
 ('Visite et découverte de la salle','زيارة واكتشاف القاعة','Gym visit & tour',30);
-- opening_hours is intentionally empty: configure real hours in the dashboard (Manage → Hours).
