(function(){function m(a,b){document.addEventListener?a.addEventListener("scroll",b,!1):a.attachEvent("scroll",b)}function n(a){document.body?a():document.addEventListener?document.addEventListener("DOMContentLoaded",function c(){document.removeEventListener("DOMContentLoaded",c);a()}):document.attachEvent("onreadystatechange",function l(){if("interactive"==document.readyState||"complete"==document.readyState)document.detachEvent("onreadystatechange",l),a()})};function t(a){this.a=document.createElement("div");this.a.setAttribute("aria-hidden","true");this.a.appendChild(document.createTextNode(a));this.b=document.createElement("span");this.c=document.createElement("span");this.h=document.createElement("span");this.f=document.createElement("span");this.g=-1;this.b.style.cssText="max-width:none;display:inline-block;position:absolute;height:100%;width:100%;overflow:scroll;font-size:16px;";this.c.style.cssText="max-width:none;display:inline-block;position:absolute;height:100%;width:100%;overflow:scroll;font-size:16px;";
this.f.style.cssText="max-width:none;display:inline-block;position:absolute;height:100%;width:100%;overflow:scroll;font-size:16px;";this.h.style.cssText="display:inline-block;width:200%;height:200%;font-size:16px;max-width:none;";this.b.appendChild(this.h);this.c.appendChild(this.f);this.a.appendChild(this.b);this.a.appendChild(this.c)}
function x(a,b){a.a.style.cssText="max-width:none;min-width:20px;min-height:20px;display:inline-block;overflow:hidden;position:absolute;width:auto;margin:0;padding:0;top:-999px;left:-999px;white-space:nowrap;font-synthesis:none;font:"+b+";"}function y(a){var b=a.a.offsetWidth,c=b+100;a.f.style.width=c+"px";a.c.scrollLeft=c;a.b.scrollLeft=a.b.scrollWidth+100;return a.g!==b?(a.g=b,!0):!1}function z(a,b){function c(){var a=l;y(a)&&a.a.parentNode&&b(a.g)}var l=a;m(a.b,c);m(a.c,c);y(a)};function A(a,b){var c=b||{};this.family=a;this.style=c.style||"normal";this.weight=c.weight||"normal";this.stretch=c.stretch||"normal"}var B=null,C=null,E=null,F=null;function I(){if(null===E){var a=document.createElement("div");try{a.style.font="condensed 100px sans-serif"}catch(b){}E=""!==a.style.font}return E}function J(a,b){return[a.style,a.weight,I()?a.stretch:"","100px",b].join(" ")}
A.prototype.load=function(a,b){var c=this,l=a||"BESbswy",r=0,D=b||3E3,G=(new Date).getTime();return new Promise(function(a,b){var e;null===F&&(F=!!document.fonts);if(e=F)null===C&&(C=/OS X.*Version\/10\.0.*Safari/.test(window.navigator.userAgent)&&/Apple/.test(window.navigator.vendor)),e=!C;if(e){e=new Promise(function(a,b){function f(){(new Date).getTime()-G>=D?b():document.fonts.load(J(c,'"'+c.family+'"'),l).then(function(c){1<=c.length?a():setTimeout(f,25)},function(){b()})}f()});var K=new Promise(function(a,
c){r=setTimeout(c,D)});Promise.race([K,e]).then(function(){clearTimeout(r);a(c)},function(){b(c)})}else n(function(){function e(){var b;if(b=-1!=g&&-1!=h||-1!=g&&-1!=k||-1!=h&&-1!=k)(b=g!=h&&g!=k&&h!=k)||(null===B&&(b=/AppleWebKit\/([0-9]+)(?:\.([0-9]+))/.exec(window.navigator.userAgent),B=!!b&&(536>parseInt(b[1],10)||536===parseInt(b[1],10)&&11>=parseInt(b[2],10))),b=B&&(g==u&&h==u&&k==u||g==v&&h==v&&k==v||g==w&&h==w&&k==w)),b=!b;b&&(d.parentNode&&d.parentNode.removeChild(d),clearTimeout(r),a(c))}
function H(){if((new Date).getTime()-G>=D)d.parentNode&&d.parentNode.removeChild(d),b(c);else{var a=document.hidden;if(!0===a||void 0===a)g=f.a.offsetWidth,h=p.a.offsetWidth,k=q.a.offsetWidth,e();r=setTimeout(H,50)}}var f=new t(l),p=new t(l),q=new t(l),g=-1,h=-1,k=-1,u=-1,v=-1,w=-1,d=document.createElement("div");d.dir="ltr";x(f,J(c,"sans-serif"));x(p,J(c,"serif"));x(q,J(c,"monospace"));d.appendChild(f.a);d.appendChild(p.a);d.appendChild(q.a);document.body.appendChild(d);u=f.a.offsetWidth;v=p.a.offsetWidth;
w=q.a.offsetWidth;H();z(f,function(a){g=a;e()});x(f,J(c,'"'+c.family+'",sans-serif'));z(p,function(a){h=a;e()});x(p,J(c,'"'+c.family+'",serif'));z(q,function(a){k=a;e()});x(q,J(c,'"'+c.family+'",monospace'))})})};"undefined"!==typeof module?module.exports=A:(window.FontFaceObserver=A,window.FontFaceObserver.prototype.load=A.prototype.load);}());

new FontFaceObserver('LatoWeb').load().then(function () {
  document.documentElement.classList.add('lato-font-loaded');
}, console.log.bind(console, 'Failed to load Lato font'));

// this file was autogenerated by script/make-lato-fontface-observer.sh.
// edit that file, not the generated one. Run this again
// if you npm install a new version of fontfaceobserver
// or make any changes.

