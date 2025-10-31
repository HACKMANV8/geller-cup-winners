/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";

const execAsync = promisify(exec);

// Target repository where you want to push the code
const TARGET_REPO = "https://github.com/your-username/your-target-repo.git";
const TARGET_BRANCH = "main";
const PAT = process.env.WORKER_PAT;

export async function POST(request: Request) {
  try {
    const { repoUrl } = await request.json();

    if (!repoUrl) {
      return NextResponse.json(
        { error: "Repository URL is required" },
        { status: 400 }
      );
    }

    // Create a unique temporary directory
    const tempDir = path.join("/tmp", `repo-${uuidv4()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    try {
      // Clone the source repository
      await execAsync(`git clone --depth 1 ${repoUrl} ${tempDir}`);

      // Change to the temporary directory
      process.chdir(tempDir);

      // Initialize git in the temp directory (in case it's a shallow clone)
      await execAsync("git init");

      // Add the target repository as a remote
      await execAsync(`git remote add target ${TARGET_REPO}`);

      // Push to the target repository
      await execAsync(`git push -f target ${TARGET_BRANCH}`);

      // Clean up
      fs.rmSync(tempDir, { recursive: true, force: true });

      return NextResponse.json({
        success: true,
        message: "Repository transferred successfully",
        targetRepo: TARGET_REPO,
      });
    } catch (error) {
      // Clean up on error
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
      throw error;
    }
  } catch (error: any) {
    console.error("Error transferring repository:", error);
    return NextResponse.json(
      { error: "Failed to transfer repository", details: error.message },
      { status: 500 }
    );
  }
}
