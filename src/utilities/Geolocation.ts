import express from "express";

interface IpApiResponse {
  status: string;
  country?: string;
  countryCode?: string;
  message?: string;
}

/**
 * Extract IP address from request, considering proxies and load balancers
 */
export function getClientIp(req: express.Request): string | null {
  // Check X-Forwarded-For header (set by proxies/load balancers)
  const forwardedFor = req.headers["x-forwarded-for"];
  if (forwardedFor) {
    const ips = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor.split(",")[0];
    return ips.trim();
  }

  // Check X-Real-IP header (set by nginx and other proxies)
  const realIp = req.headers["x-real-ip"];
  if (realIp && typeof realIp === "string") {
    return realIp.trim();
  }

  // Fallback to direct connection IP
  return req.socket.remoteAddress || null;
}

/**
 * Get country code from IP address using ip-api.com
 * Returns ISO 3166-1 alpha-2 country code (e.g., "US", "NL", "DE")
 */
export async function getCountryFromIp(
  ip: string | null,
): Promise<string | null> {
  if (!ip) {
    console.log("[GEOLOCATION] No IP address provided");
    return null;
  }

  // Skip localhost/private IPs
  if (
    ip === "::1" ||
    ip === "127.0.0.1" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.")
  ) {
    console.log(`[GEOLOCATION] Skipping private/localhost IP: ${ip}`);
    return null;
  }

  try {
    console.log(`[GEOLOCATION] Looking up country for IP: ${ip}`);

    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,message,countryCode`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      },
    );

    if (!response.ok) {
      console.error(
        `[GEOLOCATION] API request failed with status: ${response.status}`,
      );
      return null;
    }

    const data = (await response.json()) as IpApiResponse;

    if (data.status === "fail") {
      console.error(`[GEOLOCATION] API returned error: ${data.message}`);
      return null;
    }

    if (data.countryCode) {
      console.log(
        `[GEOLOCATION] Successfully resolved IP ${ip} to country: ${data.countryCode}`,
      );
      return data.countryCode;
    }

    console.log(`[GEOLOCATION] No country code in response for IP: ${ip}`);
    return null;
  } catch (error) {
    console.error("[GEOLOCATION] Error fetching geolocation data:", error);
    return null;
  }
}
