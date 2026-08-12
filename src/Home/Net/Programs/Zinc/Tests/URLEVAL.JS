// The URL constructor and eval.
//
// Only ABSOLUTE hrefs are used below: resolving a relative one needs a base,
// and the shell harness gives the document the URL "zinc:shell", which has no
// resolvable base. What a relative href resolves to is therefore a property of
// the page, not of this code, and is not asserted.
//
// eval here is the indirect form: the string runs as a script in the GLOBAL
// environment. Reading the CALLER's locals from an eval is not supported, so
// nothing below asserts it - that is the one thing a real engine does that
// this does not.

var u = new URL("https://ex.com:8080/a/b?x=1#f");
console.log(u.href);
console.log(u.protocol);
console.log(u.host);
console.log(u.hostname);
console.log(u.port);
console.log(u.pathname);
console.log(u.search);
console.log(u.hash);
console.log(u.origin);

var plain = new URL("http://site.org/");
console.log(plain.protocol);
console.log(plain.hostname);
console.log(plain.pathname);
console.log("[" + plain.search + "]");
console.log("[" + plain.hash + "]");
console.log("[" + plain.port + "]");

var deep = new URL("https://a.b.c/one/two/three.html?q=a&r=b");
console.log(deep.hostname);
console.log(deep.pathname);
console.log(deep.search);
console.log(typeof u.href);

// ---- eval ----
console.log(typeof eval);
console.log(eval("1 + 1"));
console.log(eval("2 * 3"));
console.log(eval("'ab' + 'cd'"));
console.log(eval(""));
console.log(eval(42));
console.log(eval(null));

// a declaration made by eval is visible afterwards
eval("var evalMade = 7;");
console.log(evalMade);
eval("function evalFn(n) { return n * 3; }");
console.log(evalFn(4));
console.log(typeof evalFn);

// eval yields the value of its last statement
console.log(eval("var q = 1; q + 4"));
console.log(eval("var w = 2; w * 3; 'last'"));

// the indirect form, which is what bundles use to reach global scope
var indirect = eval;
console.log(indirect("5 + 5"));
console.log((0, eval)("6 + 6"));
console.log("urleval done");
