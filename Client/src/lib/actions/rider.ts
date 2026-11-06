import { ApiResponse, IRiderProfile } from "@/lib/api/rider";
import { getApiBaseUrl } from "@/lib/api/config";

/**
 * 1. POST - Create new Rider Profile
 */
export async function createRiderProfile(
  payload: Partial<IRiderProfile>
): Promise<ApiResponse<IRiderProfile>> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/rider/profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data: ApiResponse<IRiderProfile> = await res.json();
    return data;
  } catch (err: any) {
    console.error("Error in createRiderProfile action:", err);
    return {
      success: false,
      message: err.message || "Failed to submit rider profile to server.",
    };
  }
}

/**
 * 2. PATCH/PUT - Update existing Rider Profile
 */
export async function updateRiderProfile(
  email: string,
  payload: Partial<IRiderProfile>
): Promise<ApiResponse<IRiderProfile>> {
  try {
    const url = new URL(`${getApiBaseUrl()}/rider/profile`);
    url.searchParams.append("email", email);

    const res = await fetch(url.toString(), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...payload, email }),
    });

    const data: ApiResponse<IRiderProfile> = await res.json();
    return data;
  } catch (err: any) {
    console.error("Error in updateRiderProfile action:", err);
    return {
      success: false,
      message: err.message || "Failed to update rider profile.",
    };
  }
}

/**
 * 3. PATCH - Toggle Rider online availability (On Duty / Offline)
 */
export async function toggleRiderAvailability(
  email: string,
  isAvailable: boolean
): Promise<ApiResponse<IRiderProfile>> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/rider/profile/availability`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, isAvailable }),
    });

    const data: ApiResponse<IRiderProfile> = await res.json();
    return data;
  } catch (err: any) {
    console.error("Error in toggleRiderAvailability action:", err);
    return {
      success: false,
      message: err.message || "Failed to update availability status.",
    };
  }
}

/**
 * 4. DELETE - Delete Rider Profile
 */
export async function deleteRiderProfile(
  email: string
): Promise<ApiResponse<{ deletedCount: number }>> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/rider/profile`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error("Error in deleteRiderProfile action:", err);
    return {
      success: false,
      message: err.message || "Failed to delete rider profile.",
    };
  }
}
