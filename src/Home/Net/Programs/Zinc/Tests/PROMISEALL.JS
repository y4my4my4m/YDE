// Promise combinators: all / race / allSettled / any.
// Values and ordering only. Every log is a string or a number on purpose:
// console.log of an array goes through node's inspector and would compare host
// formatting rather than the two engines.

function show(tag, arr) {
	console.log(tag + " [" + arr.join(",") + "]");
}

// ---- Promise.all: values come back in input order ----

Promise.all([1, Promise.resolve(2), 3]).then(function (v) {
	show("all mixed", v);
	console.log("all len " + v.length);
});

// input order is kept even though the second input settles first
var slow = new Promise(function (res) {
	setTimeout(function () { res("slow"); }, 20);
});
Promise.all([slow, Promise.resolve("fast")]).then(function (v) {
	show("all order", v);
});

// a single rejection rejects the whole thing, and the value is that reason
Promise.all([Promise.resolve(1), Promise.reject("boom"), Promise.resolve(3)])
	.then(function () { console.log("all NOT reached"); })
	.catch(function (e) { console.log("all rejected " + e); });

Promise.all([]).then(function (v) { console.log("all empty len " + v.length); });

// ---- Promise.race: first settlement wins, rejection included ----

Promise.race([Promise.resolve("r1"), Promise.resolve("r2")])
	.then(function (v) { console.log("race " + v); });

// a pending input does not delay an already-settled one
Promise.race([slow, Promise.resolve("quick")])
	.then(function (v) { console.log("race quick " + v); });

Promise.race([Promise.reject("rej1"), Promise.resolve("ok")])
	.then(function () { console.log("race NOT reached"); })
	.catch(function (e) { console.log("race rejected " + e); });

// ---- Promise.allSettled: never rejects, one record per input ----

Promise.allSettled([Promise.resolve("a"), Promise.reject("b"), 7])
	.then(function (v) {
		console.log("settled len " + v.length);
		console.log("settled 0 " + v[0].status + " " + v[0].value);
		console.log("settled 1 " + v[1].status + " " + v[1].reason);
		console.log("settled 2 " + v[2].status + " " + v[2].value);
	});

Promise.allSettled([]).then(function (v) {
	console.log("settled empty len " + v.length);
});

// ---- Promise.any: first fulfilment wins, all-rejected gives AggregateError ----

Promise.any([Promise.reject("x"), Promise.resolve("y")])
	.then(function (v) { console.log("any " + v); });

Promise.any([Promise.reject("e1"), Promise.reject("e2")])
	.then(function () { console.log("any NOT reached"); })
	.catch(function (e) {
		console.log("any rejected " + e.name);
		console.log("any errors " + e.errors.length +
					" " + e.errors[0] + " " + e.errors[1]);
	});

// chaining off a combinator keeps working
Promise.all([1, 2]).then(function (v) {
	return v.length;
}).then(function (n) {
	console.log("all chained " + n);
});

console.log("sync end");
