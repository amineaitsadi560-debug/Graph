import { supabase } from './supabase';
import type {
  Booking, BookingKind, BookingResult, BookingStatus, BlockedSlot, Customer, OpeningHour, Plan,
  Service, Settings, Slot, StaffMember, Stats,
} from './types';

export type ErrorCode =
  | 'invalid_name' | 'invalid_phone' | 'invalid_plan' | 'invalid_service' | 'invalid_input' | 'message_too_long'
  | 'outside_hours' | 'blocked' | 'too_soon' | 'too_far' | 'full' | 'duplicate' | 'too_many_pending'
  | 'invalid_transition' | 'hours_overlap' | 'owner_only' | 'user_not_found' | 'cannot_remove_self'
  | 'forbidden' | 'fk' | 'network' | 'unknown';

const KNOWN: ErrorCode[] = ['invalid_name','invalid_phone','invalid_plan','invalid_service','invalid_input','message_too_long',
  'outside_hours','blocked','too_soon','too_far','full','duplicate','too_many_pending','invalid_transition','hours_overlap',
  'owner_only','user_not_found','cannot_remove_self','forbidden'];

export class ApiError extends Error { constructor(public code: ErrorCode, public raw: string) { super(raw); } }

/** Converts a PostgREST/Supabase error into a stable code the UI can translate. */
export function toError(e: { message?: string; code?: string } | null | undefined): ApiError {
  const msg = e?.message ?? '';
  const hit = KNOWN.find((k) => msg === k || msg.startsWith(k + ':') || msg.includes(k));
  if (hit) return new ApiError(hit, msg);
  if (e?.code === '23503') return new ApiError('fk', msg);
  if (e?.code === 'PGRST116') return new ApiError('forbidden', msg);
  if (e?.code === '42501' || /permission denied|row-level security/i.test(msg)) return new ApiError('forbidden', msg);
  if (/fetch|network|failed to/i.test(msg)) return new ApiError('network', msg);
  return new ApiError('unknown', msg);
}
function ok<T>(res: { data: T | null; error: { message?: string; code?: string } | null }): T {
  if (res.error) throw toError(res.error);
  return res.data as T;
}

// ---------------- public ----------------
export async function getSettings(): Promise<Settings> {
  return ok(await supabase.from('gym_settings').select('*').eq('id', 1).single());
}
export async function getHours(): Promise<OpeningHour[]> {
  return ok(await supabase.from('opening_hours').select('*').order('weekday').order('opens_at'));
}
export async function getServices(): Promise<Service[]> {
  return ok(await supabase.from('services').select('*').order('sort_order'));
}
export async function getPublicPlans(): Promise<Plan[]> { return ok(await supabase.rpc('get_public_plans')); }
export async function getSlots(date: string): Promise<Slot[]> {
  return ok(await supabase.rpc('get_available_slots', { p_date: date }));
}
export interface BookingInput {
  full_name: string; phone: string; kind: BookingKind; plan_id: string | null; service_id: string | null;
  date: string; start: string; message: string; request_key: string;
}
export async function createBooking(i: BookingInput): Promise<BookingResult> {
  return ok(await supabase.rpc('create_booking', {
    p_full_name: i.full_name, p_phone: i.phone, p_kind: i.kind, p_plan_id: i.plan_id, p_service_id: i.service_id,
    p_date: i.date, p_start: i.start, p_message: i.message || null, p_request_key: i.request_key,
  }));
}

// ---------------- staff ----------------
export async function isStaff(): Promise<boolean> { return Boolean(ok(await supabase.rpc('is_staff'))); }
export async function isOwner(): Promise<boolean> { return Boolean(ok(await supabase.rpc('is_owner'))); }
export async function getStats(): Promise<Stats> { return ok(await supabase.rpc('dashboard_stats')); }

