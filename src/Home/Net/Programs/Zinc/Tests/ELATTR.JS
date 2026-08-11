// Reflected element attributes. The DOM IDL types these as DOMString, so an
// absent one is "", never undefined - and undefined here does not fail where
// it is read, it fails several frames later as an undefined RECEIVER with
// nothing left to name the property that produced it. An inline <script> has
// no src attribute, and `d.src.substring(...)` is what minified loaders do
// with it.
//
// Absolutisation of src/href/action is NOT asserted below: the shell harness
// gives the document the URL "zinc:shell", which has no resolvable base, so
// a relative value stays relative here and goes absolute in a browser. What
// is asserted is that an already-absolute value survives untouched, which is
// the regression that would matter either way.
//
// Bare node has no document; utils/jstestgen.sh leaves this .OUT alone. To
// regenerate against a real engine:
//   JSDOM_PATH=<dir> node utils/jsdomrun.js Tests/ELATTR.JS > Tests/ELATTR.OUT

var s = document.createElement("script");
console.log("[" + s.src + "]");
console.log(typeof s.src);

var img = document.createElement("img");
console.log("[" + img.src + "]");
console.log("[" + img.alt + "]");
console.log("[" + img.title + "]");

var a = document.createElement("a");
console.log("[" + a.href + "]");
console.log("[" + a.rel + "]");
console.log("[" + a.target + "]");

var inp = document.createElement("input");
console.log("[" + inp.name + "]");
console.log("[" + inp.placeholder + "]");

// form.action with no attribute is the document URL, not ""
var f = document.createElement("form");
console.log(typeof f.action);
console.log(f.action.length > 0);

// limited-value reflections default rather than reading ""
console.log(document.createElement("input").type);
console.log(document.createElement("button").type);
console.log(document.createElement("form").method);

// an already-absolute url reflects back unchanged
s.setAttribute("src", "http://example.com/a/b.js");
console.log(s.src === "http://example.com/a/b.js");

// a relative one still reflects; the resolved form depends on the page URL
a.setAttribute("href", "sub/page.html");
console.log(typeof a.href);
console.log(a.href.indexOf("sub/page.html") >= 0);

// the read that started this: "" has substring, undefined does not
var inline = document.createElement("script");
console.log("[" + inline.src.substring(0, 4) + "]");

// text reads run past the old 1020-byte cap
var d = document.createElement("div");
var big = "";
for (var i = 0; i < 300; i++) { big += "0123456789"; }
d.textContent = big;
console.log(big.length);
console.log(d.textContent.length);
console.log(d.textContent === big);

// an attribute the IDL does not reflect stays undefined: "" would claim the
// element has a property it does not
var u = document.createElement("div");
console.log(typeof u.notAnAttribute);
u.setAttribute("data-x", "1");
console.log(u.getAttribute("data-x"));
console.log("elattr done");
