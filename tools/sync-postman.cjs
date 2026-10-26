const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const collectionPath = path.join(root, "postman/Campus_Assistant_Local_REST_API.postman_collection.json");
const environmentPath = path.join(root, "postman/Campus_Assistant_Local_REST_API.postman_environment.json");
const collection = JSON.parse(fs.readFileSync(collectionPath, "utf8"));
const environment = JSON.parse(fs.readFileSync(environmentPath, "utf8"));
const directory = path.join(root, "postman/collections/Campus Assistant Local REST API");
const write = process.argv.includes("--write");
let stale = false;

function yamlString(value) {
  return JSON.stringify(String(value));
}

function requestYaml(item, index) {
  const request = item.request;
  const url = typeof request.url === "string" ? request.url : request.url.raw;
  const scripts = (item.event || []).filter(event => event.listen === "test").flatMap(event => event.script.exec || []);
  const headers = (request.header || []).filter(header => !header.disabled).map(header => [header.key, header.value]);
  return [
    "$kind: http-request",
    `url: ${yamlString(url)}`,
    `method: ${request.method}`,
    ...(headers.length ? ["headers:", ...headers.map(([key, value]) => `  ${JSON.stringify(key)}: ${yamlString(value)}`)] : []),
    ...(request.auth ? [`auth: ${yamlString(JSON.stringify(request.auth))}`] : []),
    ...(request.body ? [`body: ${yamlString(JSON.stringify(request.body))}`] : []),
    "scripts:",
    "  - type: afterResponse",
    "    code: | -".replace("| -", "|-"),
    ...scripts.map(line => `      ${line}`),
    "    language: text/javascript",
    `order: ${(index + 1) * 1000}`,
    "",
  ].join("\n");
}

const baseUrl = environment.values.find(value => value.key === "BASE_URL")?.value;
const variables = collection.variable.map(variable => `  ${variable.key}: ${yamlString(variable.value)}`).join("\n");
const description = collection.info.description.replace(/\r?\n/g, " ");
const outputs = new Map([
  [path.join(directory, ".resources/definition.yaml"), `$kind: collection\ndescription: ${description}\nvariables:\n${variables}\n`],
]);
if (baseUrl !== "http://127.0.0.1:47821") throw new Error("Environment canonical phải trỏ loopback 127.0.0.1:47821.");
for (const [index, item] of collection.item.entries()) {
  if (!item?.name || /[\\/]|\.\./.test(item.name)) throw new Error("Tên request không an toàn.");
  outputs.set(path.join(directory, `${item.name}.request.yaml`), requestYaml(item, index));
}

function listRequestMirrors(folder) {
  if (!fs.existsSync(folder)) return [];
  return fs.readdirSync(folder, { withFileTypes: true }).flatMap(entry => {
    const filename = path.join(folder, entry.name);
    return entry.isDirectory() ? listRequestMirrors(filename) : (entry.isFile() && entry.name.endsWith(".request.yaml") ? [filename] : []);
  });
}
const expectedFiles = new Set(outputs.keys());
for (const filename of listRequestMirrors(directory)) {
  if (expectedFiles.has(filename)) continue;
  stale = true;
  console.error(`Postman mirror thừa, cần rà soát/xóa tường minh: ${path.relative(root, filename)}`);
}

for (const [filename, expected] of outputs) {
  const relative = path.relative(root, filename);
  const current = fs.existsSync(filename) ? fs.readFileSync(filename, "utf8").replace(/\r\n/g, "\n") : null;
  if (current === expected) continue;
  if (write) {
    fs.mkdirSync(path.dirname(filename), { recursive: true });
    fs.writeFileSync(filename, expected, "utf8");
  } else {
    stale = true;
    console.error(`Postman mirror chưa đồng bộ: ${relative}`);
  }
}

if (stale) process.exitCode = 1;
else console.log(`Postman JSON canonical và ${outputs.size} mirror local đồng bộ; không tạo/xóa bản sao khác, không gửi HTTP.`);
