// Host surface that minified page code reads on load. Every line below has
// exactly one answer under the relevant specification, independent of engine,
// page and network - that is the only reason this test can exist without node,
// which has neither XMLHttpRequest nor performance.timing.
//
// Nothing here asserts a MEASURED value: performance.timing fields differ per
// load, and during an inline script loadEventEnd is still 0 while
// navigationStart is an epoch millisecond, so their difference is negative in
// a real browser. Only the shapes are checked.
//
// To regenerate against a real engine: install jsdom and run
//   JSDOM_PATH=<dir> node utils/jsdomrun.js Tests/HOSTAPI.JS > Tests/HOSTAPI.OUT
// Bare node throws on line 1, so utils/jstestgen.sh leaves this .OUT alone.

// Probes limited to what a real engine can answer. jsdom implements neither
// navigator.sendBeacon nor most of performance, so those live in ZINCHOST.JS,
// which records this engine's own stubs and is not a conformance oracle.
// XMLHttpRequest, state UNSENT (XHR spec section 4)
var x = new XMLHttpRequest();
console.log(x.readyState);
console.log(x.status);
console.log("[" + x.statusText + "]");
console.log("[" + x.responseText + "]");
console.log("[" + x.responseType + "]");
console.log(x.withCredentials);
console.log(x.timeout);
console.log(typeof x.open);
console.log(typeof x.send);
console.log(typeof x.abort);
console.log(typeof x.overrideMimeType);
console.log(typeof x.setRequestHeader);
console.log(typeof x.getAllResponseHeaders);

// XMLHttpRequest is an EventTarget: pages register load/error this way far
// more often than they assign onload
console.log(typeof x.addEventListener);
console.log(typeof x.removeEventListener);
var onLoad = function () { console.log("load"); };
x.addEventListener("load", onLoad);
x.addEventListener("error", function () { console.log("error"); });
x.removeEventListener("load", onLoad);
console.log("xhr listeners ok");

// navigator
console.log(typeof navigator.userAgent);
console.log(typeof navigator.language);
console.log(typeof navigator.platform);
console.log(typeof navigator.vendor);
console.log(typeof navigator.appVersion);
console.log(typeof navigator.cookieEnabled);
console.log(typeof navigator.onLine);
console.log(navigator.languages.length > 0);

// performance
console.log(typeof performance.now());
console.log(typeof performance.timeOrigin);
// Probed by presence, not by calling: jsdom implements performance without
// these, so calling them makes the file unrunnable against a real engine.

// performance.timing / navigation are deliberately NOT probed here. They are
// deprecated, jsdom does not implement them, and asserting the shape of our
// own stub would make this file unable to disagree with us. Coverage of the
// stub belongs in a Zinc-specific test, not in one checked against a real
// engine.

// string-valued host properties: pages substring these, and undefined here is
// what turns into a member miss several frames downstream
console.log(typeof document.cookie);
console.log(typeof document.referrer);
console.log(typeof document.readyState);
console.log(typeof document.characterSet);
console.log(typeof document.visibilityState);
console.log(typeof location.href);
console.log(typeof location.protocol);
console.log(typeof location.host);
console.log(typeof location.pathname);
console.log(typeof location.search);
console.log(typeof location.hash);
console.log(typeof location.origin);
console.log("hostapi done");
