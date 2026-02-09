import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

async function getTenantId(supabaseAuth: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return null;
  const admin = createServiceRoleClient();
  const { data: au } = await admin.from("admin_users").select("tenant_id").eq("id", user.id).single();
  return au?.tenant_id ?? null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const supabase = await createClient();
  const tenant_id = await getTenantId(supabase);
  if (!tenant_id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId } = await params;
  const admin = createServiceRoleClient();
  const { data: event } = await admin.from("events").select("id").eq("id", eventId).eq("tenant_id", tenant_id).single();
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const consent = searchParams.get("consent");

  let q = admin
    .from("submissions")
    .select("id, session_id, media_asset_id, contact_email, consent_agree_reuse, admin_tags, admin_note, created_at")
    .eq("event_id", eventId)
    .eq("status", "valid")
    .order("created_at", { ascending: false });
  if (consent === "agree_reuse") {
    q = q.eq("consent_agree_reuse", true);
  }
  const { data: submissions } = await q;
  const withUrls = await Promise.all(
    (submissions ?? []).map(async (s) => {
      const { data: ma } = await admin.from("media_assets").select("storage_key").eq("id", s.media_asset_id).single();
      let image_url: string | null = null;
      if (ma?.storage_key) {
        const { data: signed } = await admin.storage.from("media").createSignedUrl(ma.storage_key, 3600);
        image_url = signed?.signedUrl ?? null;
      }
      return { ...s, image_url };
    })
  );
  return NextResponse.json({ submissions: withUrls });
}
