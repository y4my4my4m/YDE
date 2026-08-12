// A leading `//#sourceMappingURL=data:...` comment. The base64 alphabet
// includes '/' and '+', so the payload below contains '//', '*/', '/*' and
// '+/' runs on purpose: a line comment ends at the line terminator and at
// nothing else, and none of those sequences may start, end or restart any
// scanner. The payload is synthetic - generated, not taken from any page.
//
// The failure this guards against is silent: if the scan gives up early, the
// rest of the payload lexes as code and the real code after it never runs.
//#sourceMappingURL=data:application/json;charset=utf-8;base64,pTyGJMuHbEL31IeL2HPcHyGcFRl1SPnXNYvMIHa/2o76umfXfKm/r5kJP1VrT+1FJors/6ILi8IHn5kxsC7tVO/HbkQfyy/KV5zjR3j1twdTKWTddB+XhkAS1voQG6yyzyN9zHYIa4UOrGNA++//+/TMuDJawTgsu8PO+799nKSNrh9UCauSDmLhuVtcqcYezdZ/tD//Dj8hYs5suKcNd8Zra9A9sKPxZ9W3qLy7zKUVQDT7S8sTQCBNR3YbDgbleph1QHt61QTC4XATWS8PHp9NHfYjFM5DI4pZj59f*/hZ5R1Py4oJe2JbmPTuSgR7cMy+UcU3zr1ZtoLuCr64CxqlIOdNKhiFXiQ2hzT/pLjHX2JiCLhKcIhP6Br1iQFeOUhGXZnnal++//+/5WisCgEBCY8f5N3/ynbdrZRzsGQBJg3UHKwkflF6XUi5AhuqpfEnbtXAqwK8jZfALhLSzFyCmmdKTxp/TkSF2RCdKDFRuNw5/*GCf+hA6ILI8gJhead6/wJ9kFZJSqgmRB9H+iMb+lk777PZnK//8Cl6J5ixaaJLShuQjOud/+yDUA+5zmS1swoPqApryPZBlgvIyxJu2jGjNGkTfi3oYv2DzaKG05Rk+GQV81rkmghzem9yPVUJ++//+/a/c5q52RYfLWrLoevhZC0x0awirH/juQbLifxz53nCQE28+AJy75fNcTTN6KFAQdEmQg3OMJmYxhcABm6jof8efD0nHCY/1Kgd2vd/Er1uyZAlIa/ZnYd7chlN/Xc+1HSyGbDS1GHXy5oOKVqYX7Enwvq4VNAKjKs1Pawtn3LG8Zv5Ypu8D0fzFwE7IHgYIr*/uiqFhojmAIDdN87xg3/Q/XBmTepo6uKZyUf0IE9pU2NJhKaM//++//+/1/5WdR16ePlljivghZ4fXfeTkYpIygfdM7ENA8d5vFldPGYYJvW5hANsbEvrSFagEaBp0vXnJaE/9I0MyTLUyi0kn1Gnt11CuZyzaA3U2OLzu6UQBGSyLvVSskUVINx+ZmQF9oGxLUczZ8XbFzUxtPTfYFEpPx6n1nf2xv54WCA+7e56W8zNIQt3uL4FFQKoKGwRDIOYQ+kVcIsgUpj6Sg9aheovEZXzUjpwVhOGu5Ngyvhw/*++//+/vSuqK4dWGlgnoAEcTl31uGQ+dFCGAtmNtc0mRau8URBfT5MISizhBHs4/fVAFHDzXeUHNBZS0Z1WnImG9Aw37K5WcNhdEPqh//Gi3hlbKBVheZUpYxqew88AD3dnbyJVSEDONUsSDDFRFIFIuZIxNfaaOEELk9MQMalor2hCsgkGvp8kD0D3Ms8GbLkV3AZkGAs+M+X/shUkbd/VOK+NptMzyL2Dvamh2Vwd6QEspT5pV74gdQ*/++//+/q7eYimTTfpsUepYhNVNZxTSmm3jZNNjax7EBz3cl7CSgzAf31ddXP63ohM1fzUg296C0XpBx+NEgbUZsM6a8Cvr06aXyPtHgjwzHBJ11thNcmzcy7bVQIY8cSt07lQ8tdiwg2X9Ajtfmp9+2KuTmxHKpRsBBaJlgMSdX5sTazVLmZ/bK4OPh1dR8/H97S+f///VAUp7/l7v21JXuDCFqM9+SEb1QrMur8ak3r2gGllt/zqisa/++//+/PqYomQLFzzGzmNAFY8HwSKbF6WMXE1MBvRnhmX1EoC3G/FP1z5IBxT80NK8bTB2ABPLbPQ8Cjf5XGuSKl/6gGEBHBKxnnV+Hov48VSOuU19x5iqljHqBTn2fwxwd5kAphi2UFkSSj/sK+wZd/*nHy7agBx6LtIdyhp9ZYbYLXlutzTfF/vNv7KToDsjCMEa+bhj2M5QgErZXwKDGEv6+IyPLgodLyX5UvecWEgtHDGh9HMSoAZ++//+/m4N8pvgxPv9wV4eSB7YEUcJvR5MxCJ5rpd9OuSqcHX5S4Ti1//*/0fTDilqVh+No69OTHb9kPgZu3heeMxl1UHlSC4rR4AkXu3F0bjXRXdWZKL/jWaRYnZBI0Hsqk/LB09RifXuEUvAt5JPtfpwHlN/5DRCfLcXVNngDCMYhC7e4NsMWFiP7/jOPPzRddS7yVCx1EyGurzeq3pzGpStf2BuNXIp3ZCcR1y6FFEiiEMgPB3eFkOns++//+/VPHiK7S4PQl0kjfLk6cxZu6m98nDfqcYxyBtUepp+ikblHCUIs4Hx4tNcT1rtRZjM8iQ0NA0P/yT1jOw56ktltyxpA/w4mXmS3wdLqpfpa2BDGg/mn33x7tFs5BIdM0vzTY1+z4rLVuouJnW//Olr1UlaY0XHNtF0BAnAmyMBDZW/iSZ0PSUNDMJV+73HBpSetjVEiMIsY5xCGcyF4GefcFUWoA6m1g/Ifxc0nz+CfLWVtwXAl++//+/yuOqxqzIP2sfxY7kse3EjDrTeQLZiQ47eUvtbzwam8ad5Qh4/*vfzbQPLixDSnBxLWdpYNIumYInLckQzktz7QjWDus0D7fztM*/XlOicFzFU3ZmTwFnWd/g3sAOkFGfOEoasL1ycjLs24r5Ga2Q+YFhWUehfHVts0LZnRR+9eeA4RsmRSeqP2VT7zaOlBu+aFHjmZOn5OUp47ulVJFB7+KqhN+3+YpBtLkgfKRDDySlvXVNnpwX//++//+/todvRvgeHFNzGb/2/UmKSdUR4zLF49YbvAE2SkJH1rI4BWVwlA4sZ8Kp62TzKHqm1v9RmrDYc5KSv1ue4yhOdXZOcgMYg+d6cOK0J4RON6yVY8LRvHzeGvFBb6mPR2LZOtVurBgPevt+FtMtpOEfgtY5C4OC+OJhXTlwSgi4BDrT+9EEJXy8U5ydJuqbnQFbVu7q7xtoAq9qdCf6FSSixiIhtREMZ2MukeSJmrufszqHrp9v++//+/fesTRaA6z5ymVISmngrJYKWmt7t2I+oWjgCVieCbGz5ZkMZeHQGKJrRAYiBpDbppD+zrWH1FLq/zg7BDooH1qULCTaSLtu2s//
(function () {
	var built = [];
	built.push("iife ran");
	console.log(built.join(","));
})();

