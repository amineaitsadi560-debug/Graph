export type Lang = 'fr' | 'ar' | 'en';
export type Audience = 'all' | 'women' | 'men';
export type BookingStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'completed';
export type BookingKind = 'registration' | 'session';

export interface Settings {
  gym_name: string; phone: string; address: string; maps_url: string;
  rating_value: number | null; rating_count: number | null;
  prices_confirmed: boolean; slot_minutes: number; slot_capacity: number;
  min_notice_minutes: number; max_advance_days: number;
}
export interface OpeningHour { id: string; weekday: number; opens_at: string; closes_at: string; audience: Audience }
export interface Localized { name_fr: string; name_ar: string; name_en: string }
export interface Service extends Localized { id: string; sort_order: number; is_active: boolean }
export interface Plan extends Localized {
  id: string; category: 'musculation' | 'cardio';
  detail_fr: string | null; detail_ar: string | null; detail_en: string | null;
  price_da: number | null; is_featured: boolean; sort_order: number; is_active?: boolean;
}
export interface Slot { slot_start: string; slot_end: string; audience: Audience; remaining: number; status: string }
export interface BlockedSlot { id: string; block_date: string; start_time: string | null; end_time: string | null; reason: string | null }
export interface Customer { id: string; full_name: string; phone: string; created_at: string; bookings?: { count: number }[] }
export interface Booking {
  id: string; customer_id: string; full_name: string; kind: BookingKind;
  plan_id: string | null; service_id: string | null;
  booking_date: string; start_time: string; end_time: string; audience: Audience;
  status: BookingStatus; message: string | null; staff_note: string | null; created_at: string;
  customers?: { phone: string; full_name: string } | null;
  membership_plans?: (Localized & { price_da: number | null }) | null;
  services?: Localized | null;
}
export interface StaffMember { user_id: string; email: string; display_name: string; role: 'owner' | 'employee' }
export interface Stats {
  total_customers: number; pending: number; confirmed: number; upcoming: number; today: number; completed: number;
  by_plan: { plan_id: string; total: number; active: number }[];
}
export interface BookingResult { ref: string; status: BookingStatus; date: string; start: string; end: string; duplicate: boolean }
