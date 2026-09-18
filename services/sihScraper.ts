import * as cheerio from "cheerio";
import axios from "axios";
import sihSeedData from "@/lib/sihData.json";

export interface PSData {
  psId: string;
  title: string;
  organization: string;
  department: string;
  category: string;
  theme: string;
  submitted: number;
  maximum: number;
  deadline?: string;
  rawCountString: string;
  lastFetched: Date;
}

const SIH_URL = "https://sih.gov.in/sih2026PS";
const CACHE_TTL_MS = 25000; // 25 seconds cache

function getInitialSeedMap(): Map<string, PSData> {
  const map = new Map<string, PSData>();
  if (Array.isArray(sihSeedData)) {
    sihSeedData.forEach((item: any) => {
      const norm = normalizePsId(item.psId);
      const data: PSData = {
        psId: norm,
        title: item.title,
        organization: item.organization,
        department: item.department || item.organization,
        category: item.category || "Software",
        theme: item.theme || "General",
        submitted: Number(item.submitted) || 0,
        maximum: Number(item.maximum) || 500,
        deadline: item.deadline || "30 September 2026",
        rawCountString: item.rawCountString || `${item.submitted || 0}/${item.maximum || 500}`,
        lastFetched: new Date(item.lastFetched || Date.now()),
      };
      map.set(norm, data);
      const digits = norm.replace(/\D/g, "");
      if (digits && digits !== norm) {
        map.set(digits, data);
      }
    });
  }
  return map;
}

let memoryCache: {
  data: Map<string, PSData>;
  timestamp: number;
} | null = {
  data: getInitialSeedMap(),
  timestamp: Date.now() - 30000, // Seeded ready
};

/**
 * Normalizes a Problem Statement ID e.g. "sih26171" -> "SIH26171", "26171" -> "SIH26171"
 */
export function normalizePsId(input: string): string {
  if (!input) return "";
  let trimmed = input.trim().toUpperCase();
  if (/^\d{3,5}$/.test(trimmed)) {
    if (trimmed.startsWith("26")) {
      trimmed = `SIH${trimmed}`;
    } else {
      trimmed = `SIH26${trimmed.padStart(3, "0")}`;
    }
  }
  return trimmed;
}

/**
 * Validates PS ID format e.g. SIH26171, SIH26001, or 26171
 */
export function isValidPsIdFormat(psId: string): boolean {
  if (!psId) return false;
  const normalized = normalizePsId(psId);
  return /^SIH(26)?\d{3,5}$/i.test(normalized);
}

/**
 * Fetches the official SIH 2026 Problem Statement HTML page and parses all rows.
 * Returns a Map of PS ID to PSData.
 */
