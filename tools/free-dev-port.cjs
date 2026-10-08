const { execFileSync } = require("node:child_process");

const PORT = 5173;

function run(command, args) {
  return execFileSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
}

function getListeningPids() {
  const output = run("netstat.exe", ["-ano", "-p", "tcp"]);
  const pids = new Set();

  for (const line of output.split(/\r?\n/)) {
    if (!line.includes(`:${PORT}`) || !/LISTENING/i.test(line)) continue;
    const parts = line.trim().split(/\s+/);
    const pid = Number(parts[parts.length - 1]);
    if (Number.isInteger(pid) && pid > 0) pids.add(pid);
  }

  return [...pids];
}

function getImageName(pid) {
  const output = run("tasklist.exe", ["/FI", `PID eq ${pid}`, "/FO", "CSV", "/NH"]);
  const firstLine = output.trim().split(/\r?\n/)[0] ?? "";
  const match = firstLine.match(/^"([^"]+)"/);
  return match?.[1]?.toLowerCase() ?? "";
}

for (const pid of getListeningPids()) {
  const image = getImageName(pid);
  if (["node.exe", "npm.exe", "cargo.exe", "campus-assistant-local.exe"].includes(image)) {
    execFileSync("taskkill.exe", ["/F", "/PID", String(pid)], { stdio: "ignore" });
    console.log(`Freed port ${PORT} from ${image} (${pid})`);
  } else {
    console.log(`Port ${PORT} is used by ${image || "unknown"} (${pid}); skipped.`);
  }
}

