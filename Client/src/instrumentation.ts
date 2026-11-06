export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const dns = await import("node:dns");
      dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
      if (dns.setDefaultResultOrder) {
        dns.setDefaultResultOrder("ipv4first");
      }
    } catch (e) {
      // Ignore
    }
  }
}
