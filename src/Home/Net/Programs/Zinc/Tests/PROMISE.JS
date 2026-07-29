// then() used to return the same promise it was called on, so every handler in
// a chain saw the ORIGINAL value and reactions drained in registration order.
// ASYNC.JS only catches the ordering symptom; this catches the data flow.

Promise.resolve(1)
	.then(function (x) { return x + 1; })
	.then(function (x) { return x * 10; })
	.then(function (x) { console.log("chain " + x); });

// a handler returning a promise is adopted, not passed through as an object
Promise.resolve("a")
	.then(function (v) { return Promise.resolve(v + "b"); })
	.then(function (v) { console.log("adopt " + v); });

// rejection skips then handlers until a catch
Promise.reject("boom")
	.then(function () { console.log("must not run"); })
	.catch(function (e) { console.log("caught " + e); });

// a throw inside a handler rejects the derived promise
Promise.resolve("x")
	.then(function () { throw new Error("thrown"); })
	.catch(function (e) { console.log("catch " + e.message); });

// catch returns a promise too, so the chain continues after recovery
Promise.reject("bad")
	.catch(function () { return "recovered"; })
	.then(function (v) { console.log("after catch " + v); });

// then with no handler passes the value straight through
Promise.resolve("through")
	.then()
	.then(function (v) { console.log("passthrough " + v); });

// executor resolve/reject
new Promise(function (resolve, reject) { resolve(7); })
	.then(function (v) { console.log("executor " + v); });

new Promise(function (resolve, reject) { reject("nope"); })
	.catch(function (e) { console.log("executor reject " + e); });
