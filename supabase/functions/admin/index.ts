import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-password, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

function checkAuth(req: Request) {
  const adminPassword = Deno.env.get("ADMIN_PASSWORD");
  const reqPassword = req.headers.get("x-admin-password");
  if (!reqPassword || reqPassword !== adminPassword) {
    return false;
  }
  return true;
}

function requireAuth(req: Request) {
  if (!checkAuth(req)) {
    throw new Error("No autorizado");
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    
    if (!contentType.includes("multipart/form-data")) {
      const body = await req.clone().json().catch(() => ({}));
      if (body.action === "create_membership") {
        // Allow - no admin check needed for membership creation
      } else {
        requireAuth(req);
      }
    } else {
      requireAuth(req);
    }
    
    const supabase = getSupabase();

    // Handle file upload (multipart)
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File;
      if (!file) throw new Error("No file provided");

      const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
      const fileName = `${crypto.randomUUID()}.${ext}`;

      const isVideo = file.type.startsWith("video/") || ["mp4", "webm", "mov", "avi"].includes(ext);
      const bucket = isVideo ? "videos" : "images";
      const filePath = `uploads/${fileName}`;

      const arrayBuffer = await file.arrayBuffer();
      const { error } = await supabase.storage
        .from(bucket)
        .upload(filePath, arrayBuffer, {
          contentType: file.type,
          upsert: false,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return new Response(
        JSON.stringify({ url: urlData.publicUrl, bucket, type: isVideo ? "video" : "image" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle JSON actions (CRUD)
    const { action, table, data, id, items, select, filters, orderBy, limit } = await req.json();
    let result;

    switch (action) {
      case "read": {
        // Admin read - bypasses RLS using service role
        let query = supabase.from(table).select(select || "*");
        
        // Apply filters
        if (filters) {
          for (const f of filters) {
            if (f.op === "eq") query = query.eq(f.column, f.value);
            else if (f.op === "neq") query = query.neq(f.column, f.value);
            else if (f.op === "in") query = query.in(f.column, f.value);
            else if (f.op === "gte") query = query.gte(f.column, f.value);
            else if (f.op === "lte") query = query.lte(f.column, f.value);
          }
        }
        
        // Apply ordering
        if (orderBy) {
          query = query.order(orderBy.column, { ascending: orderBy.ascending ?? false });
        } else {
          query = query.order("created_at", { ascending: false });
        }
        
        // Apply limit
        if (limit) {
          query = query.limit(limit);
        }
        
        result = await query;
        break;
      }
      case "insert":
        result = await supabase.from(table).insert(data).select();
        break;
      case "update":
        result = await supabase.from(table).update(data).eq("id", id).select();
        break;
      case "upsert_setting":
        result = await supabase
          .from("site_settings")
          .upsert({ key: data.key, value: data.value, updated_at: new Date().toISOString() })
          .select();
        break;
      case "upsert_content":
        result = await supabase
          .from("site_content")
          .upsert(
            { section: data.section, key: data.key, value: data.value, type: data.type || "text", updated_at: new Date().toISOString() },
            { onConflict: "section,key" }
          )
          .select();
        break;
      case "bulk_upsert_content":
        if (!Array.isArray(items)) throw new Error("items must be array");
        result = await supabase
          .from("site_content")
          .upsert(
            items.map((item: any) => ({
              section: item.section,
              key: item.key,
              value: item.value,
              type: item.type || "text",
              updated_at: new Date().toISOString(),
            })),
            { onConflict: "section,key" }
          )
          .select();
        break;
      case "reorder":
        if (!Array.isArray(items)) throw new Error("items must be array");
        for (const item of items) {
          await supabase.from(table).update({ sort_order: item.sort_order }).eq("id", item.id);
        }
        result = { data: items, error: null };
        break;
      case "delete":
        result = await supabase.from(table).delete().eq("id", id);
        break;
      case "delete_by_key":
        result = await supabase.from(table).delete().eq(data.column, data.value);
        break;
      case "create_membership":
        result = await supabase.from("group_memberships").insert({
          group_profile_id: data.group_profile_id,
          plan_id: data.plan_id,
          billing_period: data.billing_period || "monthly",
          starts_at: new Date().toISOString(),
          expires_at: data.expires_at,
        }).select();
        break;
      default:
        return new Response(JSON.stringify({ error: "Acción no válida" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    if (result.error) {
      return new Response(JSON.stringify({ error: result.error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ data: result.data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const status = err.message === "No autorizado" ? 401 : 500;
    return new Response(JSON.stringify({ error: err.message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
