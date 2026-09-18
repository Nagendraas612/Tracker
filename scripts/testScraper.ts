import { fetchAllProblemStatements } from "../services/sihScraper";

async function main() {
  console.log("==========================================");
  console.log("🧪 Testing Live SIH Problem Statement Scraper");
  console.log("==========================================");

  const startTime = Date.now();
  const result = await fetchAllProblemStatements(true);
  const elapsed = Date.now() - startTime;

  console.log(`Fetch completed in ${elapsed}ms`);
  console.log(`From Cache: ${result.fromCache}`);
  console.log(`Total PS Parsed: ${result.psMap.size}`);

  if (result.error) {
    console.warn(`Scraper Warning/Error: ${result.error}`);
  }

  const sampleIds = ["SIH26171", "SIH26001", "SIH26005", "SIH26106", "SIH26196"];
  console.log("\nSample Problem Statement Counts:");
  console.log("------------------------------------------");

  sampleIds.forEach((id) => {
    const data = result.psMap.get(id);
    if (data) {
      console.log(`✅ ${data.psId} | Submitted: ${data.submitted}/${data.maximum} | Category: ${data.category} | Title: ${data.title.substring(0, 45)}...`);
    } else {
      console.log(`❌ ${id} | Not Found`);
    }
  });

  console.log("------------------------------------------");
}

main().catch(console.error);
