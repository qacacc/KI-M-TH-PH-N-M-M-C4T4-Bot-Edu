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

// Quét key/value có cấu trúc để phát hiện cả trường nhạy cảm nằm cạnh giá trị.
function scanSensitiveData(value, location = "root") {
  if (Array.isArray(value)) return value.forEach((item, index) => scanSensitiveData(item, `${location}[${index}]`));
  if (!value || typeof value !== "object") return;
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === "string" && /(?:api[_-]?key|access[_-]?token|refresh[_-]?token|password|secret|cookie|mssv|student[_-]?code|phone|email)/i.test(key)) {
      assert.ok(!item.trim() || /^\{\{[^{}]+\}\}$/.test(item), `Trường nhạy cảm phải rỗng hoặc dùng placeholder: ${location}.${key}`);
    }
    scanSensitiveData(item, `${location}.${key}`);
  }
}
scanSensitiveData({ collection, environment });
const serialized = JSON.stringify({ collection, environment });
const secretPatterns = [
  /Bearer\s+(?!\{\{)[A-Za-z0-9._~+/=-]{8,}/i,
  /\b\d{9,12}\b/,
  /\b\d{8}\b/,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
];
for (const pattern of secretPatterns) assert.equal(pattern.test(serialized), false, `Secret/PII guard: ${pattern}`);

for (const item of collection.item) {
  const rawUrl = typeof item.request.url === "string" ? item.request.url : item.request.url?.raw;
  assert.ok(typeof rawUrl === "string" && rawUrl.startsWith("{{BASE_URL}}/"), `Request phải đi qua BASE_URL loopback: ${item.name}`);
  const resolved = new URL(rawUrl.replace("{{BASE_URL}}", environment.values.find(v => v.key === "BASE_URL").value));
  assert.equal(resolved.origin, "http://127.0.0.1:47821", `Request không được trỏ ra host ngoài: ${item.name}`);
}

execFileSync(process.execPath, [path.join(root, "tools/sync-postman.cjs")], { stdio: "inherit" });
console.log(`Postman canonical PASS: ${collection.item.length} requests; environment loopback; secret guard PASS.`);
