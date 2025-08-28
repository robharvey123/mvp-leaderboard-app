// Shims the legacy import path used by ImportPage.
// Forwards to the real parser in lib.
export { parsePlayCricketPdf } from "@/lib/parsePlayCricketPdf";
export type {
  ParsedMatch,
  ParsedPlayer,
  PlayerExtras,
} from "@/lib/parsePlayCricketPdf";
