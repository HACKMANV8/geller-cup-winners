/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { adminAuth } from "@/lib/firebase/admin";
import ProjectModel from "@/lib/models/Project";

export async function GET(request: NextRequest) {
  const debug: any = {
    timestamp: new Date().toISOString(),
    checks: {},
  };

  try {
    // 1. Check MongoDB connection
    try {
      await connectToDatabase();
      debug.checks.mongodb = "✅ Connected";
    } catch (error: any) {
      debug.checks.mongodb = `❌ Failed: ${error.message}`;
    }

    // 2. Check Firebase Admin
    debug.checks.firebaseAdmin = adminAuth
      ? "✅ Initialized"
      : "❌ Not initialized";

    // 3. Check authentication
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const idToken = authHeader.split("Bearer ")[1];
      try {
        const decodedToken = await adminAuth?.verifyIdToken(idToken);
        debug.checks.authentication = `✅ Valid token for user: ${decodedToken?.uid}`;
        debug.userId = decodedToken?.uid;

        // 4. Check projects for this user
        try {
          const projects = await ProjectModel.find({
            userId: decodedToken?.uid,
          });
          debug.checks.projects = `✅ Found ${projects.length} projects`;
          debug.projectCount = projects.length;
          debug.projects = projects.map((p) => ({
            id: String(p._id),
            name: p.name,
            createdAt: p.createdAt,
          }));
        } catch (error: any) {
          debug.checks.projects = `❌ Failed to fetch: ${error.message}`;
        }
      } catch (error: any) {
        debug.checks.authentication = `❌ Invalid token: ${error.message}`;
      }
    } else {
      debug.checks.authentication = "⚠️  No authorization header provided";
    }

    // 5. Environment variables check
    debug.checks.env = {
      mongodbUri: process.env.MONGODB_URI ? "✅ Set" : "❌ Not set",
      firebaseServiceAccount: process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64
        ? "✅ Set (Base64)"
        : process.env.FIREBASE_PROJECT_ID
        ? "✅ Set (Individual vars)"
        : "❌ Not set",
    };

    return NextResponse.json(debug);
  } catch (error: any) {
    debug.error = error.message;
    return NextResponse.json(debug, { status: 500 });
  }
}
