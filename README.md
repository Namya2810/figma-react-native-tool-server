# Figma to React Native Tool Server

An Express-based tool server that reads Figma design files and converts layout, typography, spacing, colors, and hierarchy into starter React Native components.

## Features

- Fetches Figma documents through the Figma REST API
- Converts common Auto Layout properties to React Native styles
- Generates a functional React Native screen component
- Exposes tool-discovery and execution HTTP endpoints

## Run locally

```bash
npm install
copy .env.example .env
npm start
```

Set `FIGMA_TOKEN` in your environment before starting the server. By default it listens on port `3000`.

## Security

Never commit a Figma access token. The server reads it only from the `FIGMA_TOKEN` environment variable.
