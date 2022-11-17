const CACHE = 'pro_2022_11_17_150'; //SAME IN RESET FUNCTION
//
var ASSETS = [
    //
    "app/js/jquery-3.6.0.min.js",
    'app/js/NoSleep.min.js',
    //
    'app/fonts/fontawesome-free-6.2.0-web/css/fontawesome.min.css',
    'app/fonts/fontawesome-free-6.2.0-web/css/solid.css',
    //
    "app/js/search.js",
    "app/js/app.js",
    "app/js/api.js",
    "app/js/md5.js",
    //
    "app/img/splashscreens/iphone5_splash.png",
    "app/img/splashscreens/iphone6_splash.png",
    "app/img/splashscreens/iphoneplus_splash.png",
    "app/img/splashscreens/iphonex_splash.png",
    "app/img/splashscreens/iphonexr_splash.png",
    "app/img/splashscreens/iphonexsmax_splash.png",
    "app/img/splashscreens/ipad_splash.png",
    "app/img/splashscreens/ipadpro1_splash.png",
    "app/img/splashscreens/ipadpro3_splash.png",
    "app/img/splashscreens/ipadpro2_splash.png",
    'app/img/image-offline.svg',
    //
    'app/css/main.css',
    'app/css/list.css',
    'app/css/presentation.css',
    //
    'manifest.json',
    'index.html',
    '/'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();

    event.waitUntil(async function() {
        const cache = await caches.open(CACHE);
        await cache.addAll(ASSETS);
    }());
});

self.addEventListener('activate', (e) => {
    e.waitUntil(caches.keys().then((keyList) => {
        return Promise.all(keyList.map((key) => {
            if (key === CACHE) { return; }
            return caches.delete(key);
        }));
    }));
});


self.addEventListener('fetch', function(event) {
    event.respondWith(
        // Try the network
        fetch(event.request)
        .then(function(res) {
            return caches.open(CACHE)
                .then(function(cache) {
                    // Put in cache if succeeds
                    if (event.request.url.includes("uploads") || event.request.url.includes("discogs.com") || event.request.url.includes("ytimg.com")) {
                        //skip discogs.com
                        return res;
                    }
                    cache.put(event.request.url, res.clone());
                    return res;
                })
        })
        .catch(function(err) {
            // Fallback to cache
            //return res; //online only
            return caches.match(event.request)
                .then(function(res) {
                    if (res === undefined) {
                        if (event.request.url.includes("discogs.com")) {
                            //console.log("OFFLINE serving default img for discogs.com");
                            //const cache = await caches.open(CACHE_NAME);
                            const offline_images_res = caches.match('app/img/image-offline.svg');
                            return offline_images_res;
                        }
                        // get and return the offline page
                        //console.log("Offline and not cached");
                        return res;
                    }
                    if (event.request.url.includes("apiCall.php")) {
                        //console.log("OFFLINE apiCall.php cached");
                    }
                    return res;
                })
        })
    );
});