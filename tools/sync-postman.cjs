const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const canonical = path.join(root, "Campus_Assistant_API.postman_collection.json");
const collection = JSON.parse(fs.readFileSync(canonical, "utf8"));
const before = fs.readFileSync(path.join(root, "postman/scripts/uth-before-request.js"), "utf8").trimEnd();
const after = fs.readFileSync(path.join(root, "postman/scripts/uth-after-response.js"), "utf8").trimEnd();
// Request/method vẫn lấy từ JSON gốc; không tự tạo contract hoặc endpoint mới.
collection.info.description = "CA-080: probe API UTH chưa verified. JSON là nguồn chuẩn; mặc định chặn live. Đọc postman/README.md trước khi nhập token vào Local Vault.";
collection.variable = [
  { key: "BASE_URL", value: "https://portal.ut.edu.vn", type: "string" },
  { key: "SCHEDULE_DATE", value: "", type: "string" },
];
collection.event = [
  { listen: "prerequest", script: { type: "text/javascript", exec: before.split(/\r?\n/) } },
  { listen: "test", script: { type: "text/javascript", exec: after.split(/\r?\n/) } },
];
const outputs = new Map();
const directories = ["Campus Assistant Local - UTH Portal APIs", "Campus Assistant Local - UTH Portal APIs Copy", "Campus Assistant Local - UTH Portal APIs Copy 2"];
// Format đã đối chiếu với YAML do Postman Desktop sinh khi import JSON.
const scripts = [
  "scripts:", "  - type: http:beforeRequest", "    language: text/javascript", "    code: |-",
  ...before.split(/\r?\n/).map(line => line ? "      " + line : ""),
  "  - type: http:afterResponse", "    language: text/javascript", "    code: |-",
  ...after.split(/\r?\n/).map(line => line ? "      " + line : ""),
];
for (const [index, item] of collection.item.entries()) {
  if (typeof item.name !== "string" || /[\\/]|\.\./.test(item.name)) throw new Error("Tên request không an toàn cho YAML path.");
  const request = item.request;
  request.auth = { type: "noauth" };
  request.header = [
    { key: "Authorization", value: "Bearer {{vault:uth-portal-token}}", type: "text" },
    { key: "Accept", value: "application/json", type: "text" },
  ];
  request.description = "UNKNOWN: endpoint/method/auth/schema kế thừa collection cũ, phải đối chiếu portal thật. Chưa dùng làm contract connector.";
  request.url.raw = request.url.raw.replace(/date=\d{4}-\d{2}-\d{2}/, "date={{SCHEDULE_DATE}}");
  for (const query of request.url.query || []) if (query.key === "date") query.value = "{{SCHEDULE_DATE}}";
  item.protocolProfileBehavior = { followRedirects: false, disableCookies: true };
  const yaml = [
    "# Tự sinh từ JSON chuẩn; không chỉnh riêng bản Copy.",
    "$kind: http-request", `description: ${JSON.stringify(request.description)}`,
    `url: ${JSON.stringify(request.url.raw)}`, `method: ${request.method}`,
    "headers:", '  Authorization: "Bearer {{vault:uth-portal-token}}"', '  Accept: "application/json"',
    ...(request.url.query?.length ? ["queryParams:", ...request.url.query.flatMap(q => [`  - key: ${JSON.stringify(q.key)}`, `    value: ${JSON.stringify(q.value)}`])] : []),
    "auth:", "  type: noauth", "settings:", "  followRedirects: false", "  disableCookies: true",
    `order: ${(index + 1) * 1000}`, "",
  ].join("\n");
  for (const directory of directories) outputs.set(`postman/collections/${directory}/${item.name}.request.yaml`, yaml);
}
const definition = '$kind: collection\ndescription: "Mirror tự sinh; JSON gốc là nguồn chuẩn, contract UTH vẫn UNKNOWN. Không thêm token vào variables."\nvariables:\n  BASE_URL: https://portal.ut.edu.vn\n  SCHEDULE_DATE: ""\n' + scripts.join("\n") + "\n";
for (const directory of directories) outputs.set(`postman/collections/${directory}/.resources/definition.yaml`, definition);
outputs.set("Campus_Assistant_API.postman_collection.json", JSON.stringify(collection, null, 2) + "\n");
let stale = false;
for (const [relative, content] of outputs) {
  const filename = path.join(root, relative);
  const same = fs.existsSync(filename) && fs.readFileSync(filename, "utf8").replace(/\r\n/g, "\n") === content;
  if (!same && process.argv.includes("--write")) {
    fs.mkdirSync(path.dirname(filename), { recursive: true });
    fs.writeFileSync(filename, content);
  } else if (!same) { stale = true; console.error("Postman chưa đồng bộ:", relative); }
}
if (stale) process.exitCode = 1;
else console.log("Postman JSON/scripts và 3 YAML mirrors đồng bộ; không gửi HTTP.");
