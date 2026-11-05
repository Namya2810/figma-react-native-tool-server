# Figma to React Native Tool Server

An Express-based tool server that reads Figma design files and converts layout, typography, spacing, colors, and hierarchy into starter React Native components.

## Features

- Fetches Figma documents through the Figma REST API
- Converts common Auto Layout properties to React Native styles
- Generates a functional React Native screen component
- Exposes tool-discovery and execution HTTP endpoints

The endpoints follow the idea of MCP (Model Context Protocol) tools: a discovery list with input schemas, and one call per tool. They are plain HTTP/JSON, not the MCP JSON-RPC protocol, so an MCP client cannot connect to them directly yet.

| Endpoint | Input | Output |
|---|---|---|
| `GET /tools` | – | The two tools and their input schemas |
| `POST /tool/readFigma` | `{"fileId": "..."}` | The Figma document tree |
| `POST /tool/generateReactNative` | `{"fileId": "..."}` | `{"code": "..."}`: a React Native screen component |

## Run locally

```bash
npm install
npm start
```

The server reads the token from the `FIGMA_TOKEN` environment variable (it does not load a `.env` file). In PowerShell:

```powershell
$env:FIGMA_TOKEN = "your_figma_personal_access_token"
npm start
```

By default it listens on port `3000`.

## Security

Never commit a Figma access token. The server reads it only from the `FIGMA_TOKEN` environment variable.
