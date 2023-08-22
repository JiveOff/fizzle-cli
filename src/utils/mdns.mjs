import { existsSync, readFileSync, unlinkSync } from "fs";
import path from "path";
import { pluginDir } from "./dir.mjs";

export const killMdnsDaemon = () => {
  const pidfile = path.join(pluginDir, "mdns.pid");
  if (!existsSync(pidfile)) {
    return false;
  }

  const pid = readFileSync(pidfile, "utf8");

  try {
    process.kill(pid, 0);
    process.kill(pid);
    unlinkSync(pidfile);
  } catch (err) {
    unlinkSync(pidfile);
  }
};

export const isMdnsDaemonRunning = () => {
  const pidfile = path.join(pluginDir, "mdns.pid");

  if (!existsSync(pidfile)) {
    return false;
  }

  const pid = readFileSync(pidfile, "utf8");

  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    unlinkSync(pidfile);
    return false;
  }
};
