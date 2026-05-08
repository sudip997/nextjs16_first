import { NextRequest, NextResponse } from "next/server";
import { Event } from "@/database";
import connectDB from "@/lib/mongodb";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

/** Valid slug: lowercase alphanumeric segments separated by single hyphens */
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function GET(
  _request: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse> {
  try {
    const { slug } = await params;

    // Validate slug presence
    if (!slug || slug.trim().length === 0) {
      return NextResponse.json(
        { message: "Slug parameter is required." },
        { status: 400 },
      );
    }

    const trimmedSlug = slug.trim().toLowerCase();

    // Validate slug format
    if (!SLUG_REGEX.test(trimmedSlug)) {
      return NextResponse.json(
        { message: "Invalid slug format." },
        { status: 400 },
      );
    }

    // Ensure database is connected before querying
    await connectDB();

    // Fetch event by slug, excluding internal Mongoose version key
    const event = await Event.findOne({ slug: trimmedSlug }).select("-__v");

    if (!event) {
      return NextResponse.json(
        { message: `No event found for slug '${trimmedSlug}'.` },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { message: "Event retrieved successfully.", event },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("GET /api/events/[slug] error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unexpected server error.";

    return NextResponse.json(
      { message: "Internal server error.", error: errorMessage },
      { status: 500 },
    );
  }
}
