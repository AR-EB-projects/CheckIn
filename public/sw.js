self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      payload = { title: "CheckIn", body: event.data.text() };
    }
  } else {
    // Some providers/browsers may deliver a push event without a payload.
    payload = {
      title: "CheckIn",
      body: "You have a new notification.",
    };
  }

  const data = typeof payload === "object" && payload ? payload : {};
  const title = typeof data.title === "string" ? data.title : "CheckIn";
  const body = typeof data.body === "string" ? data.body : "";
  const url = typeof data.url === "string" ? data.url : "/";
  const icon = typeof data.icon === "string" ? data.icon : "/logo.png";
  const badge = typeof data.badge === "string" ? data.badge : "/logo.png";
  const tag = typeof data.tag === "string" ? data.tag : "checkin-notification";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      tag,
      renotify: true,
      requireInteraction: true,
      vibrate: [200, 100, 200],
      data: {
        url,
        ...(typeof data.data === "object" && data.data ? data.data : {}),
      },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetPath =
    event.notification?.data && typeof event.notification.data.url === "string"
      ? event.notification.data.url
      : "/";
  const destinationUrl = new URL(targetPath, self.location.origin);
  destinationUrl.searchParams.set("source", "push");
  destinationUrl.searchParams.set("openNotifications", "1");
  const destination = destinationUrl.toString();

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const destinationPathUrl = new URL(destination);
        for (const client of clients) {
          const clientUrl = new URL(client.url);
          if (
            client.url === destination ||
            client.url.startsWith(`${destination}#`) ||
            clientUrl.pathname === destinationPathUrl.pathname
          ) {
            if ("navigate" in client) {
              return client.navigate(destination).then((navigatedClient) =>
                navigatedClient ? navigatedClient.focus() : client.focus()
              );
            }
            return client.focus();
          }
        }
        return self.clients.openWindow(destination);
      })
  );
});
