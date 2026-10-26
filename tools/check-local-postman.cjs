const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { assertLoopbackCollection, assertNoSensitiveData } = require("./postman-guards.cjs");

const root = path.resolve(__dirname, "..");
const collectionPath = path.join(root, "postman/Campus_Assistant_Local_REST_API.postman_collection.json");
const environmentPath = path.join(root, "postman/Campus_Assistant_Local_REST_API.postman_environment.json");
const collection = JSON.parse(fs.readFileSync(collectionPath, "utf8"));
const environment = JSON.parse(fs.readFileSync(environmentPath, "utf8"));
const items = collection.item;
let checks = 0;
const check = (name, fn) => {
  fn();
  checks += 1;
  console.log("PASS:", name);
};

check("Collection local REST tồn tại", () => {
  assert.equal(collection.info.name, "Campus Assistant Local REST API");
  assert.equal(items.length, 9);
});

check("Environment dùng loopback", () => {
  const base = environment.values.find(value => value.key === "BASE_URL");
  assert.equal(base.value, "http://127.0.0.1:47821");
  assert.equal(environment.values.some(value => /token|cookie|password|secret/i.test(value.key)), false);
});

const expectedRoutes = [
  "/api/v1/health",
  "/api/v1/profile",
  "/api/v1/announcements",
  "/api/v1/documents",
  "/api/v1/schedule",
  "/api/v1/exams",
  "/api/v1/sync",
  "/api/v1/sync/status",
];
check("Đủ route cho bài nộp", () => {
  const routes = items.map(item => item.request.url);
  for (const route of expectedRoutes) assert.ok(routes.some(url => url.includes(route)), route);
});

check("Request có test script", () => {
  for (const item of items) {
    assert.ok(item.event?.some(event => event.listen === "test"), item.name);
  }
});

check("Không có token/PII trong collection", () => {
  const text = JSON.stringify(collection);
  assert.equal(/Bearer\s+[^<{]|jwt|cookie|password|mssv\s*[:=]\s*\d{6,}/i.test(text), false);
});

check("Có kiểm thử empty result và profile chưa kết nối", () => {
  const names = items.map(item => item.name);
  assert.ok(names.includes("Profile - not connected"));
  assert.ok(names.includes("Documents - valid empty result"));
});

check("Mirror bảo toàn header và body từ request canonical", () => {
  const syncRequest = items.find(item => item.name.startsWith("Sync -"));
  assert.ok(syncRequest.request.header.some(header => header.key === "Content-Type"));
  assert.equal(syncRequest.request.body?.mode, "raw");
  const mirrorPath = path.join(root, "postman/collections/Campus Assistant Local REST API/Sync - blocked until UTH contract is verified.request.yaml");
  const mirror = fs.readFileSync(mirrorPath, "utf8");
  assert.match(mirror, /headers:\s*\r?\n\s+"Content-Type": "application\/json"/);
  assert.ok(mirror.includes(`body: ${JSON.stringify(JSON.stringify(syncRequest.request.body))}`));
});

check("Guard bắt token/MSSV nằm trong cặp key-value của Environment", () => {
  assert.throws(() => assertNoSensitiveData({ values: [{ key: "STUDENT_CODE", value: "12345678" }] }), /Trường nhạy cảm/);
  assert.throws(() => assertNoSensitiveData({ values: [{ key: "ACCESS_TOKEN", value: "plain-text-token-value" }] }), /Trường nhạy cảm/);
  assert.doesNotThrow(() => assertNoSensitiveData({ values: [{ key: "ACCESS_TOKEN", value: "{{ACCESS_TOKEN}}" }] }));
});

check("Guard từ chối collection URL khác Environment loopback", () => {
  const localEnvironment = { values: [{ key: "BASE_URL", value: "http://127.0.0.1:47821" }] };
  const externalCollection = {
    variable: [{ key: "BASE_URL", value: "https://example.invalid" }],
    item: [{ name: "leak", request: { method: "GET", url: "{{BASE_URL}}/api/v1/profile" } }],
  };
  assert.throws(() => assertLoopbackCollection(externalCollection, localEnvironment), /phải trùng nhau/);
});

console.log(`${checks} kiểm tra local Postman PASS; không gửi HTTP và không xác nhận contract UTH.`);