console.log("after the mapping comment");

// no space after the slashes, and again with one
//#sourceMappingURL=data:application/json;base64,QUJD//DEF*/GHI+/JKL
//# sourceMappingURL=data:application/json;base64,MNO//PQR*/STU+/VWX
console.log("after both spellings");

// a line comment holding a block-comment opener must not open a block
// /* this is not a block comment
console.log("block opener in a line comment is inert");

/* a block comment holding // must not end at it
   // still inside
   and a URL http://example.com/a/b inside too */
console.log("line marker in a block comment is inert");

// strings and regexes that merely LOOK like comments
var url = "http://example.com/x//y";
console.log(url);
console.log(url.indexOf("//"));
var notcomment = "a//b";
console.log(notcomment);
var slashes = /\/\//;
console.log(slashes.test("x//y"));
console.log("//not a comment".length);

// a division that follows a paren, next to something comment-shaped
var q = 10;
var r = (q) / 2;
console.log(r);

// trailing line comment with no newline after it is the last thing in the file
console.log("end of comment tests");
//#sourceMappingURL=data:application/json;base64,pTyGJMuHbEL31IeL2HPcHyGcFRl1SPnXNYvMIHa/2o76umfXfKm/r5kJP1VrT+1FJors/6ILi8IHn5kxsC7tVO/HbkQfyy/KV5zjR3j1twdTKWTddB+XhkAS
