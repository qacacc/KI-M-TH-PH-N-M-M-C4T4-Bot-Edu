const assert = require("node:assert/strict");

const LOOPBACK_BASE_URL = "http://127.0.0.1:47821";
const SENSITIVE_NAME = /(?:api[_-]?key|access[_-]?token|refresh[_-]?token|password|secret|cookie|mssv|student[_-]?code|phone|email)/i;

function assertNoSensitiveData(value) {
  function visit(item, location = "root") {
    if (Array.isArray(item)) return item.forEach((entry, index) => visit(entry, `${location}[${index}]`));
    if (!item || typeof item !== "object") return;

    // Postman environment rows separate variable names and values into key/value fields.
    if (typeof item.key === "string" && SENSITIVE_NAME.test(item.key)) {
      const storedValue = item.value;
      assert.ok(typeof storedValue === "string" && (!storedValue.trim() || /^\{\{[^{}]+\}\}$/.test(storedValue)),
        `Trường nhạy cảm phải để trống hoặc dùng placeholder: ${location}.${item.key}`);
    }

    for (const [key, child] of Object.entries(item)) {
      if (typeof child === "string" && SENSITIVE_NAME.test(key)) {
        assert.ok(!child.trim() || /^\{\{[^{}]+\}\}$/.test(child),
          `Trường nhạy cảm phải để trống hoặc dùng placeholder: ${location}.${key}`);
      }
      visit(child, `${location}.${key}`);
    }
  }

  visit(value);
  const serialized = JSON.stringify(value);
  for (const pattern of [
    /Bearer\s+(?!\{\{)[A-Za-z0-9._~+/=-]{8,}/i,
    /\b\d{8,12}\b/,
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  ]) assert.equal(pattern.test(serialized), false, `Secret/PII guard: ${pattern}`);
}

function assertLoopbackCollection(collection, environment) {
  const environmentBase = environment.values.find(value => value.key === "BASE_URL")?.value;
  const collectionBase = collection.variable.find(value => value.key === "BASE_URL")?.value;
  assert.equal(environmentBase, LOOPBACK_BASE_URL, "Environment BASE_URL phải trỏ loopback.");
  assert.equal(collectionBase, environmentBase, "Collection và Environment BASE_URL phải trùng nhau.");

  for (const item of collection.item || []) {
    const rawUrl = typeof item.request?.url === "string" ? item.request.url : item.request?.url?.raw;
    assert.ok(typeof rawUrl === "string" && rawUrl.startsWith("{{BASE_URL}}/"),
      `Request phải đi qua BASE_URL loopback: ${item.name}`);
    const resolved = new URL(rawUrl.replace("{{BASE_URL}}", collectionBase));
    assert.equal(resolved.origin, LOOPBACK_BASE_URL, `Request không được trỏ ra host ngoài: ${item.name}`);
  }
}

module.exports = { assertLoopbackCollection, assertNoSensitiveData, LOOPBACK_BASE_URL };
