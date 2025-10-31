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
const WORKER_REPO = `https://${PAT}@github.com/govindup63/worker.git`;

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
  const {
    targetRepo,
    targetBranch = "main",
    port = 8080,
    rootDir = ".",
    runCommand = "python server.py",
    mcpName,
    containerPort = 8080,
  } = await request.json();

  const subdomain = generateRandomSubdomain();
  const ingressUrl = `https://${subdomain}.ghstmail.me`;
  const tempDir = path.join("/tmp", `repo-${uuidv4()}`);

  try {
    // Step 1: Clone the target repository
    console.log(`Cloning repository: ${targetRepo}`);
    await execAsync(`git clone -b ${targetBranch} ${targetRepo} ${tempDir}`);

    // Step 2: Generate and add Dockerfile
    console.log("Generating Dockerfile...");
    const dockerfileContent = generatePythonDockerfile(
      port,
      rootDir,
      runCommand
    );
    await fs.writeFile(path.join(tempDir, "Dockerfile"), dockerfileContent);

    // Step 3: Generate and add build.yml
    console.log("Generating build.yml...");
    const buildYmlContent = generateBuildYml(
      mcpName,
      containerPort,
      ingressUrl
    );
    const workflowDir = path.join(tempDir, ".github", "workflows");
    await fs.mkdir(workflowDir, { recursive: true });
    await fs.writeFile(path.join(workflowDir, "build.yml"), buildYmlContent);

    // Step 4: Commit the changes
    console.log("Committing changes...");
    await execAsync(`cd ${tempDir} && git add .`);
    await execAsync(
      `cd ${tempDir} && git config user.name "github-actions[bot]"`
    );
    await execAsync(
      `cd ${tempDir} && git config user.email "actions@github.com"`
    );
    await execAsync(
      `cd ${tempDir} && git commit -m "Add Dockerfile and build workflow"`
    );

    // Step 5: Push to worker repo
    console.log("Pushing to worker repository...");
    await execAsync(
      `cd ${tempDir} && git remote set-url origin ${WORKER_REPO}`
    );
    await execAsync(`cd ${tempDir} && git push origin ${targetBranch}`);

    // Clean up
    await fs.rm(tempDir, { recursive: true, force: true });

    await ProjectModel.create({
      name: subdomain,
      repoUrl: targetRepo,
      branch: targetBranch,
      url: ingressUrl,
    });

    return NextResponse.json({
      success: true,
      message:
        "Repository transferred successfully with Dockerfile and build workflow",
      url: ingressUrl,
    });
  } catch (error: any) {
    console.error("Error during transfer:", error);

    // Clean up on error
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.error("Error during cleanup:", cleanupError);
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
