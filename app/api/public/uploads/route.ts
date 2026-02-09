import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const session_id = formData.get("session_id") as string | null;
  const file = formData.get("file") as File | null;

  if (!session_id || !file?.size) {
    return NextResponse.json(
      { error: "session_id and file required" },
      { status: 400 }
    );
  }

  const supabase = createServiceRoleClient();

  const { data: session, error: sessionError } = await supabase
    .from("user_sessions")
    .select("event_id")
    .eq("id", session_id)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Invalid session" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("submissions")
    .select("id")
    .eq("event_id", session.event_id)
    .eq("session_id", session_id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Already submitted" }, { status: 409 });
  }

  const ext = file.name.split(".").pop() || "jpg";
  const content_type = file.type || "image/jpeg";
  const buffer = Buffer.from(await file.arrayBuffer());

  const { data: asset, error: assetError } = await supabase
    .from("media_assets")
    .insert({
      event_id: session.event_id,
      session_id,
      storage_key: "", // set after upload
      content_type,
      byte_size: buffer.length,
    })
    .select("id")
    .single();

  if (assetError || !asset) {
    return NextResponse.json({ error: "Failed to create asset" }, { status: 500 });
  }

  const storageKey = `media/${session.event_id}/${asset.id}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("media")
    .upload(storageKey, buffer, {
      contentType: content_type,
      upsert: true,
    });

  if (uploadError) {
    await supabase.from("media_assets").delete().eq("id", asset.id);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  await supabase
    .from("media_assets")
    .update({ storage_key: storageKey })
    .eq("id", asset.id);

  const { data: signed } = await supabase.storage
    .from("media")
    .createSignedUrl(storageKey, 3600 * 24 * 7);

  return NextResponse.json({
    media_asset_id: asset.id,
    upload_url: "", // サーバー経由でアップロード済み
    public_read_url: signed?.signedUrl ?? "",
  });
}
