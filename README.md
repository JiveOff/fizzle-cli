# Fizzle

(This is a **WIP** project, so it is not ready for use yet)

A **WIP** Command Line utility to start local servers under the \*.local domains using Docker, Traefik and mDNS (multi-cast DNS). It supports both HTTP and HTTPS.

## What it does

Fizzle creates a Traefik container that acts as a reverse proxy for your local servers. The CLI will also generate a local certificate for you and configure Traefik to use it.

Traefik will then launch a global entrypoint on port 80 and 443. It will then listen for requests on the registered \*.local domains and route them to the correct container.

The mDNS daemon is then launched to listen for DNS requests for the \*.local domains and route them to your local machine on your network if they are registered (in your Fizzle Traefik docker network).

## Output Example

`npx fizzle start` anywhere on your machine to:

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

`npx fizzle up` in the root of your project directory.

```bash
┌  Fizzle CLI 🪣✨
│
◇  Using Local Docker host: docker-desktop
│
◇  What is the name of your app?
│  example-express-app
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
