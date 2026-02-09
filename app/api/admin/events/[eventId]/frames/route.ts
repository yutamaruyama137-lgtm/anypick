import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getAdminTenantId } from "@/lib/admin-auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const tenant_id = await getAdminTenantId();
  if (!tenant_id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId } = await params;
  const admin = createServiceRoleClient();
  const { data: event } = await admin.from("events").select("id").eq("id", eventId).eq("tenant_id", tenant_id).single();
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: frames } = await admin.from("frames").select("id, storage_key, is_active, created_at").eq("event_id", eventId).order("created_at", { ascending: false });
  const withUrls = await Promise.all(
    (frames ?? []).map(async (f) => {
      const { data: signed } = await admin.storage.from("frames").createSignedUrl(f.storage_key, 3600);
      return { ...f, image_url: signed?.signedUrl ?? null };
    })
  );
  return NextResponse.json({ frames: withUrls });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const tenant_id = await getAdminTenantId();
  if (!tenant_id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId } = await params;
  const admin = createServiceRoleClient();
  const { data: event } = await admin.from("events").select("id").eq("id", eventId).eq("tenant_id", tenant_id).single();
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file?.size) return NextResponse.json({ error: "file required" }, { status: 400 });

  const ext = file.name.split(".").pop() || "png";
  const { data: frame, error: insertErr } = await admin
    .from("frames")
    .insert({ event_id: eventId, storage_key: "", is_active: true })
    .select("id")
    .single();
  if (insertErr || !frame) return NextResponse.json({ error: "Failed to create frame" }, { status: 500 });

  const storageKey = `frames/${eventId}/${frame.id}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadErr } = await admin.storage.from("frames").upload(storageKey, buffer, { contentType: file.type, upsert: true });
  if (uploadErr) {
    await admin.from("frames").delete().eq("id", frame.id);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
  await admin.from("frames").update({ storage_key: storageKey }).eq("id", frame.id);
  await admin.from("frames").update({ is_active: false }).eq("event_id", eventId).neq("id", frame.id);
  return NextResponse.json({ frame: { id: frame.id, storage_key: storageKey } });
}
