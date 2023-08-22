#!/usr/bin/env node

import { intro, outro, log } from "@clack/prompts";
import Minimist from "minimist";

import dockerStart from "./commands/docker-start.mjs";
import up from "./commands/up.mjs";

import { docker } from "./clients/docker.mjs";

export const args = Minimist(process.argv.slice(2));

const start = async () => {
  const time = Date.now();
  intro(`Fizzle CLI 🪣✨`);

  const dockerInfo = await docker.info();
  log.step(`Using Local Docker host: ${dockerInfo.Name}`);

  try {
    const command = args._[0];

    if (command === "start") {
      await dockerStart();
    } else if (command === "up") {
      await up();
    }
  } catch (e) {
    log.error(`Something went wrong: ${e.message}`);
  }

  outro(`Done in ${Date.now() - time}ms`);
};

start();
