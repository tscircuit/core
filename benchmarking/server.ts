export const startServer = () => {
  Bun.serve({
    port: 3991,
    fetch(req) {
      return new Response("Hello World")
    },
  })
}
