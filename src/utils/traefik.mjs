import { PROXY_NAME, docker } from "../clients/docker.mjs";

export const getTraefikStatus = async () => {
  const traefikContainer = await docker.listContainers({
    all: true,
    filters: { name: [PROXY_NAME] }
  });

  if (traefikContainer.length === 0) {
    return {
      running: false,
      created: false
    };
  } else {
    return {
      running: traefikContainer[0].State === "running",
      created: true
    };
  }
};
