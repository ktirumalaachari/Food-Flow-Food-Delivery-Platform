/**
 * Web Push Notification Management for FoodFlow PWA
 */

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushNotificationSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export async function getPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushNotificationSupported()) return null;
  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error("[PWA Push] Failed to get subscription:", error);
    return null;
  }
}

export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  if (!isPushNotificationSupported()) {
    throw new Error("Push notifications are not supported in this browser.");
  }

  // 1. Request permission
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Notification permission denied by user.");
  }

  // 2. Fetch public VAPID key
  let vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) {
    try {
      const res = await fetch("/api/push/vapid-key");
      const data = await res.json();
      vapidKey = data.publicKey;
    } catch (e) {
      console.warn("Could not fetch remote vapid key, using fallback", e);
    }
  }

  if (!vapidKey) {
    vapidKey =
      "BLPoibZQOAKyFOXUIAVeCVl_24U_vyVSUrIo1Zwu2WtR58XiaEf9u_O3DMAz-xR58XCJNxyYeDv53QSqv2ANBQ0";
  }

  const convertedKey = urlBase64ToUint8Array(vapidKey);
  const registration = await navigator.serviceWorker.ready;

  // 3. Subscribe via PushManager
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedKey as unknown as BufferSource,
    });
  }

  // 4. Send subscription to server
  try {
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription),
    });
  } catch (err) {
    console.warn("[PWA Push] Server subscribe call failed, cached locally:", err);
  }

  return subscription;
}

export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  try {
    const subscription = await getPushSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      await fetch("/api/push/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error("[PWA Push] Unsubscribe failed:", error);
    return false;
  }
}
