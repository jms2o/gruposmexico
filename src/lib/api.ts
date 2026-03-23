import { supabase } from "@/integrations/supabase/client";

const ADMIN_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin`;

interface Filter {
  column: string;
  op: "eq" | "neq" | "in" | "gte" | "lte";
  value: any;
}

interface OrderBy {
  column: string;
  ascending?: boolean;
}

interface ReadOptions {
  table: string;
  select?: string;
  filters?: Filter[];
  orderBy?: OrderBy;
  limit?: number;
}

export const adminApi = {
  async call(password: string, body: { action: string; table?: string; data?: Record<string, unknown>; id?: string; items?: any[]; select?: string; filters?: Filter[]; orderBy?: OrderBy; limit?: number }) {
    const res = await fetch(ADMIN_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
        "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Error del servidor");
    return json.data;
  },

  // Admin read with service role (bypasses RLS)
  async read(password: string, options: ReadOptions) {
    return this.call(password, {
      action: "read",
      table: options.table,
      select: options.select,
      filters: options.filters,
      orderBy: options.orderBy,
      limit: options.limit,
    });
  },

  async uploadFile(password: string, file: File): Promise<{ url: string; type: string }> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(ADMIN_FUNCTION_URL, {
      method: "POST",
      headers: {
        "x-admin-password": password,
        "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: formData,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Error al subir archivo");
    return { url: json.url, type: json.type || "image" };
  },

  async uploadImage(password: string, file: File): Promise<string> {
    const result = await this.uploadFile(password, file);
    return result.url;
  },
};

// Public read helpers
export const fetchCategories = () =>
  supabase.from("categories").select("*").order("sort_order");

export const fetchVisibleCategories = () =>
  supabase.from("categories").select("*").eq("visible", true).order("sort_order");

export const fetchFeaturedGroups = () =>
  supabase.from("musical_groups").select("*").eq("featured", true).eq("visible", true).order("sort_order");

export const fetchAllGroups = () =>
  supabase.from("musical_groups").select("*").order("sort_order");

export const fetchTestimonials = () =>
  supabase.from("testimonials").select("*").order("sort_order");

export const fetchVisibleTestimonials = () =>
  supabase.from("testimonials").select("*").eq("visible", true).order("sort_order");

export const fetchFaqs = () =>
  supabase.from("faqs").select("*").order("sort_order");

export const fetchVisibleFaqs = () =>
  supabase.from("faqs").select("*").eq("visible", true).order("sort_order");

export const fetchWhatsappNumber = async () => {
  const { data } = await supabase.from("site_settings").select("value").eq("key", "whatsapp_number").single();
  return data?.value || "5216691234567";
};

export const fetchSiteContent = async (section?: string) => {
  let query = supabase.from("site_content").select("*").order("sort_order");
  if (section) query = query.eq("section", section);
  const { data } = await query;
  return data || [];
};

export const fetchSectionOrder = async () => {
  const { data } = await supabase.from("section_order").select("*").order("sort_order");
  return data || [];
};

export const fetchCustomSections = async () => {
  const { data } = await supabase.from("custom_sections").select("*").eq("visible", true).order("sort_order");
  return data || [];
};
