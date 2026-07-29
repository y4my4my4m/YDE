// Ordering only: no wall-clock values, so the result is stable on any engine.
// Microtasks (promise reactions) must all drain before any timer runs.

console.log("sync start");

setTimeout(function () { console.log("timeout 0"); }, 0);

Promise.resolve("p1").then(function (v) { console.log("then " + v); });

Promise.resolve().then(function () {
	console.log("micro A");
}).then(function () {
	console.log("micro B");
});

new Promise(function (resolve) {
	console.log("executor runs synchronously");
	resolve("p2");
}).then(function (v) {
	console.log("then " + v);
});

setTimeout(function () { console.log("timeout 1"); }, 1);

console.log("sync end");
