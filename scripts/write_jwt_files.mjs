import fs from "fs";
import path from "path";

const root = process.cwd();
const envPath = path.join(root, ".env.local");
const privPath = path.join(root, "jwt_private.pem");
const pubPath = path.join(root, "jwt_public.pem");

function readEnv() {
  if (!fs.existsSync(envPath)) {
    throw new Error(".env.local não encontrado");
  }
  return fs.readFileSync(envPath, "utf8");
}

function extract(name, contents) {
  const re = new RegExp(`^${name}=(.*)$`, "m");
  const m = contents.match(re);
  if (!m) throw new Error(`Variável ${name} não encontrada em .env.local`);
  let val = m[1];
  if (val.startsWith('"') && val.endsWith('"')) {
    val = val.slice(1, -1);
  }
  return val.replace(/\\n/g, "\n");
}

function main() {
  const env = readEnv();
  const priv = extract("JWT_PRIVATE_KEY", env);
  const pub = extract("JWT_PUBLIC_KEY", env);
  fs.writeFileSync(privPath, priv, "utf8");
  fs.writeFileSync(pubPath, pub, "utf8");
  console.log("JWT keys gravadas em jwt_private.pem e jwt_public.pem");
}

main();