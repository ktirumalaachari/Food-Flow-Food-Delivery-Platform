import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { getDb } from "@/lib/mongodb";

const vapidPublicKey =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BLPoibZQOAKyFOXUIAVeCVl_24U_vyVSUrIo1Zwu2WtR58XiaEf9u_O3DMAz-xR58XCJNxyYeDv53QSqv2ANBQ0";
const vapidPrivateKey =
  process.env.VAPID_PRIVATE_KEY || "KxTcV4tfIzQ3HVYw5rWUtkWtj5BbAo7ZGUeGrc-sseE";
const vapidSubject =
  process.env.VAPID_SUBJECT || "mailto:foodflow.support@gmail.com";

webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

export async function POST(req: NextRequest) {
  try {
    const { title, body, icon, url, subscription } = await req.json();

    const payload = JSON.stringify({
      title: title || "Food Flow Notification",
      body: body || "Your food order is on the move!",
      icon: icon || "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
      data: {
        url: url || "/order-tracking",
      },
    });

    // If specific subscription provided, send to that single subscriber
    if (subscription && subscription.endpoint) {
      await webpush.sendNotification(subscription, payload);
      return NextResponse.json({ success: true, delivered: 1 });
    }

    // Otherwise send to all subscribers in MongoDB
    let deliveredCount = 0;
    try {
      const db = await getDb();
      const subscriptions = await db
        .collection("push_subscriptions")
        .find({})
        .limit(100)
        .toArray();

      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: sub.keys,
            },
            payload
          );
          deliveredCount++;
        } catch (err: any) {
          // If subscription expired / gone (410 or 404), delete it
          if (err.statusCode === 410 || err.statusCode === 404) {
            await db.collection("push_subscriptions").deleteOne({ _id: sub._id });
          }
        }
      }
    } catch (dbErr) {
      console.warn("[PWA Push] Error fetching subscribers:", dbErr);
    }

    return NextResponse.json({
      success: true,
      delivered: deliveredCount,
      message: `Push delivered to ${deliveredCount} devices`,
    });
  } catch (error: any) {
    console.error("[PWA Push] Send push error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to dispatch push notification" },
      { status: 500 }
    );
  }
}
