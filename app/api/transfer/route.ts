/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";
import path from "path";
import { generatePythonDockerfile } from "@/lib/dockerfiles/python";
import { generateBuildYml } from "@/lib/buildfile";
import ProjectModel from "@/lib/models/Project";

const execAsync = promisify(exec);

const PAT = process.env.WORKER_PAT;
const WORKER_REPO_NAME = process.env.WORKER_REPO || "govindup63/worker";

// Validate PAT on module load
if (!PAT) {
  console.warn("⚠️  WORKER_PAT environment variable is not set!");
}

const WORKER_REPO = PAT
  ? `https://${PAT}@github.com/${WORKER_REPO_NAME}.git`
  : `https://github.com/${WORKER_REPO_NAME}.git`;

// Helper function to generate random nice subdomain
function generateRandomSubdomain(): string {
  const adjectives = [
    "happy",
    "sunny",
    "clever",
    "bright",
    "swift",
    "cosmic",
    "noble",
    "vibrant",
    "stellar",
    "mystic",
    "golden",
    "silver",
    "crimson",
    "azure",
    "emerald",
    "crystal",
    "electric",
    "quantum",
    "digital",
    "cyber",
  ];

  const nouns = [
    "panda",
    "falcon",
    "tiger",
    "dolphin",
    "phoenix",
    "dragon",
    "wolf",
    "eagle",
    "lion",
    "hawk",
    "fox",
    "bear",
    "owl",
    "lynx",
    "cobra",
    "shark",
    "raven",
    "leopard",
    "pegasus",
    "griffin",
  ];

  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNum = Math.floor(Math.random() * 999);

  return `${adjective}-${noun}-${randomNum}`;
}

