#!/usr/bin/env node

import { intro, outro, log } from "@clack/prompts";
import Minimist from "minimist";

import startCmd from "./commands/start.mjs";
import upCmd from "./commands/up.mjs";

import { docker } from "./clients/docker.mjs";
import { __dirname } from "./utils/dir.mjs";

export const args = Minimist(process.argv.slice(2));

const start = async () => {
  const time = Date.now();
  intro(`Fizzle CLI 🪣✨`);

  const dockerInfo = await docker.info();
  log.info(`Using Local Docker host: ${dockerInfo.Name}`);

  try {
    const command = args._[0];

    if (command === "start") {
      await startCmd();
    } else if (command === "up") {
      await upCmd();
    }
  } catch (e) {
    log.error(`Something went wrong: ${e.message}`);
  }

  outro(`Done in ${Date.now() - time}ms`);
};

start();
