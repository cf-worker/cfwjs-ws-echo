# [ws-echo.cfwjs.workers.dev](https://ws-echo.cfwjs.workers.dev)

Simple websocket example using only Cloudflare Workers.

## Example

`bunx wscat --slash -P -c ws://ws-echo.cfwjs.workers.dev`

## Alternative Example

`bunx wscat --slash -P -c ws://websocket-echo.com`

## Multiple Clients

Durable Objects is required to support send message to different clients.
(Not available in the free plan)

## Docs

- https://developers.cloudflare.com/workers/examples/websockets/

## Local Development

`bun x wrangler dev`
