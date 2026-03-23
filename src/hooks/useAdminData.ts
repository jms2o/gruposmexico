import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";

interface Filter {
  column: string;
  op: "eq" | "neq" | "in" | "gte" | "lte";
  value: any;
}

interface OrderBy {
  column: string;
  ascending?: boolean;
}

interface UseAdminDataOptions {
  table: string;
  select?: string;
  filters?: Filter[];
  orderBy?: OrderBy;
  limit?: number;
  enabled?: boolean;
}

export function useAdminData<T = any>(
  password: string,
  key: string,
  options: UseAdminDataOptions
) {
  return useQuery<T[]>({
    queryKey: ["admin", key, options],
    queryFn: async () => {
      if (!password) return [];
      return adminApi.read(password, options);
    },
    enabled: !!password && (options.enabled ?? true),
  });
}

// Specific hooks for common admin data
export function useAdminBookings(password: string) {
  return useAdminData(password, "bookings", {
    table: "bookings",
    select: "*, group_profiles(group_name, city)",
    orderBy: { column: "created_at", ascending: false },
  });
}

export function useAdminGroupProfiles(password: string) {
  return useAdminData(password, "group-profiles", {
    table: "group_profiles",
    select: "*, group_memberships(status, plan_id, membership_plans(name, tier))",
    orderBy: { column: "created_at", ascending: false },
  });
}

export function useAdminEventRequests(password: string) {
  return useAdminData(password, "event-requests", {
    table: "event_requests",
    orderBy: { column: "created_at", ascending: false },
  });
}

export function useAdminMemberships(password: string) {
  return useAdminData(password, "memberships", {
    table: "group_memberships",
    select: "*, group_profiles(group_name), membership_plans(name, tier)",
    orderBy: { column: "created_at", ascending: false },
  });
}

export function useAdminCommissions(password: string) {
  return useAdminData(password, "commissions", {
    table: "commission_history",
    orderBy: { column: "created_at", ascending: false },
  });
}

export function useAdminNotifications(password: string) {
  return useAdminData(password, "notifications", {
    table: "admin_notifications",
    select: "*, group_profiles(group_name)",
    orderBy: { column: "created_at", ascending: false },
    limit: 100,
  });
}

export function useAdminContentSubmissions(password: string, status?: string) {
  return useAdminData(password, `submissions-${status || "all"}`, {
    table: "content_submissions",
    select: "*, group_profiles(group_name)",
    filters: status ? [{ column: "status", op: "eq", value: status }] : undefined,
    orderBy: { column: "created_at", ascending: false },
  });
}

export function useAdminProposals(password: string) {
  return useAdminData(password, "proposals", {
    table: "event_proposals",
    select: "*, group_profiles(group_name), event_requests(client_name, event_type, city, event_date, budget)",
    orderBy: { column: "created_at", ascending: false },
  });
}

export function useAdminGroupMedia(password: string, type?: string) {
  return useAdminData(password, `media-${type || "all"}`, {
    table: "group_media",
    select: "*, group_profiles(group_name)",
    filters: type ? [{ column: "type", op: "eq", value: type }] : undefined,
    orderBy: { column: "created_at", ascending: false },
  });
}

export function useAdminMembershipPlans(password: string) {
  return useAdminData(password, "plans", {
    table: "membership_plans",
    orderBy: { column: "sort_order", ascending: true },
  });
}

export function useAdminUserRoles(password: string) {
  return useAdminData(password, "user-roles", {
    table: "user_roles",
    orderBy: { column: "id", ascending: true },
  });
}