const BOOKING_SELECT = '*, customers(phone, full_name), membership_plans(name_fr,name_ar,name_en,price_da), services(name_fr,name_ar,name_en)';
export interface BookingFilter { from?: string; to?: string; status?: BookingStatus | 'all'; kind?: BookingKind | 'all'; search?: string; customerId?: string }
export async function listBookings(f: BookingFilter = {}): Promise<Booking[]> {
  let q = supabase.from('bookings').select(BOOKING_SELECT);
  if (f.from) q = q.gte('booking_date', f.from);
  if (f.to) q = q.lte('booking_date', f.to);
  if (f.status && f.status !== 'all') q = q.eq('status', f.status);
  if (f.kind && f.kind !== 'all') q = q.eq('kind', f.kind);
  if (f.customerId) q = q.eq('customer_id', f.customerId);
  const rows = ok(await q.order('booking_date', { ascending: false }).order('start_time', { ascending: false }).limit(500)) as unknown as Booking[];
  const s = f.search?.trim().toLowerCase();
  if (!s) return rows;
  return rows.filter((b) => b.full_name.toLowerCase().includes(s) || (b.customers?.phone ?? '').includes(s.replace(/\s/g, '')));
}
export async function setBookingStatus(id: string, status: BookingStatus) {
  ok(await supabase.from('bookings').update({ status }).eq('id', id).select('id').single());
}
export async function setBookingNote(id: string, staff_note: string) {
  ok(await supabase.from('bookings').update({ staff_note: staff_note || null }).eq('id', id).select('id').single());
}
export async function staffCreateBooking(i: Omit<BookingInput, 'request_key'>) {
  return ok(await supabase.rpc('staff_create_booking', {
    p_full_name: i.full_name, p_phone: i.phone, p_kind: i.kind, p_plan_id: i.plan_id, p_service_id: i.service_id,
    p_date: i.date, p_start: i.start, p_message: i.message || null,
  })) as BookingResult;
}
export async function listCustomers(): Promise<Customer[]> {
  return ok(await supabase.from('customers').select('*, bookings(count)').order('created_at', { ascending: false }).limit(1000)) as Customer[];
}
export async function listAllPlans(): Promise<Plan[]> {
  return ok(await supabase.from('membership_plans').select('*').order('sort_order'));
}
export async function savePlan(p: Partial<Plan> & { id?: string }) {
  const { id, ...rest } = p;
  if (id) ok(await supabase.from('membership_plans').update(rest).eq('id', id).select('id').single());
  else ok(await supabase.from('membership_plans').insert(rest).select('id').single());
}
export async function deletePlan(id: string) { ok(await supabase.from('membership_plans').delete().eq('id', id).select('id')); }
export async function listAllServices(): Promise<Service[]> {
  return ok(await supabase.from('services').select('*').order('sort_order'));
}
export async function saveService(s: Partial<Service> & { id?: string }) {
  const { id, ...rest } = s;
  if (id) ok(await supabase.from('services').update(rest).eq('id', id).select('id').single());
  else ok(await supabase.from('services').insert(rest).select('id').single());
}
export async function deleteService(id: string) { ok(await supabase.from('services').delete().eq('id', id).select('id')); }
export async function addHour(h: Omit<OpeningHour, 'id'>) { ok(await supabase.from('opening_hours').insert(h).select('id').single()); }
export async function deleteHour(id: string) { ok(await supabase.from('opening_hours').delete().eq('id', id).select('id')); }
export async function listBlocked(fromDate: string): Promise<BlockedSlot[]> {
  return ok(await supabase.from('blocked_slots').select('*').gte('block_date', fromDate).order('block_date').order('start_time'));
}
export async function addBlocked(b: Omit<BlockedSlot, 'id'>) { ok(await supabase.from('blocked_slots').insert(b).select('id').single()); }
export async function deleteBlocked(id: string) { ok(await supabase.from('blocked_slots').delete().eq('id', id).select('id')); }
export async function updateSettings(patch: Partial<Settings>) {
  ok(await supabase.from('gym_settings').update(patch).eq('id', 1).select('id').single());
}
export async function listStaff(): Promise<StaffMember[]> { return ok(await supabase.rpc('list_staff')); }
export async function addStaff(email: string, name: string, role: 'owner' | 'employee') {
  ok(await supabase.rpc('add_staff', { p_email: email, p_name: name, p_role: role }));
}
export async function removeStaff(userId: string) { ok(await supabase.rpc('remove_staff', { p_user: userId })); }
