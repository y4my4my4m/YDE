// DOM pieces frameworks patch the tree with. DocumentFragment and dataset are
// absent today; cloneNode and insertBefore exist and are covered as regression.
var frag = document.createDocumentFragment();
var a = document.createElement("i");
var b = document.createElement("u");
a.textContent = "one";
b.textContent = "two";
frag.appendChild(a);
frag.appendChild(b);

var host = document.createElement("div");
document.body.appendChild(host);
host.appendChild(frag);
console.log(host.childNodes.length);
console.log(host.textContent);
// appending a fragment moves its children out, leaving it empty
console.log(frag.childNodes.length);

// dataset maps to data-* attributes both ways
var d = document.createElement("div");
d.setAttribute("data-user-id", "42");
console.log(d.dataset.userId);
d.dataset.role = "admin";
console.log(d.getAttribute("data-role"));

// insertBefore places ahead of the reference node
var list = document.createElement("ul");
var li2 = document.createElement("li"); li2.textContent = "2";
var li1 = document.createElement("li"); li1.textContent = "1";
list.appendChild(li2);
list.insertBefore(li1, li2);
console.log(list.textContent);

// cloneNode: shallow drops children, deep keeps them
var src = document.createElement("div");
var inner = document.createElement("b");
inner.textContent = "deep";
src.appendChild(inner);
src.setAttribute("class", "orig");
var shallow = src.cloneNode(false);
var deep = src.cloneNode(true);
console.log(shallow.childNodes.length);
console.log(deep.childNodes.length);
console.log(deep.textContent);
console.log(deep.getAttribute("class"));

// removeChild detaches
var rm = document.createElement("div");
var gone = document.createElement("span");
rm.appendChild(gone);
rm.removeChild(gone);
console.log(rm.childNodes.length);
