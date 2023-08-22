import fs from "node:fs";
import path from "node:path";
import { log, spinner } from "@clack/prompts";
import { PROXY_NETWORK, docker } from "../clients/docker.mjs";
import { confirm } from "@clack/prompts";
import { text } from "@clack/prompts";
import { isTraefikRunning } from "./docker-start.mjs";

const cwd = process.cwd();

export default async () => {
  const traefikRunning = await isTraefikRunning();

  if (!traefikRunning) {
    log.error(
      "Traefik is not running, please run `npx fizzle start` beforehand."
    );
    return;
  }

  const dockerfileExists = await fs.existsSync(path.join(cwd, "Dockerfile"));
  const packageJsonExists = await fs.existsSync(path.join(cwd, "package.json"));

  if (!packageJsonExists) {
    log.error(
      "No package.json found, please run this command from the root of your project."
    );
    return;
  }

  if (!dockerfileExists) {
    const confirmed = await confirm({
      message:
        "No Dockerfile found, do you want to create one? A development Dockerfile that leverages Node 18 will be created at the root of your project.",
    });

    if (!confirmed) {
      return;
    }

    // copy the Dockerfile from docker/example/Dockerfile
    const dockerfile = await fs.readFileSync(
      path.join(__dirname, "../../docker/example/Dockerfile")
    );

    await fs.writeFileSync(path.join(cwd, "Dockerfile"), dockerfile);
  }

  const pkg = await fs.readFileSync(path.join(cwd, "package.json"));
  const parsedPackage = JSON.parse(pkg.toString());

  const appName = await text({
    message: "What is the name of your app?",
    initialValue: parsedPackage.name,
    defaultValue: parsedPackage.name,
    validate: (value) => {
      const regex = /^[a-z0-9]+$/;
      return regex.test(value);
    },
  });

  const appPort = await text({
    message: "What port does your app run on?",
    initialValue: parsedPackage.port || 8080,
    defaultValue: parsedPackage.port || 8080,
    validate: (value) => {
      const regex = /^[0-9]+$/;
      return regex.test(value);
    },
  });

  const enableTls = await confirm({
    message: "Do you wish to enable TLS?",
    initialValue: true,
  });

  const oldContainer = await docker.listContainers({
    all: true,
    filters: { name: [appName] },
  });

  const dockerSpinner = await spinner();
  dockerSpinner.start("Setting up project");

  if (oldContainer.length > 0) {
    dockerSpinner.message("Removing old container");
    const container = docker.getContainer(oldContainer[0].Id);
    await container.stop();
    await container.remove();
  }

  dockerSpinner.message("Building Docker image");

  const imageStream = await docker.buildImage(
    {
      context: cwd,
      src: ["."],
    },
    {
      t: `fizzle-${appName}:latest`,
    }
  );

  const test = await new Promise((resolve, reject) => {
    let lastStreamMessage = "";

    imageStream.on("data", (chunk) => {
      const lines = chunk
        .toString()
        .split("\n")
        .filter((line) => line !== "");
      lines.forEach((line) => {
        const parsed = JSON.parse(line.trim());
        if (parsed.stream) {
          if (parsed.stream.trim() === "") {
            return;
          }
          lastStreamMessage = parsed.stream;
        } else if (parsed.error) {
          dockerSpinner.stop(
            `Error while building Docker image: ${parsed.error}`,
            1
          );
          log.message(lastStreamMessage);
          reject();
        }
      });
    });

    imageStream.on("end", () => {
      resolve();
    });
  });

  dockerSpinner.message("Creating Docker container");

  const createConfig = {
    Image: `fizzle-${appName}:latest`,
    name: appName,
    Labels: {
      "traefik.enable": "true",
    },
    HostConfig: {
      RestartPolicy: {
        Name: "always",
      },
      NetworkMode: PROXY_NETWORK,
    },
  };

  createConfig["Labels"][
    `traefik.http.routers.${appName}.rule`
  ] = `Host(\`${appName}.local\`)`;
  createConfig["Labels"][`traefik.http.routers.${appName}.entrypoints`] =
    enableTls ? "websecure" : "web";
  createConfig["Labels"][`traefik.http.routers.${appName}.tls`] = enableTls
    ? "true"
    : "false";
  createConfig["Labels"][
    `traefik.http.services.${appName}.loadbalancer.server.port`
  ] = String(appPort);

  const container = await docker.createContainer(createConfig);

  await container.start();

  dockerSpinner.stop("Docker container started", 0);

  const url = enableTls
    ? `https://${appName}.local`
    : `http://${appName}.local`;

  log.step(`Your app is running at ${url}`);
};
