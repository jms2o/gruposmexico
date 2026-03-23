import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchCategories, fetchVisibleCategories, fetchFeaturedGroups,
  fetchTestimonials, fetchVisibleTestimonials, fetchFaqs, fetchVisibleFaqs,
  fetchWhatsappNumber, fetchAllGroups, fetchSiteContent, fetchSectionOrder,
  fetchCustomSections,
} from "@/lib/api";

export const useCategories = () =>
  useQuery({ queryKey: ["categories"], queryFn: async () => { const { data } = await fetchCategories(); return data || []; } });

export const useVisibleCategories = () =>
  useQuery({ queryKey: ["visible-categories"], queryFn: async () => { const { data } = await fetchVisibleCategories(); return data || []; } });

export const useFeaturedGroups = () =>
  useQuery({ queryKey: ["featured-groups"], queryFn: async () => { const { data } = await fetchFeaturedGroups(); return data || []; } });

export const useAllGroups = () =>
  useQuery({ queryKey: ["all-groups"], queryFn: async () => { const { data } = await fetchAllGroups(); return data || []; } });

export const useGroupById = (id: string | undefined) =>
  useQuery({
    queryKey: ["group", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase.from("musical_groups").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id && id !== ":id",
  });

export const useTestimonials = () =>
  useQuery({ queryKey: ["testimonials"], queryFn: async () => { const { data } = await fetchTestimonials(); return data || []; } });

export const useVisibleTestimonials = () =>
  useQuery({ queryKey: ["visible-testimonials"], queryFn: async () => { const { data } = await fetchVisibleTestimonials(); return data || []; } });

export const useFaqs = () =>
  useQuery({ queryKey: ["faqs"], queryFn: async () => { const { data } = await fetchFaqs(); return data || []; } });

export const useVisibleFaqs = () =>
  useQuery({ queryKey: ["visible-faqs"], queryFn: async () => { const { data } = await fetchVisibleFaqs(); return data || []; } });

export const useWhatsappNumber = () =>
  useQuery({ queryKey: ["whatsapp-number"], queryFn: fetchWhatsappNumber });

export const useGroupPhotos = (groupId: string | undefined) =>
  useQuery({
    queryKey: ["group-photos", groupId],
    queryFn: async () => {
      if (!groupId) return [];
      const { data } = await supabase.from("group_photos").select("*").eq("group_id", groupId).order("sort_order");
      return data || [];
    },
    enabled: !!groupId,
  });

export const useGroupVideos = (groupId: string | undefined) =>
  useQuery({
    queryKey: ["group-videos", groupId],
    queryFn: async () => {
      if (!groupId) return [];
      const { data } = await supabase.from("group_videos").select("*").eq("group_id", groupId).order("sort_order");
      return data || [];
    },
    enabled: !!groupId,
  });

export const useSiteContent = (section?: string) =>
  useQuery({
    queryKey: ["site-content", section],
    queryFn: () => fetchSiteContent(section),
  });

export const useSectionOrder = () =>
  useQuery({ queryKey: ["section-order"], queryFn: fetchSectionOrder });

export const useCustomSections = () =>
  useQuery({ queryKey: ["custom-sections"], queryFn: fetchCustomSections });

export const useGroupMedia = (groupProfileId: string | undefined) =>
  useQuery({
    queryKey: ["group-media", groupProfileId],
    queryFn: async () => {
      if (!groupProfileId) return [];
      const { data } = await supabase.from("group_media").select("*").eq("group_profile_id", groupProfileId).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!groupProfileId,
  });
