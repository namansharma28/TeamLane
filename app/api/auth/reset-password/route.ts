import { NextRequest, NextResponse } from "next/server";
import { getMongoClient } from "@/lib/mongodb";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    let client;
    try {
      client = await getMongoClient();
    } catch (dbError) {
      console.error("Database connection error:", dbError);
      return NextResponse.json(
        { error: "Database connection failed. Please try again in a moment." },
        { status: 503 }
      );
    }

    const db = client.db("gravitas");

    let user;
    try {
      user = await db.collection("users").findOne({
        resetToken: token,
        resetTokenExpiry: { $gt: new Date() },
      });
    } catch (findError) {
      console.error("Error finding user:", findError);
      return NextResponse.json(
        { error: "Failed to verify reset token. Please try again." },
        { status: 500 }
      );
    }

    if (!user) {
      const expiredUser = await db.collection("users").findOne({
        resetToken: token,
      });
      
      if (expiredUser) {
        return NextResponse.json(
          { error: "Reset token has expired. Please request a new one." },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: "Invalid reset token. Please request a new one." },
        { status: 400 }
      );
    }

    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 10);
    } catch (hashError) {
      console.error("Password hashing error:", hashError);
      return NextResponse.json(
        { error: "Failed to process password. Please try again." },
        { status: 500 }
      );
    }

    try {
      await db.collection("users").updateOne(
        { _id: user._id },
        {
          $set: {
            password: hashedPassword,
          },
          $unset: {
            resetToken: "",
            resetTokenExpiry: "",
          },
        }
      );
    } catch (updateError) {
      console.error("Error updating user password:", updateError);
      return NextResponse.json(
        { error: "Failed to update password. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Password reset successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: `Failed to reset password: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
