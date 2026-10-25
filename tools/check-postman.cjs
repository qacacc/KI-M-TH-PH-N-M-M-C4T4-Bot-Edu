const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const collectionPath = path.join(root, "postman/Campus_Assistant_Local_REST_API.postman_collection.json");
const environmentPath = path.join(root, "postman/Campus_Assistant_Local_REST_API.postman_environment.json");
for (const filename of [collectionPath, environmentPath]) {
  assert.ok(fs.existsSync(filename), `Thiếu Postman canonical: ${path.relative(root, filename)}`);
}
const collection = JSON.parse(fs.readFileSync(collectionPath, "utf8"));
const environment = JSON.parse(fs.readFileSync(environmentPath, "utf8"));
assert.equal(collection.info.name, "Campus Assistant Local REST API");
assert.ok(Array.isArray(collection.item) && collection.item.length > 0, "Collection phải có request");
assert.equal(environment.values.find(v => v.key === "BASE_URL")?.value, "http://127.0.0.1:47821");

// Reject credentials, personal identifiers, and real-looking bearer values in either canonical file.
const serialized = JSON.stringify({ collection, environment });
const secretPatterns = [
  /Bearer\s+(?!\{\{)[A-Za-z0-9._~+/=-]{12,}/i,
  /(?:api[_-]?key|access[_-]?token|refresh[_-]?token|password|secret|cookie)\s*["']?\s*[:=]\s*["']?[^"'\s{}]{8,}/i,
  /(?:mssv|student[_-]?code|phone|email)\s*["']?\s*[:=]\s*["']?[^"'\s{}]{5,}/i,
  /\b\d{9,12}\b/,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
];
for (const pattern of secretPatterns) assert.equal(pattern.test(serialized), false, `Secret/PII guard: ${pattern}`);

execFileSync(process.execPath, [path.join(root, "tools/sync-postman.cjs")], { stdio: "inherit" });
console.log(`Postman canonical PASS: ${collection.item.length} requests; environment loopback; secret guard PASS.`);
