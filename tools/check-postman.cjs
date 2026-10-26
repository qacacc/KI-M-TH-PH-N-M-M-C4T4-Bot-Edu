const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { assertLoopbackCollection, assertNoSensitiveData } = require("./postman-guards.cjs");

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
assertLoopbackCollection(collection, environment);
assertNoSensitiveData({ collection, environment });

execFileSync(process.execPath, [path.join(root, "tools/sync-postman.cjs")], { stdio: "inherit" });
console.log(`Postman canonical PASS: ${collection.item.length} requests; environment loopback; secret guard PASS.`);
