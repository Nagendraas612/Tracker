import * as cheerio from "cheerio";
import axios from "axios";
import https from "https";
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

const SIH_URLS = [
  "https://sih.gov.in/sih2026PS",
  "https://www.sih.gov.in/sih2026PS",
];

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: true,
});

const CACHE_TTL_MS = 15000;

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
      if (digits && digits !== norm) map.set(digits, data);
    });
  }
  return map;
}

let memoryCache: { data: Map<string, PSData>; timestamp: number } | null = {
  data: getInitialSeedMap(),
  timestamp: 0,
};

export function normalizePsId(input: string): string {
  if (!input) return "";
  let trimmed = input.trim().toUpperCase();
  if (/^\d{3,5}$/.test(trimmed)) {
    trimmed = trimmed.startsWith("26")
      ? `SIH${trimmed}`
      : `SIH26${trimmed.padStart(3, "0")}`;
  }
  return trimmed;
}

export function isValidPsIdFormat(psId: string): boolean {
  if (!psId) return false;
  return /^SIH(26)?\d{3,5}$/i.test(normalizePsId(psId));
}

function cleanCell($: cheerio.CheerioAPI, cell: any): string {
  return $(cell).text().replace(/\s+/g, " ").trim();
}

/** Fetches and parses the current SIH problem-statement table. */
export async function fetchAllProblemStatements(forceRefresh = false): Promise<{
  psMap: Map<string, PSData>;
  fromCache: boolean;
  timestamp: Date;
  error?: string;
}> {
  const now = Date.now();
  if (!forceRefresh && memoryCache && memoryCache.data.size > 0 && now - memoryCache.timestamp < CACHE_TTL_MS) {
    return { psMap: memoryCache.data, fromCache: true, timestamp: new Date(memoryCache.timestamp) };
  }

  let lastError: any = null;
  for (const baseUrl of SIH_URLS) {
    try {
      // The timestamp prevents an upstream/CDN cached HTML document from hiding new counts.
      let url = `${baseUrl}?tracker_ts=${Date.now()}`;
      
      if (process.env.SCRAPER_API_KEY) {
        url = `http://api.scraperapi.com?api_key=${process.env.SCRAPER_API_KEY}&url=${encodeURIComponent(url)}`;
      }

      const response = await axios.get(url, {
        httpsAgent,
        timeout: 45000,
        validateStatus: (status) => status >= 200 && status < 300,
        headers: {
          "User-Agent": "Mozilla/5.0 SIH-Tracker/1.0",
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "en-US,en;q=0.9",
          "Cache-Control": "no-cache, no-store, max-age=0",
          Pragma: "no-cache",
        },
      });

      if (typeof response.data !== "string" || response.data.length === 0) {
        throw new Error("SIH returned an empty response");
      }

      const $ = cheerio.load(response.data);
      const psMap = new Map<string, PSData>();

      $("table tr").each((_, tr) => {
        const cells = $(tr).children("td");
        // SIH currently has: serial, organisation, title, category, PS ID,
        // submission count, theme and deadline.
        if (cells.length < 8) return;

        const psIdRaw = cleanCell($, cells[4]).toUpperCase();
        if (!(psIdRaw.startsWith("SIH") || /^\d+$/.test(psIdRaw))) return;

        const titleCell = $(cells[2]).clone();
        titleCell.find(".modal, table, .style-2, script").remove();
        const title = titleCell.text().replace(/\s+/g, " ").trim();
        const countText = cleanCell($, cells[5]);
        const countMatch = countText.match(/(\d+)\s*\/\s*(\d+)/);
        if (!countMatch) return;

        const normalizedId = normalizePsId(psIdRaw);
        const data: PSData = {
          psId: normalizedId,
          title: title || `Problem Statement ${normalizedId}`,
          organization: cleanCell($, cells[1]) || "SIH 2026",
          department: cleanCell($, cells[1]) || "SIH 2026",
          category: cleanCell($, cells[3]) || "Software",
          theme: cleanCell($, cells[6]) || "General",
          submitted: Number.parseInt(countMatch[1], 10),
          maximum: Number.parseInt(countMatch[2], 10),
          deadline: cleanCell($, cells[7]) || "30 September 2026",
          rawCountString: `${countMatch[1]}/${countMatch[2]}`,
          lastFetched: new Date(),
        };

        psMap.set(normalizedId, data);
        const digitsOnly = normalizedId.replace(/\D/g, "");
        if (digitsOnly && digitsOnly !== normalizedId) psMap.set(digitsOnly, data);
      });

      if (psMap.size > 0) {
        memoryCache = { data: psMap, timestamp: Date.now() };
        return { psMap, fromCache: false, timestamp: new Date() };
      }
      throw new Error("SIH response did not contain a recognised problem-statement table");
    } catch (err: any) {
      lastError = err;
      console.error(`[SIH Scraper Error on ${baseUrl}]:`, err.message);
    }
  }

  if (memoryCache && memoryCache.data.size > 0) {
    return {
      psMap: memoryCache.data,
      fromCache: true,
      timestamp: new Date(memoryCache.timestamp || Date.now()),
      error: lastError?.message || "Live fetch failed, using cached snapshot.",
    };
  }

  return { psMap: new Map(), fromCache: false, timestamp: new Date(), error: lastError?.message || "Failed to fetch SIH data" };
}

export async function getProblemStatement(psIdInput: string, forceRefresh = true): Promise<PSData | null> {
  const psId = normalizePsId(psIdInput);
  if (!psId) return null;
  const result = await fetchAllProblemStatements(forceRefresh);
  const data = result.psMap.get(psId) || result.psMap.get(psIdInput.trim().toUpperCase());
  if (data) return data;

  let matched: PSData | null = null;
  result.psMap.forEach((value, key) => {
    if (!matched && (key.toUpperCase() === psId || key.toUpperCase() === psIdInput.trim().toUpperCase())) matched = value;
  });
  if (matched) return matched;

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
