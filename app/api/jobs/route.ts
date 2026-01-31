import { NextResponse } from "next/server";
import { getJobs, createJob } from "@/lib/database";
import crypto from "crypto";

// GET /api/jobs - List all jobs for a user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || "user_chris";

    const jobs = await getJobs(userId);

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

// POST /api/jobs - Create a new job
export async function POST(request: Request) {
  try {
    const { name, description, userId = "user_chris" } = await request.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Job name is required" },
        { status: 400 }
      );
    }

    const jobId = `job_${crypto.randomUUID()}`;

    await createJob({
      id: jobId,
      userId,
      name: name.trim(),
      description: description?.trim() || "",
    });

    return NextResponse.json({
      success: true,
      jobId,
      message: "Job created successfully",
    });
  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json(
      { error: "Failed to create job" },
      { status: 500 }
    );
  }
}
