// Event propagation. JsDispatchEvent currently matches the exact target node
// only (l->node == node), so nothing bubbles. That breaks event delegation,
// which is how React's synthetic events and most routers work.
var root = document.createElement("div");
var mid  = document.createElement("section");
var leaf = document.createElement("button");
root.appendChild(mid);
mid.appendChild(leaf);
document.body.appendChild(root);

var order = "";
root.addEventListener("click", function () { order += "root;"; });
mid.addEventListener("click",  function () { order += "mid;"; });
leaf.addEventListener("click", function () { order += "leaf;"; });

leaf.dispatchEvent(new CustomEvent("click", { bubbles: true }));
console.log(order);

// delegation: one handler on an ancestor, target identifies the real source
var who = "";
var host = document.createElement("div");
var kid  = document.createElement("a");
host.appendChild(kid);
document.body.appendChild(host);
host.addEventListener("click", function (e) {
	who += e.target.tagName + ",";
	who += e.currentTarget.tagName + ";";
});
kid.dispatchEvent(new CustomEvent("click", { bubbles: true }));
console.log(who);

// stopPropagation halts the walk partway
var seen = "";
var o1 = document.createElement("div");
var o2 = document.createElement("div");
var o3 = document.createElement("div");
o1.appendChild(o2); o2.appendChild(o3);
document.body.appendChild(o1);
o1.addEventListener("click", function () { seen += "o1;"; });
o2.addEventListener("click", function (e) { seen += "o2;"; e.stopPropagation(); });
o3.addEventListener("click", function () { seen += "o3;"; });
o3.dispatchEvent(new CustomEvent("click", { bubbles: true }));
console.log(seen);

// a non-bubbling event reaches only its target
var nb = "";
var p1 = document.createElement("div");
var c1 = document.createElement("span");
p1.appendChild(c1);
document.body.appendChild(p1);
p1.addEventListener("click", function () { nb += "parent;"; });
c1.addEventListener("click", function () { nb += "child;"; });
c1.dispatchEvent(new CustomEvent("click", { bubbles: false }));
console.log(nb);
