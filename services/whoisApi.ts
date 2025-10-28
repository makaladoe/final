import env from "../../config/env";

const WHOIS_API_URL = env.WHOIS_API_URL || "https://domain-availability.whoisxmlapi.com/api/v1";
const WHOIS_API_KEY = env.WHOIS_API_KEY;

/**
 * Checks if a domain is available.
 * @param domain - The full domain name (e.g. "example.co.ke")
 * @returns "AVAILABLE", "TAKEN", or "ERROR"
 */
export async function checkDomainAvailability(domain: string): Promise<string> {
  try {
    const response = await fetch(
      `${WHOIS_API_URL}?apiKey=${WHOIS_API_KEY}&domainName=${domain}&outputFormat=JSON`
    );

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const data = await response.json();

    // WhoisXML returns this structure:
    // { DomainInfo: { domainAvailability: "AVAILABLE" or "UNAVAILABLE" } }
    const availability = data?.DomainInfo?.domainAvailability;

    if (availability === "AVAILABLE") return "AVAILABLE";
    if (availability === "UNAVAILABLE") return "TAKEN";

    return "ERROR";
  } catch (error) {
    console.error("Error checking domain availability:", error);
    return "ERROR";
  }
}
