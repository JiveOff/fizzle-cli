import path from "path";
import mkcert from "mkcert";
import { log, spinner } from "@clack/prompts";
import { writeFileSync, existsSync } from "node:fs";
import { mkdirSync } from "fs";
import { spawn } from "child_process";
import { PROXY_NAME, PROXY_NETWORK, docker } from "../clients/docker.mjs";
import { __dirname, pluginDir } from "../utils/dir.mjs";

const createNetwork = async () => {
  const networksWithTraefik = await docker.listNetworks({
    filters: { name: [PROXY_NETWORK] }
  });

  if (networksWithTraefik.length === 0) {
    await docker.createNetwork({
      Name: PROXY_NETWORK,
      Driver: "bridge"
    });
  }
};

const createCert = async () => {
  const certPath = path.join(pluginDir, "docker/traefik/certs");
  const certExists = await existsSync(certPath);

  if (certExists) {
    log.success(`Local certificate already exists, skipping...`);
    return;
  }

  await mkdirSync(certPath);

  const authority = await mkcert.createCA({
    organization: "Fizzle Local CA",
    countryCode: "",
    state: "",
    locality: "",
    validityDays: 365
  });

  const cert = await mkcert.createCert({
    domains: ["*.local"],
    validityDays: 365,
    caKey: authority.key,
    caCert: authority.cert
  });

  await writeFileSync(path.join(certPath, "cert.pem"), cert.cert);
  await writeFileSync(path.join(certPath, "key.pem"), cert.key);

  log.success(`Local certificate created!`);
};

export const isTraefikRunning = async () => {
  const traefikContainer = await docker.listContainers({
    all: true,
    filters: { name: [PROXY_NAME] }
  });

  return traefikContainer.length > 0;
};

const setupTraefik = async () => {
  const traefikContainer = await docker.listContainers({
    all: true,
    filters: { name: [PROXY_NAME] }
  });

  if (traefikContainer.length > 0) {
    log.success(`Traefik already running, skipping...`);
    return;
  }

  const traefikImage = await docker.listImages({
    filters: { reference: ["traefik:latest"] }
  });

  const { start, stop, message } = spinner("Starting Traefik");
  start();

  if (traefikImage.length === 0) {
    message("Pulling Traefik image");
    await docker.pull("traefik:latest");
  }

  message("Starting Traefik container");

  const traefik = await docker.createContainer({
    Image: "traefik:latest",
    name: PROXY_NAME,
    ExposedPorts: {
      "80/tcp": {},
      "443/tcp": {}
    },
    HostConfig: {
      RestartPolicy: {
        Name: "always"
      },
      NetworkMode: PROXY_NETWORK,
      PortBindings: {
        "80/tcp": [
          {
            HostPort: "80"
          }
        ],
        "443/tcp": [
          {
            HostPort: "443"
          }
        ]
      },
      Mounts: [
        {
          Type: "bind",
          Source: "/var/run/docker.sock",
          Target: "/var/run/docker.sock"
        },
        {
          Type: "bind",
          Source: path.join(pluginDir, "docker/traefik/traefik.yml"),
          Target: "/etc/traefik/traefik.yml"
        },
        {
          Type: "bind",
          Source: path.join(pluginDir, "docker/traefik/provider.yml"),
          Target: "/etc/traefik/provider.yml"
        },
        {
          Type: "bind",
          Source: path.join(pluginDir, "docker/traefik/certs"),
          Target: "/etc/traefik/certs"
        }
      ]
    }
  });

  await traefik.start();

  stop("Traefik started!");
};

const startMdnsDaemon = async () => {
  const mdnsDaemon = spawn("node", ["src/daemon.js"], {
    cwd: pluginDir,
    detached: true,
    stdio: "ignore"
  });

  mdnsDaemon.unref();

  log.success(`mDNS daemon started`);
};

export default async () => {
  await createNetwork();
  await createCert();
  await setupTraefik();
  await startMdnsDaemon();
};
