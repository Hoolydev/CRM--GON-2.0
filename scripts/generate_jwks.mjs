import fs from "fs";
import path from "path";
import crypto from "crypto";

const pubPath = path.join(process.cwd(), "jwt_public.pem");
if (!fs.existsSync(pubPath)) {
  console.error("jwt_public.pem não encontrado");
  process.exit(1);
}

const pem = fs.readFileSync(pubPath, "utf8");
const key = crypto.createPublicKey(pem);
// Exporta como JWK (Node >=16 suporta)
const jwk = key.export({ format: "jwk" });

// Recomendações para assinatura RS256
jwk.use = "sig";
jwk.alg = "RS256";

// Constrói JWKS
const jwks = { keys: [jwk] };
process.stdout.write(JSON.stringify(jwks));