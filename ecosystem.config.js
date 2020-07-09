const dotenv = require("dotenv");
const { readFileSync, existsSync } = require("fs");

const readEnv = path => existsSync(path)
  ? dotenv.parse(readFileSync(path))
  : {}

module.exports = {
  apps: [
    {
      name: "gun-local",
      script: "npm",
      args: "run dev:local",
      env: {
        ...readEnv(".env.dev"),
        ...readEnv(".env")
      },
      merge_logs: true,
      out_file: "logs/gun.out.log",
      error_file: "logs/gun.err.log",
      pid_file: "pids/gun.pid"
    }
  ]
};
