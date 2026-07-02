import dotenv from "dotenv";
import { resolve } from "node:path";

/** Raíz del monorepo (uniwai/) desde apps/api-core/src/lib */
const monorepoRoot = resolve(import.meta.dirname, "../../../..");

dotenv.config({ path: resolve(monorepoRoot, ".env.local") });
dotenv.config({ path: resolve(monorepoRoot, ".env") });
dotenv.config({ path: resolve(import.meta.dirname, "../../.env") });
