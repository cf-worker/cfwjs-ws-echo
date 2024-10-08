let startedAt = 0
let counter = 0
let clients = 0

export default {
  /**
   * @param {Request} request
   */
  async fetch(request) {
    startedAt ||= Date.now()
    const uptime = () => elapsedHuman(Date.now() - startedAt)

    if (request.url.endsWith("/favicon.ico")) {
      return emptyFaviconResponse()
    }

    const upgradeHeader = request.headers.get("Upgrade")
    if (upgradeHeader !== "websocket") {
      return Response.json({
        startedAt: new Date(startedAt).toISOString(),
        counter,
        clients,
        uptime: uptime()
      })
      // return new Response('Expected Upgrade: websocket', { status: 426 })
    }

    const { 0: client, 1: server } = new WebSocketPair()
    server.accept()
    server.addEventListener("error", event => console.error(event))

    function sendInfo() {
      server.send(JSON.stringify({
        city: request.cf.city,
        colo: request.cf.colo,
        clients,
        ip: request.headers.get("cf-connecting-ip") ?? request.headers.get("x-real-ip")
      }))
    }

    server.addEventListener("message", ({ data }) => {
      switch (data) {
        case "ping": return server.send("pong")
        case "info": return sendInfo()
        case "count": return server.send(++counter)
        case "now": return server.send(new Date().toISOString())
        case "boot": return server.send(new Date(startedAt).toISOString())
        case "uptime": return server.send(uptime())
        case "help": return server.send(
          "ping, info, count, now, boot, uptime, /ping, /pong <data> /close 1000 [reason]"
        )
        default: server.send(data) // echo
      }
    })

    // https://datatracker.ietf.org/doc/html/rfc6455#section-7.4.1
    // 1000 normal, 1001 browser navigated away, 1002 protocol error, 1003 wrong data
    // 1005 no status code was actually present
    // 1006 closed abnormally, without sending or receiving a Close control frame
    // 1009 Message is too large. Worker have a size limit of 1 MiB (1048576)
    server.addEventListener("close", ({ type, code, reason, wasClean }) => {
      clients--
      console.log({ type, code, reason, wasClean })
    })
    sendInfo()
    clients++
    return new Response(null, { status: 101, webSocket: client })
  }
}

function elapsedHuman(ms) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)
  let str = ""
  if (d > 0) str += `${d}d`
  if (h > 0) str += `${h % 24}h`
  if (m > 0) str += `${m % 60}m`
  if (s > 0) str += `${s % 60}s`
  else str += `${ms}ms`
  return str
}

function emptyFaviconResponse() {
  return new Response(null, {
    status: 204,
    statusText: "No Content",
    headers: {
      "Content-Type": "image/x-icon",
      "Cache-Control": "public, max-age=15552000"
    }
  })
}
