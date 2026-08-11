// Element properties added alongside the existing DOM API: inline style reads,
// the rest of DOMTokenList, node identity and click(). Run under jsdom on the
// host; the harness gives the same blank document.

var box = document.createElement("div");
document.body.appendChild(box);

box.style.color = "red";
box.style.backgroundColor = "blue";
box.style.marginTop = "4px";
console.log(box.style.color);
console.log(box.style.backgroundColor);
console.log(box.style.marginTop);
console.log("[" + box.style.display + "]");
box.style.setProperty("width", "10px");
console.log(box.style.width);

box.className = "alpha beta";
console.log(box.classList.value);
console.log(box.classList.length);
console.log(box.classList.item(0));
console.log(box.classList.item(1));
console.log(String(box.classList.item(9)));
console.log(box.classList.replace("alpha", "gamma"));
console.log(box.classList.contains("gamma"));
console.log(box.classList.contains("alpha"));
console.log(box.classList.replace("nope", "x"));

console.log(box.nodeType);
console.log(box.nodeName);
console.log(String(box.nodeValue));
var txt = document.createTextNode("words");
console.log(txt.nodeType);
console.log(txt.nodeName);
console.log(txt.nodeValue);

var wrap = document.createElement("ul");
wrap.appendChild(document.createTextNode("gap"));
var li1 = document.createElement("li");
var li2 = document.createElement("li");
wrap.appendChild(li1);
wrap.appendChild(li2);
li1.id = "first";
li2.id = "last";
console.log(wrap.firstElementChild.id);
console.log(wrap.lastElementChild.id);
console.log(wrap.childElementCount);
console.log(wrap.childNodes.length);

var hits = "";
box.addEventListener("click", function () { hits += "c"; });
box.click();
box.click();
console.log(hits);

console.log(box.offsetWidth);
console.log(box.clientHeight);
console.log(box.scrollTop);

// readyState/hidden/visibilityState are fixed at the values a fully loaded
// page reports; jsdom answers for a document still being built, so they are
// not comparable here.
console.log(document.defaultView === window);
console.log(document.characterSet);
console.log("[" + document.referrer + "]");
