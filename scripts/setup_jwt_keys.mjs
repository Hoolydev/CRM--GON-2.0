import fs from "fs";
import path from "path";
import { generateKeyPairSync } from "crypto";

const root = process.cwd();
const envPath = path.join(root, ".env.local");

function ensureEnvFile() {
  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, "", "utf8");
  }
}

function readEnv() {
  ensureEnvFile();
  return fs.readFileSync(envPath, "utf8");
}

function hasVar(contents, name) {
  const regex = new RegExp(`^${name}=`, "m");
  return regex.test(contents);
}

function appendVar(name, value) {
  const line = `${name}=${JSON.stringify(value)}\n`;
  fs.appendFileSync(envPath, line, "utf8");
}

function main() {
  let contents = readEnv();

  // Ensure CONVEX_SITE_URL points to local Vite dev server
  if (!hasVar(contents, "CONVEX_SITE_URL")) {
    appendVar("CONVEX_SITE_URL", "http://localhost:5173");
  }

  // Generate JWT key pair if missing
  const needPrivate = !hasVar(contents, "JWT_PRIVATE_KEY");
  const needPublic = !hasVar(contents, "JWT_PUBLIC_KEY");

  if (needPrivate || needPublic) {
    const { privateKey, publicKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });

    if (needPrivate) appendVar("JWT_PRIVATE_KEY", privateKey);
    if (needPublic) appendVar("JWT_PUBLIC_KEY", publicKey);
  }

  console.log(".env.local updated with CONVEX_SITE_URL and JWT keys (if missing).");
}

main();