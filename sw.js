// ============================================================
// RISHI MUSIC - SERVICE WORKER
// Version 5
// ============================================================

const CACHE_NAME = "rishi-music-v5";

const APP_SHELL = [
    "./",
    "./index.html",
    "./style.css",
    "./app.js",
    "./manifest.json"
];

// ============================================================
// INSTALL
// ============================================================

self.addEventListener(
    "install",
    event => {

        event.waitUntil(

            caches.open(
                CACHE_NAME
            ).then(
                cache => {

                    return cache.addAll(
                        APP_SHELL
                    );
                }
            )
        );

        // Activate the new service
        // worker immediately.
        self.skipWaiting();
    }
);

// ============================================================
// ACTIVATE
// ============================================================

self.addEventListener(
    "activate",
    event => {

        event.waitUntil(

            caches.keys().then(
                cacheNames => {

                    return Promise.all(

                        cacheNames
                            .filter(
                                cacheName =>
                                    cacheName.startsWith(
                                        "rishi-music-"
                                    ) &&
                                    cacheName !==
                                        CACHE_NAME
                            )
                            .map(
                                cacheName =>
                                    caches.delete(
                                        cacheName
                                    )
                            )
                    );
                }
            ).then(
                () =>
                    self.clients.claim()
            )
        );
    }
);

// ============================================================
// MESSAGE
// ============================================================

self.addEventListener(
    "message",
    event => {

        if (
            event.data &&
            event.data.type ===
                "SKIP_WAITING"
        ) {

            self.skipWaiting();
        }
    }
);

// ============================================================
// FETCH
// ============================================================

self.addEventListener(
    "fetch",
    event => {

        const request =
            event.request;

        const url =
            new URL(
                request.url
            );

        // ----------------------------------------------------
        // IMPORTANT
        //
        // Do NOT intercept audio/video files.
        //
        // Imported Rishi Music songs are stored in IndexedDB
        // as Blob objects. The service worker must not interfere
        // with their playback or Range requests.
        // ----------------------------------------------------

        if (
            request.method !== "GET"
        ) {
            return;
        }

        if (
            request.destination ===
                "audio" ||
            request.destination ===
                "video"
        ) {
            return;
        }

        const pathname =
            url.pathname.toLowerCase();

        if (
            pathname.endsWith(".mp3") ||
            pathname.endsWith(".m4a") ||
            pathname.endsWith(".wav") ||
            pathname.endsWith(".aac") ||
            pathname.endsWith(".flac") ||
            pathname.endsWith(".ogg") ||
            pathname.endsWith(".opus") ||
            pathname.endsWith(".webm") ||
            pathname.endsWith(".mp4") ||
            pathname.endsWith(".mkv") ||
            pathname.endsWith(".hevc")
        ) {
            return;
        }

        // ----------------------------------------------------
        // APP SHELL / STATIC FILES
        // ----------------------------------------------------

        if (
            pathname.endsWith(
                "/app.js"
            ) ||
            pathname.endsWith(
                "/style.css"
            ) ||
            pathname.endsWith(
                "/manifest.json"
            )
        ) {

            event.respondWith(

                fetch(request)
                    .then(
                        response => {

                            if (
                                response &&
                                response.ok
                            ) {

                                const copy =
                                    response.clone();

                                caches.open(
                                    CACHE_NAME
                                ).then(
                                    cache =>
                                        cache.put(
                                            request,
                                            copy
                                        )
                                );
                            }

                            return response;
                        }
                    )
                    .catch(
                        () =>
                            caches.match(
                                request
                            )
                    )
            );

            return;
        }

        // ----------------------------------------------------
        // NAVIGATION
        // ----------------------------------------------------

        if (
            request.mode ===
            "navigate"
        ) {

            event.respondWith(

                fetch(request)
                    .then(
                        response => {

                            if (
                                response &&
                                response.ok
                            ) {

                                const copy =
                                    response.clone();

                                caches.open(
                                    CACHE_NAME
                                ).then(
                                    cache =>
                                        cache.put(
                                            "./index.html",
                                            copy
                                        )
                                );
                            }

                            return response;
                        }
                    )
                    .catch(
                        () =>
                            caches.match(
                                "./index.html"
                            )
                    )
            );

            return;
        }

        // ----------------------------------------------------
        // OTHER STATIC REQUESTS
        // ----------------------------------------------------

        event.respondWith(

            caches.match(
                request
            ).then(
                cachedResponse => {

                    if (
                        cachedResponse
                    ) {
                        return cachedResponse;
                    }

                    return fetch(
                        request
                    ).then(
                        response => {

                            if (
                                response &&
                                response.ok &&
                                url.origin ===
                                    self.location.origin
                            ) {

                                const copy =
                                    response.clone();

                                caches.open(
                                    CACHE_NAME
                                ).then(
                                    cache =>
                                        cache.put(
                                            request,
                                            copy
                                        )
                                );
                            }

                            return response;
                        }
                    );
                }
            )
        );
    }
);