export async function POST(request: Request) {
  let rawBody = "";

  try {
    // Validate PAT is available
    if (!PAT) {
      console.error("WORKER_PAT environment variable is not set");
      return NextResponse.json(
        {
          success: false,
          error: "Server configuration error: GitHub PAT not configured",
          details: "WORKER_PAT environment variable is required",
        },
        { status: 500 }
      );
    }

    // Clone the request to read body as text first for debugging
    const clonedRequest = request.clone();
    rawBody = await clonedRequest.text();
    console.log("=== RAW REQUEST BODY ===");
    console.log(rawBody);
    console.log("=== END RAW BODY ===");

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
      console.log("=== PARSED JSON ===");
      console.log(JSON.stringify(body, null, 2));
      console.log("=== END PARSED JSON ===");
    } catch (parseError: any) {
      console.error("JSON Parse Error:", parseError.message);
      console.error("Raw body that failed to parse:", rawBody);
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON in request body",
          details: parseError.message,
          receivedBody: rawBody.substring(0, 500), // First 500 chars
        },
        { status: 400 }
      );
    }

    const {
      targetRepo,
      targetBranch = "main",
      port = 8080,
      rootDir = ".",
      runCommand = "python server.py",
      mcpName,
      containerPort = 8080,
    } = body;

    console.log("=== EXTRACTED PARAMETERS ===");
    console.log({
      targetRepo,
      targetBranch,
      port,
      rootDir,
      runCommand,
      mcpName,
      containerPort,
    });
    console.log("=== END PARAMETERS ===");

    // Validate required fields
    if (!targetRepo) {
      console.error("Validation failed: targetRepo is missing");
      return NextResponse.json(
        { success: false, error: "targetRepo is required" },
        { status: 400 }
      );
    }

    if (!mcpName) {
      console.error("Validation failed: mcpName is missing");
      return NextResponse.json(
        { success: false, error: "mcpName is required" },
        { status: 400 }
      );
    }

    const subdomain = generateRandomSubdomain();
    const ingressHostname = `${subdomain}.ghstmail.me`; // Just the domain without https://
    const ingressUrl = `https://${ingressHostname}`; // Full URL for response
    const tempTargetDir = path.join("/tmp", `target-${uuidv4()}`);
    const tempWorkerDir = path.join("/tmp", `worker-${uuidv4()}`);

    console.log("=== GENERATED VALUES ===");
    console.log({
      subdomain,
      ingressHostname,
      ingressUrl,
      tempTargetDir,
      tempWorkerDir,
    });
    console.log("=== END GENERATED VALUES ===");

    // Step 1: Clone the target repository
    console.log("=== STEP 1: CLONING TARGET REPOSITORY ===");
    console.log(`Repository: ${targetRepo}`);
    console.log(`Branch: ${targetBranch}`);
    console.log(`Temp dir: ${tempTargetDir}`);
    const cloneTargetResult = await execAsync(
      `git clone -b ${targetBranch} ${targetRepo} ${tempTargetDir}`
    );
    console.log("Clone stdout:", cloneTargetResult.stdout);
    console.log("Clone stderr:", cloneTargetResult.stderr);
    console.log("✓ Target repository cloned successfully");

    // Step 1.5: Clone the worker repository
    console.log("=== STEP 1.5: CLONING WORKER REPOSITORY ===");
    console.log(`Worker repo: ${WORKER_REPO_NAME}`);
    console.log(`Temp dir: ${tempWorkerDir}`);
    try {
      const cloneWorkerResult = await execAsync(
        `git clone ${WORKER_REPO} ${tempWorkerDir}`
      );
      console.log("Worker clone stdout:", cloneWorkerResult.stdout);
      console.log("Worker clone stderr:", cloneWorkerResult.stderr);
      console.log("✓ Worker repository cloned successfully");
    } catch {
      console.log("Worker repo doesn't exist or is empty, creating new repo");
      await fs.mkdir(tempWorkerDir, { recursive: true });
      await execAsync(`cd ${tempWorkerDir} && git init`);
      await execAsync(
        `cd ${tempWorkerDir} && git remote add origin ${WORKER_REPO}`
      );
      console.log("✓ Worker repository initialized");
    }

    // Step 1.75: Delete all content in worker repo except .git
    console.log("=== STEP 1.75: CLEARING WORKER REPOSITORY ===");
    const workerContents = await fs.readdir(tempWorkerDir);
    for (const item of workerContents) {
      if (item !== ".git") {
        const itemPath = path.join(tempWorkerDir, item);
        await fs.rm(itemPath, { recursive: true, force: true });
        console.log(`Deleted: ${item}`);
      }
    }
    console.log("✓ Worker repository cleared");

    // Step 1.9: Copy all files from target repo to worker repo (except .git)
    console.log("=== STEP 1.9: COPYING FILES FROM TARGET TO WORKER ===");
    const targetContents = await fs.readdir(tempTargetDir);
    for (const item of targetContents) {
      if (item !== ".git") {
        const sourcePath = path.join(tempTargetDir, item);
        const destPath = path.join(tempWorkerDir, item);
        await execAsync(`cp -r "${sourcePath}" "${destPath}"`);
        console.log(`Copied: ${item}`);
      }
    }
    console.log("✓ Files copied successfully");

    // Step 2: Generate and add Dockerfile to worker repo
    console.log("=== STEP 2: GENERATING DOCKERFILE ===");
    const dockerfileContent = generatePythonDockerfile(
      port,
      rootDir,
      runCommand
    );
    console.log("Generated Dockerfile:");
    console.log(dockerfileContent);
    await fs.writeFile(
      path.join(tempWorkerDir, "Dockerfile"),
      dockerfileContent
    );
    console.log("✓ Dockerfile written successfully");

    // Step 3: Generate and add build.yml to worker repo
    console.log("=== STEP 3: GENERATING BUILD.YML ===");
    const buildYmlContent = generateBuildYml(
      mcpName,
      containerPort,
      ingressHostname
    );
    console.log(
      "Generated build.yml (first 200 chars):",
      buildYmlContent.substring(0, 200)
    );
    const workflowDir = path.join(tempWorkerDir, ".github", "workflows");
    await fs.mkdir(workflowDir, { recursive: true });
    await fs.writeFile(path.join(workflowDir, "build.yml"), buildYmlContent);
    console.log("✓ build.yml written successfully");

    // Step 4: Commit the changes
    console.log("=== STEP 4: COMMITTING CHANGES ===");
    await execAsync(
      `cd ${tempWorkerDir} && git config user.name "github-actions[bot]"`
    );
    await execAsync(
      `cd ${tempWorkerDir} && git config user.email "actions@github.com"`
    );

    const addResult = await execAsync(`cd ${tempWorkerDir} && git add -A`);
    console.log("Git add output:", addResult.stdout);

    const commitResult = await execAsync(
      `cd ${tempWorkerDir} && git commit -m "Deploy ${mcpName}: Add source code, Dockerfile and build workflow" || echo "No changes to commit"`
    );
    console.log("Git commit output:", commitResult.stdout);
    console.log("✓ Changes committed successfully");

    // Step 5: Push to worker repo
    console.log("=== STEP 5: PUSHING TO WORKER REPO ===");
    const maskedRepo = WORKER_REPO.replace(PAT || "", "***");
    console.log("Worker repo:", maskedRepo);
    console.log("Target branch:", targetBranch);

    // Verify remote
    const remoteResult = await execAsync(
      `cd ${tempWorkerDir} && git remote -v`
    );
    console.log("Git remotes:", remoteResult.stdout.replace(PAT || "", "***"));

    // Push with explicit credentials
    try {
      const pushResult = await execAsync(
        `cd ${tempWorkerDir} && git push -f origin ${targetBranch}`
      );
      console.log("Git push stdout:", pushResult.stdout);
      console.log("Git push stderr:", pushResult.stderr);
      console.log("✓ Pushed to worker repository successfully");
    } catch (pushError: any) {
      console.error("Push failed!");
      console.error("Push error code:", pushError.code);
      console.error("Push error message:", pushError.message);
      console.error("Push error stderr:", pushError.stderr);

      // Provide more helpful error message
      if (
        pushError.message.includes("403") ||
        pushError.message.includes("Permission denied")
      ) {
        throw new Error(
          "GitHub authentication failed. Please ensure:\n" +
            "1. WORKER_PAT environment variable is set correctly\n" +
            "2. The PAT has 'repo' permissions\n" +
            "3. The PAT is valid and not expired\n" +
            "4. You have write access to the repository"
        );
      }

      // Check for workflow scope error
      if (
        pushError.message.includes("workflow") &&
        pushError.message.includes("scope")
      ) {
        throw new Error(
          "❌ GitHub workflow scope required!\n\n" +
            "Your Personal Access Token needs the 'workflow' scope to create/update workflow files.\n\n" +
            "To fix this:\n" +
            "1. Go to https://github.com/settings/tokens\n" +
            "2. Click on your token or create a new one\n" +
            "3. Enable the 'workflow' scope (in addition to 'repo')\n" +
            "4. Update your WORKER_PAT in .env.local\n" +
            "5. Restart your dev server\n\n" +
            "Required scopes: 'repo' + 'workflow'"
        );
      }

      throw pushError;
    }

    // Clean up
    console.log("=== STEP 6: CLEANUP ===");
    await fs.rm(tempTargetDir, { recursive: true, force: true });
    console.log("✓ Target temp directory cleaned up");
    await fs.rm(tempWorkerDir, { recursive: true, force: true });
    console.log("✓ Worker temp directory cleaned up");

    await ProjectModel.create({
      name: subdomain,
      repoUrl: targetRepo,
      branch: targetBranch,
      url: ingressUrl,
    });

    console.log("=== SUCCESS ===");
    console.log("Process completed successfully!");
    console.log("Ingress URL:", ingressUrl);
    console.log("=== END SUCCESS ===");

    return NextResponse.json({
      success: true,
      message:
        "Repository transferred successfully with Dockerfile and build workflow",
      url: ingressUrl,
      subdomain,
    });
  } catch (error: any) {
    console.error("=== ERROR OCCURRED ===");
    console.error("Error type:", error.constructor.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Full error object:", error);
    console.error("=== END ERROR ===");

    // Try to clean up temp directories if they exist
    try {
      const tempTargetPattern = /\/tmp\/target-[\w-]+/;
      const tempWorkerPattern = /\/tmp\/worker-[\w-]+/;

      const targetMatch = error.cmd?.match?.(tempTargetPattern);
      if (targetMatch) {
        console.log("Cleaning up target temp directory:", targetMatch[0]);
        await fs.rm(targetMatch[0], { recursive: true, force: true });
      }

      const workerMatch = error.cmd?.match?.(tempWorkerPattern);
      if (workerMatch) {
        console.log("Cleaning up worker temp directory:", workerMatch[0]);
        await fs.rm(workerMatch[0], { recursive: true, force: true });
      }

      // Also try to clean up any temp dirs by listing /tmp
      const tmpContents = await fs.readdir("/tmp");
      for (const item of tmpContents) {
        if (item.startsWith("target-") || item.startsWith("worker-")) {
          const itemPath = path.join("/tmp", item);
          try {
            await fs.rm(itemPath, { recursive: true, force: true });
            console.log("Cleaned up stale temp directory:", item);
          } catch {
            // Ignore errors for items we can't delete
          }
        }
      }
    } catch (cleanupError) {
      console.error("Error during cleanup:", cleanupError);
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || "An unexpected error occurred",
        errorType: error.constructor.name,
      },
      { status: 500 }
    );
  }
}
