#!/usr/bin/env node

import { intro, outro, log } from "@clack/prompts";
import Minimist from "minimist";

import startCmd from "./commands/start.mjs";
import upCmd from "./commands/up.mjs";
import stopCmd from "./commands/stop.mjs";

import { __dirname } from "./utils/dir.mjs";

export const args = Minimist(process.argv.slice(2));

const start = async () => {
  const time = Date.now();
  intro(`Fizzle CLI 🪣✨`);

  try {
    const command = args._[0];

    if (command === "start") {
      await startCmd();
    } else if (command === "stop") {
      await stopCmd();
    } else if (command === "up") {
      await upCmd();
    } else {
      log.message(`I am local dev tool that starts your apps in Docker containers under the *.local domains.`);
      log.message(`Usage: npx fizzle <start|stop|up>`);
    }
  } catch (e) {
    console.log(e);
    log.error(`Something went wrong: ${e.message}`);
  }

  outro(`Done in ${Date.now() - time}ms`);
};

start();
