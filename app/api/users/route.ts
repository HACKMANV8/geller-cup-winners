/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import UserModel from "@/lib/models/User";

export async function POST(request: Request) {
  try {
    // Connect to MongoDB
    await connectToDatabase();

    // Parse request body
    const body = await request.json();
    const { uid, email, displayName, photoURL, provider } = body;

    // Validate required fields
    if (!uid || !email || !displayName) {
      return NextResponse.json(
        { error: "Missing required fields: uid, email, displayName" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await UserModel.findOne({ uid });

    if (existingUser) {
      // Update existing user
      existingUser.displayName = displayName;
      existingUser.email = email;
      if (photoURL) existingUser.photoURL = photoURL;
      if (provider) existingUser.provider = provider;
      await existingUser.save();

      return NextResponse.json({
        success: true,
        message: "User updated successfully",
        user: existingUser,
      });
    }

    // Create new user
    const newUser = await UserModel.create({
      uid,
      email,
      displayName,
      photoURL: photoURL || null,
      provider: provider || "email",
    });

    return NextResponse.json({
      success: true,
      message: "User created successfully",
      user: newUser,
    });
  } catch (error: any) {
    console.error("Error in /api/users:", error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to create user" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json(
        { error: "Missing uid parameter" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const user = await UserModel.findOne({ uid });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error: any) {
    console.error("Error in /api/users GET:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch user" },
      { status: 500 }
    );
  }
}

