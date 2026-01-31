import { NextResponse } from "next/server";
import { getJob, getJobNotes, updateJob, updateJobStatus, updateJobCompiledNotes, deleteJob } from "@/lib/database";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/jobs/[id] - Get a specific job with its notes
export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params;

    const job = await getJob(id);
    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    const notes = await getJobNotes(id);

    return NextResponse.json({ job, notes });
  } catch (error) {
    console.error("Error fetching job:", error);
    return NextResponse.json(
      { error: "Failed to fetch job" },
      { status: 500 }
    );
  }
}

// PATCH /api/jobs/[id] - Update a job
export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();

    const job = await getJob(id);
    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Update name/description
    if (body.name !== undefined) {
      await updateJob(id, body.name, body.description);
    }

    // Update status
    if (body.status !== undefined) {
      await updateJobStatus(id, body.status);
    }

    // Update compiled notes
    if (body.compiledNotes !== undefined) {
      await updateJobCompiledNotes(id, body.compiledNotes);
    }

    return NextResponse.json({
      success: true,
      message: "Job updated successfully",
    });
  } catch (error) {
    console.error("Error updating job:", error);
    return NextResponse.json(
      { error: "Failed to update job" },
      { status: 500 }
    );
  }
}

// DELETE /api/jobs/[id] - Delete a job and its notes
export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = await params;

    const job = await getJob(id);
    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    await deleteJob(id);

    return NextResponse.json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting job:", error);
    return NextResponse.json(
      { error: "Failed to delete job" },
      { status: 500 }
    );
  }
}
