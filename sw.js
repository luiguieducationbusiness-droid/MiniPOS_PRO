const CACHE = "minipos-v3";
const ASSETS = ["./", "./index.html", "./styles.css", "./scanner.css", "./app.js", "./manifest.webmanifest", "./icon.svg"];

self.addEventListener("install", event => {
	event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener("activate", event => {
	event.waitUntil(
		caches.keys()
			.then(keys => Promise.all(keys.filter(key => key.startsWith("minipos-") && key !== CACHE).map(key => caches.delete(key))))
			.then(() => self.clients.claim())
	);
});

self.addEventListener("fetch", event => {
	const request = event.request;
	if (request.method !== "GET") return;

	const requestUrl = new URL(request.url);
	const scopeUrl = new URL(self.registration.scope);
	if (requestUrl.origin !== scopeUrl.origin) return;

	const isAppAsset = ASSETS.some(asset => new URL(asset, scopeUrl).pathname === requestUrl.pathname);
	if (!isAppAsset && request.mode !== "navigate") return;

	event.respondWith((async () => {
		const cache = await caches.open(CACHE);
		if (request.mode === "navigate") {
			try {
				const response = await fetch(request);
				if (response.ok) await cache.put(request, response.clone());
				return response;
			} catch {
				return (await cache.match("./index.html")) || Response.error();
			}
		}

		const cached = await cache.match(request);
		if (cached) return cached;

		try {
			const response = await fetch(request);
			if (response.ok) await cache.put(request, response.clone());
			return response;
		} catch {
			return Response.error();
		}
	})());
});
