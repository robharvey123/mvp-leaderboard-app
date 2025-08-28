// Shims the legacy import path used by ImportPage.
// Wraps the real save function in the expected API.
import { saveParsedMatches } from "@/lib/saveParsedMatches";
import type { ParsedMatch } from "@/lib/parsePlayCricketPdf";

export async function ingestParsedToDb(match: ParsedMatch) {
  // ImportPage expects to call ingestParsedToDb(parsed)
  // The underlying lib saves arrays, so we adapt here.
  return saveParsedMatches([match]);
}
