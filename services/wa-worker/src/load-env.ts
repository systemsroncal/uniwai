import dotenv from "dotenv";
import { resolve } from "node:path";

const monorepoRoot = resolve(import.meta.dirname, "../../..");

dotenv.config({ path: resolve(monorepoRoot, ".env.local") });
dotenv.config({ path: resolve(monorepoRoot, ".env") });
