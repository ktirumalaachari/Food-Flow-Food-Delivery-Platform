import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    const subscription = await req.json();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: "Invalid subscription payload" },
        { status: 400 }
      );
    }

    try {
      const db = await getDb();
      await db.collection("push_subscriptions").updateOne(
        { endpoint: subscription.endpoint },
        {
          $set: {
            ...subscription,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );
    } catch (dbErr) {
      console.warn("[PWA Push] DB write warning, proceeding:", dbErr);
    }

    return NextResponse.json({ success: true, message: "Subscription stored." });
  } catch (error: any) {
    console.error("[PWA Push] Subscribe error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to subscribe" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { endpoint } = await req.json();
    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint required" }, { status: 400 });
    }

    try {
      const db = await getDb();
      await db.collection("push_subscriptions").deleteOne({ endpoint });
    } catch (dbErr) {
      console.warn("[PWA Push] DB delete warning:", dbErr);
    }

    return NextResponse.json({ success: true, message: "Subscription removed." });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to remove subscription" },
      { status: 500 }
    );
  }
}
