import * as cheerio from "cheerio";
import axios from "axios";

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

let memoryCache: {
  data: Map<string, PSData>;
  timestamp: number;
} | null = null;

/**
 * Normalizes a Problem Statement ID to uppercase format e.g. "sih26171" -> "SIH26171"
 */
export function normalizePsId(input: string): string {
  if (!input) return "";
  return input.trim().toUpperCase();
}

/**
 * Validates PS ID format e.g. SIH26171 or SIH26001
 */
export function isValidPsIdFormat(psId: string): boolean {
  return /^SIH26\d{3,5}$/i.test(psId.trim());
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
  if (!forceRefresh && memoryCache && now - memoryCache.timestamp < CACHE_TTL_MS) {
    return {
      psMap: memoryCache.data,
      fromCache: true,
      timestamp: new Date(memoryCache.timestamp),
    };
  }

  try {
    const response = await axios.get(SIH_URL, {
      timeout: 20000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    const html = response.data;
    const $ = cheerio.load(html);
    const psMap = new Map<string, PSData>();

    // Parse table rows
    $("table tr").each((_, tr) => {
      const tds = $(tr).find("td");
      if (tds.length < 3) return;

      let rowText = "";
      const cellValues: string[] = [];

      tds.each((__, td) => {
        const text = $(td).text().trim();
        cellValues.push(text);
        rowText += " " + text;
      });

      // Find PS ID matching pattern e.g. SIH26171
      const psMatch = rowText.match(/\b(SIH26\d{3,5})\b/i);
      if (!psMatch) return;

      const psId = psMatch[1].toUpperCase();

      // Find cell with "submitted/maximum" format e.g. "26/500"
      let submitted = 0;
      let maximum = 500;
      let rawCountString = "0/500";

      for (const cell of cellValues) {
        const countMatch = cell.match(/^(\d+)\s*\/\s*(\d+)$/);
        if (countMatch) {
          submitted = parseInt(countMatch[1], 10);
          maximum = parseInt(countMatch[2], 10);
          rawCountString = `${submitted}/${maximum}`;
          break;
        }
      }

      // Extract details from row cells
      // Typically: [Index, Org, Title, Category, PS_ID, Submitted/Max, Theme, Deadline]
      let organization = "SIH 2026";
      let title = `Problem Statement ${psId}`;
      let category = "Software";
      let theme = "General";
      let deadline = "30 September 2026";

      // Attempt to refine fields from cells
      cellValues.forEach((val) => {
        if (val.toLowerCase().includes("hardware")) category = "Hardware";
        if (val.toLowerCase().includes("software")) category = "Software";
        if (/\d{1,2}\s+[A-Za-z]+\s+202\d/.test(val)) deadline = val;
      });

      // Org is usually early in the row if cell contains company/ministry
      if (cellValues[1] && cellValues[1].length > 2 && !cellValues[1].match(/^\d+$/)) {
        organization = cellValues[1];
      }

      // Title usually inside cell 2 or modal link
      const titleLink = $(tr).find("a[data-toggle='modal'], a.ps-title").first();
      if (titleLink.length > 0) {
        title = titleLink.text().trim() || title;
      } else if (cellValues[2] && cellValues[2].length > 5) {
        title = cellValues[2].replace(/\s+/g, " ");
      }

      // Theme is usually after count
      const countIdx = cellValues.findIndex((c) => /^\d+\/\d+$/.test(c));
      if (countIdx !== -1 && cellValues[countIdx + 1]) {
        theme = cellValues[countIdx + 1];
      }

      psMap.set(psId, {
        psId,
        title,
        organization,
        department: organization,
        category,
        theme,
        submitted,
        maximum,
        deadline,
        rawCountString,
        lastFetched: new Date(),
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
      // Fallback if table parsing returned empty
      throw new Error("Could not parse any Problem Statements from SIH HTML table");
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
  const data = result.psMap.get(psId);

  if (data) return data;

  // Fallback demo mode check if requested
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
