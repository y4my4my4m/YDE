// Zinc's own host stubs. NOT a conformance test: jsdom implements none of
// these, and node has no DOM at all, so this file's .OUT cannot come from a
// real engine. It records what THIS engine is supposed to return, so a stub
// that regresses to undefined is caught.
//
// Everything a real engine can answer belongs in HOSTAPI.JS instead.
//
// The values are chosen, not measured. See the reasoning at each site in
// JS.ZC / JSNative.ZC:
//   sendBeacon returns true       - false means "not queued" and pages retry over XHR
//   performance.timing is zeroes  - pages difference two fields; 0-0 is a duration,
//                                   undefined-undefined is NaN and poisons the maths
//   dispatchEvent returns true    - "not cancelled"; undefined is falsy and flips
//                                   `if (!el.dispatchEvent(e))`

console.log(typeof navigator.sendBeacon);
console.log(navigator.sendBeacon("/x", "d"));

console.log(typeof performance.getEntriesByType);
console.log(typeof performance.getEntriesByName);
console.log(typeof performance.getEntries);
console.log(typeof performance.mark);
console.log(typeof performance.clearMarks);
console.log(typeof performance.clearMeasures);
console.log(performance.getEntriesByType("mark").length);
console.log(performance.getEntriesByName("x").length);
console.log(performance.getEntries().length);

// Deprecated, still read by analytics bundles. A missing field reads undefined
// and NaNs whatever it feeds.
console.log(typeof performance.timing);
console.log(typeof performance.timing.navigationStart);
console.log(typeof performance.timing.fetchStart);
console.log(typeof performance.timing.requestStart);
console.log(typeof performance.timing.responseEnd);
console.log(typeof performance.timing.domInteractive);
console.log(typeof performance.timing.domContentLoadedEventEnd);
console.log(typeof performance.timing.domComplete);
console.log(typeof performance.timing.loadEventEnd);
console.log(performance.timing.domComplete - performance.timing.navigationStart);
console.log(typeof performance.navigation.type);
console.log(typeof performance.navigation.redirectCount);

// XHR fields completed at construction: each one read undefined before, and an
// undefined receiver several frames later is what that produces.
var x = new XMLHttpRequest();
console.log(typeof x.statusText);
console.log(typeof x.response);
console.log(typeof x.responseType);
console.log(typeof x.responseURL);
console.log(typeof x.withCredentials);
console.log(typeof x.timeout);
console.log(typeof x.abort);
console.log(typeof x.overrideMimeType);

var el = document.createElement("div");
console.log(el.dispatchEvent(new Event("x")));
