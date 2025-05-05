// createEnv.js
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, ".env");

const defaultEnvContent = `VITE_APP_VERSION=v0.0.1
GENERATE_SOURCEMAP=false

## PUBLIC URL
VITE_API_URL=http://localhost:8000
VITE_APP_BASE_NAME=/
`;

if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, defaultEnvContent);
  console.log(".env file created with default content.");
} else {
  console.log(".env file already exists.");
}
