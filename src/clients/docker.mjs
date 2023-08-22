import Dockerode from "dockerode";

export const PROXY_NAME = "fizzle-traefik";
export const PROXY_NETWORK = "fizzle-proxy";

export const docker = new Dockerode();