export async function fetchAllProblemStatements(forceRefresh = false): Promise<{
  psMap: Map<string, PSData>;
  fromCache: boolean;
  timestamp: Date;
  error?: string;
}> {
  const now = Date.now();

  // Return cached result if valid and not force-refreshed
  if (!forceRefresh && memoryCache && memoryCache.data.size > 0 && now - memoryCache.timestamp < CACHE_TTL_MS) {
    return {
      psMap: memoryCache.data,
      fromCache: true,
      timestamp: new Date(memoryCache.timestamp),
    };
  }

  try {
    const response = await axios.get(SIH_URL, {
      timeout: 8000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    const html = response.data;
    const $ = cheerio.load(html);
    const psMap = new Map<string, PSData>();

    // Parse main problem statement table rows
    $("table").each((_, tbl) => {
      $(tbl)
        .find("> tbody > tr")
        .each((__, tr) => {
          const tds = $(tr).children("td");
          if (tds.length >= 6) {
            // Direct columns in SIH2026 main table:
            // td[0]: Serial No
            // td[1]: Organization
            // td[2]: Problem Statement Title (contains modal inside)
            // td[3]: Category (Software / Hardware)
            // td[4]: PS ID (e.g. SIH26171)
            // td[5]: Submissions / Max (e.g. 27/500)
            // td[6]: Theme (e.g. Smart Automation)
            // td[7]: Deadline (e.g. 30 September 2026)

            const org = tds.eq(1).text().replace(/\s+/g, " ").trim();

            // Extract Title cleanly without nested modal text
            let title = "";
            const titleLink = tds.eq(2).find("a").first();
            if (titleLink.length > 0) {
              title = titleLink.text().replace(/\s+/g, " ").trim();
            }
            if (!title) {
              const clone = tds.eq(2).clone();
              clone.find(".modal, table, .style-2, script").remove();
              title = clone.text().replace(/\s+/g, " ").trim();
            }

            const category = tds.eq(3).text().replace(/\s+/g, " ").trim() || "Software";
            const psIdRaw = tds.eq(4).text().replace(/\s+/g, " ").trim().toUpperCase();
            const countText = tds.eq(5).text().replace(/\s+/g, " ").trim();
            const theme = tds.eq(6).text().replace(/\s+/g, " ").trim() || "General";
            const deadline = tds.eq(7).text().replace(/\s+/g, " ").trim() || "30 September 2026";

            let submitted = 0;
            let maximum = 500;
            const countMatch = countText.match(/(\d+)\s*\/\s*(\d+)/);
            if (countMatch) {
              submitted = parseInt(countMatch[1], 10);
              maximum = parseInt(countMatch[2], 10);
            }

            if (psIdRaw.startsWith("SIH") || /^\d+$/.test(psIdRaw)) {
              const normalizedId = normalizePsId(psIdRaw);
              const psObj: PSData = {
                psId: normalizedId,
                title: title || `Problem Statement ${normalizedId}`,
                organization: org || "SIH 2026",
                department: org || "SIH 2026",
                category,
                theme,
                submitted,
                maximum,
                deadline,
                rawCountString: `${submitted}/${maximum}`,
                lastFetched: new Date(),
              };

              psMap.set(normalizedId, psObj);
              // Also index by raw digits without prefix for flexible lookup
              const digitsOnly = normalizedId.replace(/\D/g, "");
              if (digitsOnly && digitsOnly !== normalizedId) {
                psMap.set(digitsOnly, psObj);
              }
            }
          }
        });
    });

    if (psMap.size > 0) {
      memoryCache = {
        data: psMap,
        timestamp: now,
      };
      return {
        psMap,
        fromCache: false,
        timestamp: new Date(now),
      };
    } else {
      throw new Error("Could not parse any Problem Statements from SIH portal table");
    }
  } catch (err: any) {
    console.error("[SIH Scraper Error]:", err.message);

    // Return stale cache if available
    if (memoryCache) {
      return {
        psMap: memoryCache.data,
        fromCache: true,
        timestamp: new Date(memoryCache.timestamp),
        error: `Fetch failed (${err.message}). Using cached data.`,
      };
    }

    return {
      psMap: new Map(),
      fromCache: false,
      timestamp: new Date(),
      error: err.message || "Failed to fetch SIH data",
    };
  }
}

/**
 * Gets details for a single Problem Statement by ID.
 */
export async function getProblemStatement(psIdInput: string): Promise<PSData | null> {
  const psId = normalizePsId(psIdInput);
  if (!psId) return null;

  const result = await fetchAllProblemStatements();
  const data = result.psMap.get(psId) || result.psMap.get(psIdInput.trim().toUpperCase());

  if (data) return data;

  // Search case-insensitively across keys
  let matchedVal: PSData | null = null;
  const targetId = psId.toUpperCase();
  const rawId = psIdInput.trim().toUpperCase();

  result.psMap.forEach((val, key) => {
    if (!matchedVal) {
      const uKey = key.toUpperCase();
      if (uKey === targetId || uKey === rawId) {
        matchedVal = val;
      }
    }
  });

  if (matchedVal) return matchedVal;

  // Fallback demo mode only if explicitly enabled
  if (process.env.DEMO_MODE === "true") {
    return {
      psId,
      title: `Simulated Demo Problem Statement (${psId})`,
      organization: "Ministry of Innovation (Demo)",
      department: "Research & Development",
      category: "Software",
      theme: "Smart Automation",
      submitted: 24,
      maximum: 500,
      deadline: "30 September 2026",
      rawCountString: "24/500",
      lastFetched: new Date(),
    };
  }

  return null;
}
