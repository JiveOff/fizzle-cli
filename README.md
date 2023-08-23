# Fizzle

(This is a **WIP** project, so it is not ready for use yet, however, feel free to try it out and submit issues with your feature requests!)

A Command Line utility to start local servers under the \*.local domains using Docker, Traefik and mDNS (multi-cast DNS). It supports both HTTP and HTTPS.

## Commands

- `npx fizzle-cli start` - Starts Traefik and the mDNS daemon
- `npx fizzle-cli stop` - Stops Traefik and the mDNS daemon
- `npx fizzle-cli up` - Starts your app in a docker container and connects it to the local Traefik network

## What it does

Fizzle creates a Traefik container that acts as a reverse proxy for your local servers. The CLI will also generate a local certificate for you and configure Traefik to use it.

Traefik will then launch a global entrypoint on port 80 and 443. It will then listen for requests on the registered \*.local domains and route them to the correct container.

The mDNS daemon is then launched to listen for DNS requests for the \*.local domains and route them to your local machine on your network if they are registered (in your Fizzle Traefik docker network).

Upon running the `up` command in a project directory, Fizzle will create a docker container for your app and connect it to your local Traefik network. The container is either created from your own Dockerfile (which must use the /app directory as the working directory) or from a Dockerfile that Fizzle generates for you.

The container is then started using the start script that you provided during the up command.

## Output Example

`npx fizzle-cli start` anywhere on your machine to:

- Create your local certificate
- Start Traefik
- Start the mDNS daemon

```bash
┌  Fizzle CLI 🪣✨
│
◇  Using Local Docker host: docker-desktop
│
◆  Local certificate already exists, skipping...
│
◇  Traefik started!
│
└  Done in 633ms
```

`npx fizzle-cli up` in the root of your project directory.

```bash
┌  Fizzle CLI 🪣✨
│
◇  Using Local Docker host: docker-desktop
│
◇  What is the name of your app?
│  example-express-app
│
◇  What is the command to start your app?
│  npm start
│
◇  What port does your app run on?
│  8080
│
◇  Do you wish to enable TLS?
│  Yes
│
◇  Docker container started
│
◇  Your app is running at https://example-express-app.local
│
└  Done in 14824ms
```
