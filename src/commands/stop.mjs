import { spinner } from "@clack/prompts";
import { PROXY_NETWORK, docker } from "../clients/docker.mjs";
import { isMdnsDaemonRunning, killMdnsDaemon } from "../utils/mdns.mjs";
import { log } from "@clack/prompts";
import { getTraefikStatus } from "../utils/traefik.mjs";

export default async () => {
  const traefikStatus = await getTraefikStatus();
  const mdnsDaemonExists = isMdnsDaemonRunning();

  if (!traefikStatus.running && !mdnsDaemonExists) {
    log.error("Traefik and mDNS daemon are not running.");
    return;
  }

  const { start, stop, message } = await spinner();
  start("Stopping containers and mDns daemon");

  const network = docker.getNetwork(PROXY_NETWORK);
  const inspection = await network.inspect();

  const containers = Object.values(inspection.Containers);

  if (containers.length > 0) {
    for (const container of containers) {
      message(`Stopping ${container.Name}`);
      const containerName = container.Name.replace(/^\//, "");
      const ctr = docker.getContainer(containerName);
      await ctr.stop();
    }
  }

  message("Stopping mDns daemon");

  killMdnsDaemon();

  stop("Stopped containers and mDns daemon!");
};
