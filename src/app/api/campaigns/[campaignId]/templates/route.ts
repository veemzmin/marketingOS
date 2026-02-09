import { NextRequest, NextResponse } from "next/server"
import { getCampaignTemplates } from "@/lib/campaign/engine"

export async function GET(
  _request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    const templates = await getCampaignTemplates(params.campaignId)
    return NextResponse.json({ success: true, templates })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to load templates" },
      { status: 500 }
    )
  }
}
