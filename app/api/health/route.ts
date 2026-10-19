import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json({ name: "kinetiq", status: "ok", mode: "prototype", services: { databaseConfigured: Boolean(process.env.DATABASE_URL), objectStorageConfigured: Boolean(process.env.S3_ENDPOINT && process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY), realtimeConfigured: Boolean(process.env.REALTIME_SERVER_URL) }, note: "Configuration presence only; external service connectivity is not verified." });
}
