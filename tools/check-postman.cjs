const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { execFileSync } = require("node:child_process");
const root = path.resolve(__dirname, "..");
const collection = JSON.parse(fs.readFileSync(path.join(root, "Campus_Assistant_API.postman_collection.json"), "utf8"));
const environment = JSON.parse(fs.readFileSync(path.join(root, "postman/UTH.local-template.postman_environment.json"), "utf8"));
const before = collection.event.find(e => e.listen === "prerequest").script.exec.join("\n");
const after = collection.event.find(e => e.listen === "test").script.exec.join("\n");
let checks = 0;
const check = (name, run) => { run(); checks++; console.log("PASS:", name); };

async function probe(overrides = {}) {
  const config = {
    BASE_URL: "https://portal.ut.edu.vn", SCHEDULE_DATE: "2026-10-10",
    LIVE_REQUESTS_ENABLED: "true", ACCOUNT_CONSENT: "true",
    PROFILE_REQUEST_REVIEWED: "true", SCHEDULE_REQUEST_REVIEWED: "true", EXAMS_REQUEST_REVIEWED: "true",
    ...overrides.variables,
  };
  let skipped = false;
  let vaultCalls = 0;
  const pm = {
    variables: { get: key => config[key], replaceIn: value => value.replace(/\{\{(\w+)\}\}/g, (_, key) => config[key] ?? "") },
    environment: { get: key => config[key] },
    request: {
      method: overrides.method || "GET",
      url: { toString: () => overrides.url || "{{BASE_URL}}/api/v1/user/getSummaryProfile" },
      headers: { get: () => overrides.header ?? "Bearer {{vault:uth-portal-token}}" },
    },
    execution: { skipRequest: () => { skipped = true; } },
    vault: overrides.noVault ? undefined : { get: async () => {
      vaultCalls++;
      if (overrides.vaultError) throw Error("fixture denied");
      return overrides.token ?? "synthetic-fixture-not-a-real-token";
    } },
  };
  let rejected = false;
  try { await vm.runInNewContext("(async () => {\n" + before + "\n})()", { pm, Date, Error }, { timeout: 1000 }); }
  catch { rejected = true; }
  return { skipped, rejected, vaultCalls };
}

function response(code, contentType, body) {
  const failed = [];
  const pm = {
    response: { code, headers: { get: () => contentType }, text: () => body, json: () => JSON.parse(body) },
    expect: actual => ({ to: { equal: expected => assert.equal(actual, expected) } }),
    test: (name, run) => { try { run(); } catch { failed.push(name); } },
  };
  vm.runInNewContext(after, { pm }, { timeout: 1000 });
  return failed;
}

(async () => {
  execFileSync(process.execPath, [path.join(root, "tools/sync-postman.cjs")], { stdio: "inherit" });
  check("3 request GET và guard cấp collection", () => {
    assert.equal(collection.item.length, 3);
    for (const item of collection.item) {
      assert.equal(item.request.method, "GET");
      assert.deepEqual(item.protocolProfileBehavior, { followRedirects: false, disableCookies: true });
      assert.equal(item.request.header.find(h => h.key === "Authorization").value, "Bearer {{vault:uth-portal-token}}");
      assert.equal(item.request.auth.type, "noauth");
    }
    assert.equal(collection.variable.some(v => /token|cookie|password/i.test(v.key)), false);
    assert.equal(collection.item[1].request.url.query[0].value, "{{SCHEDULE_DATE}}");
  });
  check("template không secret, consent/live/review mặc định false", () => {
    for (const value of environment.values) {
      assert.equal(/token|cookie|password/i.test(value.key), false);
      if (/ENABLED|CONSENT|REVIEWED/.test(value.key)) assert.equal(value.value, "false");
    }
  });
  for (const domain of ["PROFILE", "SCHEDULE", "EXAMS"]) {
    const item = collection.item[["PROFILE", "SCHEDULE", "EXAMS"].indexOf(domain)];
    const result = await probe({ url: item.request.url.raw });
    check("cho phép probe synthetic đã review " + domain, () => assert.deepEqual(result, { skipped: false, rejected: false, vaultCalls: 1 }));
  }
  const blocked = [
    ["live tắt", { variables: { LIVE_REQUESTS_ENABLED: "false" } }],
    ["thiếu consent", { variables: { ACCOUNT_CONSENT: "false" } }],
    ["host lạ", { variables: { BASE_URL: "https://example.invalid" } }],
    ["endpoint chưa review", { variables: { PROFILE_REQUEST_REVIEWED: "false" } }],
    ["method ghi", { method: "POST" }],
    ["route lạ", { url: "https://portal.ut.edu.vn/api/unknown" }],
    ["query ngoài scope", { url: "https://portal.ut.edu.vn/api/v1/user/getSummaryProfile?account=other" }],
    ["ngày không tồn tại", { url: "{{BASE_URL}}/api/v1/lichhoc/thang?date={{SCHEDULE_DATE}}", variables: { SCHEDULE_DATE: "2026-02-30" } }],
    ["ngày trống", { url: "{{BASE_URL}}/api/v1/lichhoc/thang?date={{SCHEDULE_DATE}}", variables: { SCHEDULE_DATE: "" } }],
    ["vault không hỗ trợ", { noVault: true }],
    ["vault từ chối quyền", { vaultError: true }],
    ["token trống", { token: "" }],
    ["token có newline", { token: "fixture\r\nheader" }],
    ["header không dùng vault", { header: "Bearer fixture" }],
  ];
  for (const [name, input] of blocked) {
    const result = await probe(input);
    check("chặn " + name, () => { assert.equal(result.skipped, true); assert.equal(result.rejected, true); });
  }
  check("HTTP JSON object synthetic qua transport checks", () => assert.equal(response(200, "application/json", '{"fixture":true}').length, 0));
  check("[] qua transport không đồng nghĩa empty nghiệp vụ verified", () => assert.equal(response(200, "application/json", "[]").length, 0));
  for (const [name, code, type, body] of [
    ["HTML login HTTP 200", 200, "text/html", "<html>login</html>"],
    ["HTML giả Content-Type JSON", 200, "application/json", "<!doctype html><html>login</html>"],
    ["unauthorized", 401, "application/json", '{"fixtureError":true}'],
    ["forbidden", 403, "application/json", "{}"],
    ["redirect", 302, "text/html", "redirect"],
    ["server error", 500, "application/json", "{}"],
    ["JSON lỗi", 200, "application/json", "{"],
    ["null", 200, "application/json", "null"],
  ]) check("response fail " + name, () => assert.ok(response(code, type, body).length > 0));
  console.log(`${checks} kiểm tra offline PASS; không HTTP, không fixture trường thật, không chứng nhận business contract.`);
})().catch(() => { console.error("Postman offline check FAIL; kiểm tra cấu hình/scripts, không in payload bí mật."); process.exitCode = 1; });
