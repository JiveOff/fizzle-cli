import MulticastDns from "multicast-dns";
import { docker, PROXY_NAME, PROXY_NETWORK } from "./clients/docker.mjs";
import os from "os";

const networkIps = Object.values(os.networkInterfaces()).reduce(
  (r, list) =>
    r.concat(
      list.reduce(
        (rr, i) =>
          rr.concat((i.family === "IPv4" && !i.internal && i.address) || []),
        []
      )
    ),
  []
);

const mdns = new MulticastDns();

const listeningTo = [];

const start = async () => {
  const network = docker.getNetwork(PROXY_NETWORK);
  const inspection = await network.inspect();

  Object.values(inspection.Containers).forEach((container) => {
    const containerName = container.Name.replace(/^\//, "");
    if (containerName !== PROXY_NAME) {
      listeningTo.push(`${containerName}.local`);
    }
  });

  docker.getEvents({}, (err, data) => {
    if (!err) {
      data.on("data", async (chunk) => {
        const event = JSON.parse(chunk.toString());
        if (
          event.Actor &&
          event.Type === "network" &&
          event.Actor.ID === inspection.Id
        ) {
          const container = docker.getContainer(
            event.Actor.Attributes.container
          );
          const containerInspection = await container.inspect();
          const name = containerInspection.Name.replace(/^\//, "");
          if (event.Action === "connect") {
            listeningTo.push(`${name}.local`);
          } else if (event.Action === "disconnect") {
            listeningTo.splice(listeningTo.indexOf(`${name}.local`), 1);
          }
        }
      });
    }
  });
};

mdns.on("query", async (query) => {
  const questionsListeningTo = query.questions.filter((q) =>
    listeningTo.includes(q.name)
  );

  if (questionsListeningTo.length > 0) {
    const answers = questionsListeningTo.reduce((answers, question) => {
      const answersForIp = networkIps.map((ip) => ({
        name: question.name,
        type: "A",
        ttl: 5,
        data: ip,
      }));
      return answers.concat(answersForIp);
    }, []);

    mdns.respond({ answers });
  }
});

start();
