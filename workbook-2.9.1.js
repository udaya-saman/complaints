/* Customer Complaints Hub v2.9.1 workbook reader, pako MIT */
/* pako 0.2.9 nodeca/pako */
!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var t;t="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this,t.pako=e()}}(function(){return function e(t,i,n){function a(o,s){if(!i[o]){if(!t[o]){var f="function"==typeof require&&require;if(!s&&f)return f(o,!0);if(r)return r(o,!0);var l=new Error("Cannot find module '"+o+"'");throw l.code="MODULE_NOT_FOUND",l}var d=i[o]={exports:{}};t[o][0].call(d.exports,function(e){var i=t[o][1][e];return a(i?i:e)},d,d.exports,e,t,i,n)}return i[o].exports}for(var r="function"==typeof require&&require,o=0;o<n.length;o++)a(n[o]);return a}({1:[function(e,t,i){"use strict";var n="undefined"!=typeof Uint8Array&&"undefined"!=typeof Uint16Array&&"undefined"!=typeof Int32Array;i.assign=function(e){for(var t=Array.prototype.slice.call(arguments,1);t.length;){var i=t.shift();if(i){if("object"!=typeof i)throw new TypeError(i+"must be non-object");for(var n in i)i.hasOwnProperty(n)&&(e[n]=i[n])}}return e},i.shrinkBuf=function(e,t){return e.length===t?e:e.subarray?e.subarray(0,t):(e.length=t,e)};var a={arraySet:function(e,t,i,n,a){if(t.subarray&&e.subarray)return void e.set(t.subarray(i,i+n),a);for(var r=0;r<n;r++)e[a+r]=t[i+r]},flattenChunks:function(e){var t,i,n,a,r,o;for(n=0,t=0,i=e.length;t<i;t++)n+=e[t].length;for(o=new Uint8Array(n),a=0,t=0,i=e.length;t<i;t++)r=e[t],o.set(r,a),a+=r.length;return o}},r={arraySet:function(e,t,i,n,a){for(var r=0;r<n;r++)e[a+r]=t[i+r]},flattenChunks:function(e){return[].concat.apply([],e)}};i.setTyped=function(e){e?(i.Buf8=Uint8Array,i.Buf16=Uint16Array,i.Buf32=Int32Array,i.assign(i,a)):(i.Buf8=Array,i.Buf16=Array,i.Buf32=Array,i.assign(i,r))},i.setTyped(n)},{}],2:[function(e,t,i){"use strict";function n(e,t){if(t<65537&&(e.subarray&&o||!e.subarray&&r))return String.fromCharCode.apply(null,a.shrinkBuf(e,t));for(var i="",n=0;n<t;n++)i+=String.fromCharCode(e[n]);return i}var a=e("./common"),r=!0,o=!0;try{String.fromCharCode.apply(null,[0])}catch(e){r=!1}try{String.fromCharCode.apply(null,new Uint8Array(1))}catch(e){o=!1}for(var s=new a.Buf8(256),f=0;f<256;f++)s[f]=f>=252?6:f>=248?5:f>=240?4:f>=224?3:f>=192?2:1;s[254]=s[254]=1,i.string2buf=function(e){var t,i,n,r,o,s=e.length,f=0;for(r=0;r<s;r++)i=e.charCodeAt(r),55296===(64512&i)&&r+1<s&&(n=e.charCodeAt(r+1),56320===(64512&n)&&(i=65536+(i-55296<<10)+(n-56320),r++)),f+=i<128?1:i<2048?2:i<65536?3:4;for(t=new a.Buf8(f),o=0,r=0;o<f;r++)i=e.charCodeAt(r),55296===(64512&i)&&r+1<s&&(n=e.charCodeAt(r+1),56320===(64512&n)&&(i=65536+(i-55296<<10)+(n-56320),r++)),i<128?t[o++]=i:i<2048?(t[o++]=192|i>>>6,t[o++]=128|63&i):i<65536?(t[o++]=224|i>>>12,t[o++]=128|i>>>6&63,t[o++]=128|63&i):(t[o++]=240|i>>>18,t[o++]=128|i>>>12&63,t[o++]=128|i>>>6&63,t[o++]=128|63&i);return t},i.buf2binstring=function(e){return n(e,e.length)},i.binstring2buf=function(e){for(var t=new a.Buf8(e.length),i=0,n=t.length;i<n;i++)t[i]=e.charCodeAt(i);return t},i.buf2string=function(e,t){var i,a,r,o,f=t||e.length,l=new Array(2*f);for(a=0,i=0;i<f;)if(r=e[i++],r<128)l[a++]=r;else if(o=s[r],o>4)l[a++]=65533,i+=o-1;else{for(r&=2===o?31:3===o?15:7;o>1&&i<f;)r=r<<6|63&e[i++],o--;o>1?l[a++]=65533:r<65536?l[a++]=r:(r-=65536,l[a++]=55296|r>>10&1023,l[a++]=56320|1023&r)}return n(l,a)},i.utf8border=function(e,t){var i;for(t=t||e.length,t>e.length&&(t=e.length),i=t-1;i>=0&&128===(192&e[i]);)i--;return i<0?t:0===i?t:i+s[e[i]]>t?i:t}},{"./common":1}],3:[function(e,t,i){"use strict";function n(e,t,i,n){for(var a=65535&e|0,r=e>>>16&65535|0,o=0;0!==i;){o=i>2e3?2e3:i,i-=o;do a=a+t[n++]|0,r=r+a|0;while(--o);a%=65521,r%=65521}return a|r<<16|0}t.exports=n},{}],4:[function(e,t,i){"use strict";t.exports={Z_NO_FLUSH:0,Z_PARTIAL_FLUSH:1,Z_SYNC_FLUSH:2,Z_FULL_FLUSH:3,Z_FINISH:4,Z_BLOCK:5,Z_TREES:6,Z_OK:0,Z_STREAM_END:1,Z_NEED_DICT:2,Z_ERRNO:-1,Z_STREAM_ERROR:-2,Z_DATA_ERROR:-3,Z_BUF_ERROR:-5,Z_NO_COMPRESSION:0,Z_BEST_SPEED:1,Z_BEST_COMPRESSION:9,Z_DEFAULT_COMPRESSION:-1,Z_FILTERED:1,Z_HUFFMAN_ONLY:2,Z_RLE:3,Z_FIXED:4,Z_DEFAULT_STRATEGY:0,Z_BINARY:0,Z_TEXT:1,Z_UNKNOWN:2,Z_DEFLATED:8}},{}],5:[function(e,t,i){"use strict";function n(){for(var e,t=[],i=0;i<256;i++){e=i;for(var n=0;n<8;n++)e=1&e?3988292384^e>>>1:e>>>1;t[i]=e}return t}function a(e,t,i,n){var a=r,o=n+i;e^=-1;for(var s=n;s<o;s++)e=e>>>8^a[255&(e^t[s])];return e^-1}var r=n();t.exports=a},{}],6:[function(e,t,i){"use strict";function n(){this.text=0,this.time=0,this.xflags=0,this.os=0,this.extra=null,this.extra_len=0,this.name="",this.comment="",this.hcrc=0,this.done=!1}t.exports=n},{}],7:[function(e,t,i){"use strict";var n=30,a=12;t.exports=function(e,t){var i,r,o,s,f,l,d,u,c,h,b,w,m,k,_,g,v,p,x,y,S,E,B,Z,A;i=e.state,r=e.next_in,Z=e.input,o=r+(e.avail_in-5),s=e.next_out,A=e.output,f=s-(t-e.avail_out),l=s+(e.avail_out-257),d=i.dmax,u=i.wsize,c=i.whave,h=i.wnext,b=i.window,w=i.hold,m=i.bits,k=i.lencode,_=i.distcode,g=(1<<i.lenbits)-1,v=(1<<i.distbits)-1;e:do{m<15&&(w+=Z[r++]<<m,m+=8,w+=Z[r++]<<m,m+=8),p=k[w&g];t:for(;;){if(x=p>>>24,w>>>=x,m-=x,x=p>>>16&255,0===x)A[s++]=65535&p;else{if(!(16&x)){if(0===(64&x)){p=k[(65535&p)+(w&(1<<x)-1)];continue t}if(32&x){i.mode=a;break e}e.msg="invalid literal/length code",i.mode=n;break e}y=65535&p,x&=15,x&&(m<x&&(w+=Z[r++]<<m,m+=8),y+=w&(1<<x)-1,w>>>=x,m-=x),m<15&&(w+=Z[r++]<<m,m+=8,w+=Z[r++]<<m,m+=8),p=_[w&v];i:for(;;){if(x=p>>>24,w>>>=x,m-=x,x=p>>>16&255,!(16&x)){if(0===(64&x)){p=_[(65535&p)+(w&(1<<x)-1)];continue i}e.msg="invalid distance code",i.mode=n;break e}if(S=65535&p,x&=15,m<x&&(w+=Z[r++]<<m,m+=8,m<x&&(w+=Z[r++]<<m,m+=8)),S+=w&(1<<x)-1,S>d){e.msg="invalid distance too far back",i.mode=n;break e}if(w>>>=x,m-=x,x=s-f,S>x){if(x=S-x,x>c&&i.sane){e.msg="invalid distance too far back",i.mode=n;break e}if(E=0,B=b,0===h){if(E+=u-x,x<y){y-=x;do A[s++]=b[E++];while(--x);E=s-S,B=A}}else if(h<x){if(E+=u+h-x,x-=h,x<y){y-=x;do A[s++]=b[E++];while(--x);if(E=0,h<y){x=h,y-=x;do A[s++]=b[E++];while(--x);E=s-S,B=A}}}else if(E+=h-x,x<y){y-=x;do A[s++]=b[E++];while(--x);E=s-S,B=A}for(;y>2;)A[s++]=B[E++],A[s++]=B[E++],A[s++]=B[E++],y-=3;y&&(A[s++]=B[E++],y>1&&(A[s++]=B[E++]))}else{E=s-S;do A[s++]=A[E++],A[s++]=A[E++],A[s++]=A[E++],y-=3;while(y>2);y&&(A[s++]=A[E++],y>1&&(A[s++]=A[E++]))}break}}break}}while(r<o&&s<l);y=m>>3,r-=y,m-=y<<3,w&=(1<<m)-1,e.next_in=r,e.next_out=s,e.avail_in=r<o?5+(o-r):5-(r-o),e.avail_out=s<l?257+(l-s):257-(s-l),i.hold=w,i.bits=m}},{}],8:[function(e,t,i){"use strict";function n(e){return(e>>>24&255)+(e>>>8&65280)+((65280&e)<<8)+((255&e)<<24)}function a(){this.mode=0,this.last=!1,this.wrap=0,this.havedict=!1,this.flags=0,this.dmax=0,this.check=0,this.total=0,this.head=null,this.wbits=0,this.wsize=0,this.whave=0,this.wnext=0,this.window=null,this.hold=0,this.bits=0,this.length=0,this.offset=0,this.extra=0,this.lencode=null,this.distcode=null,this.lenbits=0,this.distbits=0,this.ncode=0,this.nlen=0,this.ndist=0,this.have=0,this.next=null,this.lens=new _.Buf16(320),this.work=new _.Buf16(288),this.lendyn=null,this.distdyn=null,this.sane=0,this.back=0,this.was=0}function r(e){var t;return e&&e.state?(t=e.state,e.total_in=e.total_out=t.total=0,e.msg="",t.wrap&&(e.adler=1&t.wrap),t.mode=D,t.last=0,t.havedict=0,t.dmax=32768,t.head=null,t.hold=0,t.bits=0,t.lencode=t.lendyn=new _.Buf32(we),t.distcode=t.distdyn=new _.Buf32(me),t.sane=1,t.back=-1,z):C}function o(e){var t;return e&&e.state?(t=e.state,t.wsize=0,t.whave=0,t.wnext=0,r(e)):C}function s(e,t){var i,n;return e&&e.state?(n=e.state,t<0?(i=0,t=-t):(i=(t>>4)+1,t<48&&(t&=15)),t&&(t<8||t>15)?C:(null!==n.window&&n.wbits!==t&&(n.window=null),n.wrap=i,n.wbits=t,o(e))):C}function f(e,t){var i,n;return e?(n=new a,e.state=n,n.window=null,i=s(e,t),i!==z&&(e.state=null),i):C}function l(e){return f(e,_e)}function d(e){if(ge){var t;for(m=new _.Buf32(512),k=new _.Buf32(32),t=0;t<144;)e.lens[t++]=8;for(;t<256;)e.lens[t++]=9;for(;t<280;)e.lens[t++]=7;for(;t<288;)e.lens[t++]=8;for(x(S,e.lens,0,288,m,0,e.work,{bits:9}),t=0;t<32;)e.lens[t++]=5;x(E,e.lens,0,32,k,0,e.work,{bits:5}),ge=!1}e.lencode=m,e.lenbits=9,e.distcode=k,e.distbits=5}function u(e,t,i,n){var a,r=e.state;return null===r.window&&(r.wsize=1<<r.wbits,r.wnext=0,r.whave=0,r.window=new _.Buf8(r.wsize)),n>=r.wsize?(_.arraySet(r.window,t,i-r.wsize,r.wsize,0),r.wnext=0,r.whave=r.wsize):(a=r.wsize-r.wnext,a>n&&(a=n),_.arraySet(r.window,t,i-n,a,r.wnext),n-=a,n?(_.arraySet(r.window,t,i-n,n,0),r.wnext=n,r.whave=r.wsize):(r.wnext+=a,r.wnext===r.wsize&&(r.wnext=0),r.whave<r.wsize&&(r.whave+=a))),0}function c(e,t){var i,a,r,o,s,f,l,c,h,b,w,m,k,we,me,ke,_e,ge,ve,pe,xe,ye,Se,Ee,Be=0,Ze=new _.Buf8(4),Ae=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];if(!e||!e.state||!e.output||!e.input&&0!==e.avail_in)return C;i=e.state,i.mode===X&&(i.mode=W),s=e.next_out,r=e.output,l=e.avail_out,o=e.next_in,a=e.input,f=e.avail_in,c=i.hold,h=i.bits,b=f,w=l,ye=z;e:for(;;)switch(i.mode){case D:if(0===i.wrap){i.mode=W;break}for(;h<16;){if(0===f)break e;f--,c+=a[o++]<<h,h+=8}if(2&i.wrap&&35615===c){i.check=0,Ze[0]=255&c,Ze[1]=c>>>8&255,i.check=v(i.check,Ze,2,0),c=0,h=0,i.mode=F;break}if(i.flags=0,i.head&&(i.head.done=!1),!(1&i.wrap)||(((255&c)<<8)+(c>>8))%31){e.msg="incorrect header check",i.mode=ce;break}if((15&c)!==U){e.msg="unknown compression method",i.mode=ce;break}if(c>>>=4,h-=4,xe=(15&c)+8,0===i.wbits)i.wbits=xe;else if(xe>i.wbits){e.msg="invalid window size",i.mode=ce;break}i.dmax=1<<xe,e.adler=i.check=1,i.mode=512&c?q:X,c=0,h=0;break;case F:for(;h<16;){if(0===f)break e;f--,c+=a[o++]<<h,h+=8}if(i.flags=c,(255&i.flags)!==U){e.msg="unknown compression method",i.mode=ce;break}if(57344&i.flags){e.msg="unknown header flags set",i.mode=ce;break}i.head&&(i.head.text=c>>8&1),512&i.flags&&(Ze[0]=255&c,Ze[1]=c>>>8&255,i.check=v(i.check,Ze,2,0)),c=0,h=0,i.mode=L;case L:for(;h<32;){if(0===f)break e;f--,c+=a[o++]<<h,h+=8}i.head&&(i.head.time=c),512&i.flags&&(Ze[0]=255&c,Ze[1]=c>>>8&255,Ze[2]=c>>>16&255,Ze[3]=c>>>24&255,i.check=v(i.check,Ze,4,0)),c=0,h=0,i.mode=H;case H:for(;h<16;){if(0===f)break e;f--,c+=a[o++]<<h,h+=8}i.head&&(i.head.xflags=255&c,i.head.os=c>>8),512&i.flags&&(Ze[0]=255&c,Ze[1]=c>>>8&255,i.check=v(i.check,Ze,2,0)),c=0,h=0,i.mode=M;case M:if(1024&i.flags){for(;h<16;){if(0===f)break e;f--,c+=a[o++]<<h,h+=8}i.length=c,i.head&&(i.head.extra_len=c),512&i.flags&&(Ze[0]=255&c,Ze[1]=c>>>8&255,i.check=v(i.check,Ze,2,0)),c=0,h=0}else i.head&&(i.head.extra=null);i.mode=j;case j:if(1024&i.flags&&(m=i.length,m>f&&(m=f),m&&(i.head&&(xe=i.head.extra_len-i.length,i.head.extra||(i.head.extra=new Array(i.head.extra_len)),_.arraySet(i.head.extra,a,o,m,xe)),512&i.flags&&(i.check=v(i.check,a,m,o)),f-=m,o+=m,i.length-=m),i.length))break e;i.length=0,i.mode=K;case K:if(2048&i.flags){if(0===f)break e;m=0;do xe=a[o+m++],i.head&&xe&&i.length<65536&&(i.head.name+=String.fromCharCode(xe));while(xe&&m<f);if(512&i.flags&&(i.check=v(i.check,a,m,o)),f-=m,o+=m,xe)break e}else i.head&&(i.head.name=null);i.length=0,i.mode=P;case P:if(4096&i.flags){if(0===f)break e;m=0;do xe=a[o+m++],i.head&&xe&&i.length<65536&&(i.head.comment+=String.fromCharCode(xe));while(xe&&m<f);if(512&i.flags&&(i.check=v(i.check,a,m,o)),f-=m,o+=m,xe)break e}else i.head&&(i.head.comment=null);i.mode=Y;case Y:if(512&i.flags){for(;h<16;){if(0===f)break e;f--,c+=a[o++]<<h,h+=8}if(c!==(65535&i.check)){e.msg="header crc mismatch",i.mode=ce;break}c=0,h=0}i.head&&(i.head.hcrc=i.flags>>9&1,i.head.done=!0),e.adler=i.check=0,i.mode=X;break;case q:for(;h<32;){if(0===f)break e;f--,c+=a[o++]<<h,h+=8}e.adler=i.check=n(c),c=0,h=0,i.mode=G;case G:if(0===i.havedict)return e.next_out=s,e.avail_out=l,e.next_in=o,e.avail_in=f,i.hold=c,i.bits=h,N;e.adler=i.check=1,i.mode=X;case X:if(t===Z||t===A)break e;case W:if(i.last){c>>>=7&h,h-=7&h,i.mode=le;break}for(;h<3;){if(0===f)break e;f--,c+=a[o++]<<h,h+=8}switch(i.last=1&c,c>>>=1,h-=1,3&c){case 0:i.mode=J;break;case 1:if(d(i),i.mode=ie,t===A){c>>>=2,h-=2;break e}break;case 2:i.mode=$;break;case 3:e.msg="invalid block type",i.mode=ce}c>>>=2,h-=2;break;case J:for(c>>>=7&h,h-=7&h;h<32;){if(0===f)break e;f--,c+=a[o++]<<h,h+=8}if((65535&c)!==(c>>>16^65535)){e.msg="invalid stored block lengths",i.mode=ce;break}if(i.length=65535&c,c=0,h=0,i.mode=Q,t===A)break e;case Q:i.mode=V;case V:if(m=i.length){if(m>f&&(m=f),m>l&&(m=l),0===m)break e;_.arraySet(r,a,o,m,s),f-=m,o+=m,l-=m,s+=m,i.length-=m;break}i.mode=X;break;case $:for(;h<14;){if(0===f)break e;f--,c+=a[o++]<<h,h+=8}if(i.nlen=(31&c)+257,c>>>=5,h-=5,i.ndist=(31&c)+1,c>>>=5,h-=5,i.ncode=(15&c)+4,c>>>=4,h-=4,i.nlen>286||i.ndist>30){e.msg="too many length or distance symbols",i.mode=ce;break}i.have=0,i.mode=ee;case ee:for(;i.have<i.ncode;){for(;h<3;){if(0===f)break e;f--,c+=a[o++]<<h,h+=8}i.lens[Ae[i.have++]]=7&c,c>>>=3,h-=3}for(;i.have<19;)i.lens[Ae[i.have++]]=0;if(i.lencode=i.lendyn,i.lenbits=7,Se={bits:i.lenbits},ye=x(y,i.lens,0,19,i.lencode,0,i.work,Se),i.lenbits=Se.bits,ye){e.msg="invalid code lengths set",i.mode=ce;break}i.have=0,i.mode=te;case te:for(;i.have<i.nlen+i.ndist;){for(;Be=i.lencode[c&(1<<i.lenbits)-1],me=Be>>>24,ke=Be>>>16&255,_e=65535&Be,!(me<=h);){if(0===f)break e;f--,c+=a[o++]<<h,h+=8}if(_e<16)c>>>=me,h-=me,i.lens[i.have++]=_e;else{if(16===_e){for(Ee=me+2;h<Ee;){if(0===f)break e;f--,c+=a[o++]<<h,h+=8}if(c>>>=me,h-=me,0===i.have){e.msg="invalid bit length repeat",i.mode=ce;break}xe=i.lens[i.have-1],m=3+(3&c),c>>>=2,h-=2}else if(17===_e){for(Ee=me+3;h<Ee;){if(0===f)break e;f--,c+=a[o++]<<h,h+=8}c>>>=me,h-=me,xe=0,m=3+(7&c),c>>>=3,h-=3}else{for(Ee=me+7;h<Ee;){if(0===f)break e;f--,c+=a[o++]<<h,h+=8}c>>>=me,h-=me,xe=0,m=11+(127&c),c>>>=7,h-=7}if(i.have+m>i.nlen+i.ndist){e.msg="invalid bit length repeat",i.mode=ce;break}for(;m--;)i.lens[i.have++]=xe}}if(i.mode===ce)break;if(0===i.lens[256]){e.msg="invalid code -- missing end-of-block",i.mode=ce;break}if(i.lenbits=9,Se={bits:i.lenbits},ye=x(S,i.lens,0,i.nlen,i.lencode,0,i.work,Se),i.lenbits=Se.bits,ye){e.msg="invalid literal/lengths set",i.mode=ce;break}if(i.distbits=6,i.distcode=i.distdyn,Se={bits:i.distbits},ye=x(E,i.lens,i.nlen,i.ndist,i.distcode,0,i.work,Se),i.distbits=Se.bits,ye){e.msg="invalid distances set",i.mode=ce;break}if(i.mode=ie,t===A)break e;case ie:i.mode=ne;case ne:if(f>=6&&l>=258){e.next_out=s,e.avail_out=l,e.next_in=o,e.avail_in=f,i.hold=c,i.bits=h,p(e,w),s=e.next_out,r=e.output,l=e.avail_out,o=e.next_in,a=e.input,f=e.avail_in,c=i.hold,h=i.bits,i.mode===X&&(i.back=-1);break}for(i.back=0;Be=i.lencode[c&(1<<i.lenbits)-1],me=Be>>>24,ke=Be>>>16&255,_e=65535&Be,!(me<=h);){if(0===f)break e;f--,c+=a[o++]<<h,h+=8}if(ke&&0===(240&ke)){for(ge=me,ve=ke,pe=_e;Be=i.lencode[pe+((c&(1<<ge+ve)-1)>>ge)],me=Be>>>24,ke=Be>>>16&255,_e=65535&Be,!(ge+me<=h);){if(0===f)break e;f--,c+=a[o++]<<h,h+=8}c>>>=ge,h-=ge,i.back+=ge}if(c>>>=me,h-=me,i.back+=me,i.length=_e,0===ke){i.mode=fe;break}if(32&ke){i.back=-1,i.mode=X;break}if(64&ke){e.msg="invalid literal/length code",i.mode=ce;break}i.extra=15&ke,i.mode=ae;case ae:if(i.extra){for(Ee=i.extra;h<Ee;){if(0===f)break e;f--,c+=a[o++]<<h,h+=8}i.length+=c&(1<<i.extra)-1,c>>>=i.extra,h-=i.extra,i.back+=i.extra}i.was=i.length,i.mode=re;case re:for(;Be=i.distcode[c&(1<<i.distbits)-1],me=Be>>>24,ke=Be>>>16&255,_e=65535&Be,!(me<=h);){if(0===f)break e;f--,c+=a[o++]<<h,h+=8}if(0===(240&ke)){for(ge=me,ve=ke,pe=_e;Be=i.distcode[pe+((c&(1<<ge+ve)-1)>>ge)],me=Be>>>24,ke=Be>>>16&255,_e=65535&Be,!(ge+me<=h);){if(0===f)break e;f--,c+=a[o++]<<h,h+=8}c>>>=ge,h-=ge,i.back+=ge}if(c>>>=me,h-=me,i.back+=me,64&ke){e.msg="invalid distance code",i.mode=ce;break}i.offset=_e,i.extra=15&ke,i.mode=oe;case oe:if(i.extra){for(Ee=i.extra;h<Ee;){if(0===f)break e;f--,c+=a[o++]<<h,h+=8}i.offset+=c&(1<<i.extra)-1,c>>>=i.extra,h-=i.extra,i.back+=i.extra}if(i.offset>i.dmax){e.msg="invalid distance too far back",i.mode=ce;break}i.mode=se;case se:if(0===l)break e;if(m=w-l,i.offset>m){if(m=i.offset-m,m>i.whave&&i.sane){e.msg="invalid distance too far back",i.mode=ce;break}m>i.wnext?(m-=i.wnext,k=i.wsize-m):k=i.wnext-m,m>i.length&&(m=i.length),we=i.window}else we=r,k=s-i.offset,m=i.length;m>l&&(m=l),l-=m,i.length-=m;do r[s++]=we[k++];while(--m);0===i.length&&(i.mode=ne);break;case fe:if(0===l)break e;r[s++]=i.length,l--,i.mode=ne;break;case le:if(i.wrap){for(;h<32;){if(0===f)break e;f--,c|=a[o++]<<h,h+=8}if(w-=l,e.total_out+=w,i.total+=w,w&&(e.adler=i.check=i.flags?v(i.check,r,w,s-w):g(i.check,r,w,s-w)),w=l,(i.flags?c:n(c))!==i.check){e.msg="incorrect data check",i.mode=ce;break}c=0,h=0}i.mode=de;case de:if(i.wrap&&i.flags){for(;h<32;){if(0===f)break e;f--,c+=a[o++]<<h,h+=8}if(c!==(4294967295&i.total)){e.msg="incorrect length check",i.mode=ce;break}c=0,h=0}i.mode=ue;case ue:ye=R;break e;case ce:ye=O;break e;case he:return I;case be:default:return C}return e.next_out=s,e.avail_out=l,e.next_in=o,e.avail_in=f,i.hold=c,i.bits=h,(i.wsize||w!==e.avail_out&&i.mode<ce&&(i.mode<le||t!==B))&&u(e,e.output,e.next_out,w-e.avail_out)?(i.mode=he,I):(b-=e.avail_in,w-=e.avail_out,e.total_in+=b,e.total_out+=w,i.total+=w,i.wrap&&w&&(e.adler=i.check=i.flags?v(i.check,r,w,e.next_out-w):g(i.check,r,w,e.next_out-w)),e.data_type=i.bits+(i.last?64:0)+(i.mode===X?128:0)+(i.mode===ie||i.mode===Q?256:0),(0===b&&0===w||t===B)&&ye===z&&(ye=T),ye)}function h(e){if(!e||!e.state)return C;var t=e.state;return t.window&&(t.window=null),e.state=null,z}function b(e,t){var i;return e&&e.state?(i=e.state,0===(2&i.wrap)?C:(i.head=t,t.done=!1,z)):C}function w(e,t){var i,n,a,r=t.length;return e&&e.state?(i=e.state,0!==i.wrap&&i.mode!==G?C:i.mode===G&&(n=1,n=g(n,t,r,0),n!==i.check)?O:(a=u(e,t,r,r))?(i.mode=he,I):(i.havedict=1,z)):C}var m,k,_=e("../utils/common"),g=e("./adler32"),v=e("./crc32"),p=e("./inffast"),x=e("./inftrees"),y=0,S=1,E=2,B=4,Z=5,A=6,z=0,R=1,N=2,C=-2,O=-3,I=-4,T=-5,U=8,D=1,F=2,L=3,H=4,M=5,j=6,K=7,P=8,Y=9,q=10,G=11,X=12,W=13,J=14,Q=15,V=16,$=17,ee=18,te=19,ie=20,ne=21,ae=22,re=23,oe=24,se=25,fe=26,le=27,de=28,ue=29,ce=30,he=31,be=32,we=852,me=592,ke=15,_e=ke,ge=!0;i.inflateReset=o,i.inflateReset2=s,i.inflateResetKeep=r,i.inflateInit=l,i.inflateInit2=f,i.inflate=c,i.inflateEnd=h,i.inflateGetHeader=b,i.inflateSetDictionary=w,i.inflateInfo="pako inflate (from Nodeca project)"},{"../utils/common":1,"./adler32":3,"./crc32":5,"./inffast":7,"./inftrees":9}],9:[function(e,t,i){"use strict";var n=e("../utils/common"),a=15,r=852,o=592,s=0,f=1,l=2,d=[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258,0,0],u=[16,16,16,16,16,16,16,16,17,17,17,17,18,18,18,18,19,19,19,19,20,20,20,20,21,21,21,21,16,72,78],c=[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577,0,0],h=[16,16,16,16,17,17,18,18,19,19,20,20,21,21,22,22,23,23,24,24,25,25,26,26,27,27,28,28,29,29,64,64];t.exports=function(e,t,i,b,w,m,k,_){var g,v,p,x,y,S,E,B,Z,A=_.bits,z=0,R=0,N=0,C=0,O=0,I=0,T=0,U=0,D=0,F=0,L=null,H=0,M=new n.Buf16(a+1),j=new n.Buf16(a+1),K=null,P=0;for(z=0;z<=a;z++)M[z]=0;for(R=0;R<b;R++)M[t[i+R]]++;for(O=A,C=a;C>=1&&0===M[C];C--);if(O>C&&(O=C),0===C)return w[m++]=20971520,w[m++]=20971520,_.bits=1,0;for(N=1;N<C&&0===M[N];N++);for(O<N&&(O=N),U=1,z=1;z<=a;z++)if(U<<=1,U-=M[z],U<0)return-1;if(U>0&&(e===s||1!==C))return-1;for(j[1]=0,z=1;z<a;z++)j[z+1]=j[z]+M[z];for(R=0;R<b;R++)0!==t[i+R]&&(k[j[t[i+R]]++]=R);if(e===s?(L=K=k,S=19):e===f?(L=d,H-=257,K=u,P-=257,S=256):(L=c,K=h,S=-1),F=0,R=0,z=N,y=m,I=O,T=0,p=-1,D=1<<O,x=D-1,e===f&&D>r||e===l&&D>o)return 1;for(var Y=0;;){Y++,E=z-T,k[R]<S?(B=0,Z=k[R]):k[R]>S?(B=K[P+k[R]],Z=L[H+k[R]]):(B=96,Z=0),g=1<<z-T,v=1<<I,N=v;do v-=g,w[y+(F>>T)+v]=E<<24|B<<16|Z|0;while(0!==v);for(g=1<<z-1;F&g;)g>>=1;if(0!==g?(F&=g-1,F+=g):F=0,R++,0===--M[z]){if(z===C)break;z=t[i+k[R]]}if(z>O&&(F&x)!==p){for(0===T&&(T=O),y+=N,I=z-T,U=1<<I;I+T<C&&(U-=M[I+T],!(U<=0));)I++,U<<=1;if(D+=1<<I,e===f&&D>r||e===l&&D>o)return 1;p=F&x,w[p]=O<<24|I<<16|y-m|0}}return 0!==F&&(w[y+F]=z-T<<24|64<<16|0),_.bits=O,0}},{"../utils/common":1}],10:[function(e,t,i){"use strict";t.exports={2:"need dictionary",1:"stream end",0:"","-1":"file error","-2":"stream error","-3":"data error","-4":"insufficient memory","-5":"buffer error","-6":"incompatible version"}},{}],11:[function(e,t,i){"use strict";function n(){this.input=null,this.next_in=0,this.avail_in=0,this.total_in=0,this.output=null,this.next_out=0,this.avail_out=0,this.total_out=0,this.msg="",this.state=null,this.data_type=2,this.adler=0}t.exports=n},{}],"/lib/inflate.js":[function(e,t,i){"use strict";function n(e){if(!(this instanceof n))return new n(e);this.options=s.assign({chunkSize:16384,windowBits:0,to:""},e||{});var t=this.options;t.raw&&t.windowBits>=0&&t.windowBits<16&&(t.windowBits=-t.windowBits,0===t.windowBits&&(t.windowBits=-15)),!(t.windowBits>=0&&t.windowBits<16)||e&&e.windowBits||(t.windowBits+=32),t.windowBits>15&&t.windowBits<48&&0===(15&t.windowBits)&&(t.windowBits|=15),this.err=0,this.msg="",this.ended=!1,this.chunks=[],this.strm=new u,this.strm.avail_out=0;var i=o.inflateInit2(this.strm,t.windowBits);if(i!==l.Z_OK)throw new Error(d[i]);this.header=new c,o.inflateGetHeader(this.strm,this.header)}function a(e,t){var i=new n(t);if(i.push(e,!0),i.err)throw i.msg;return i.result}function r(e,t){return t=t||{},t.raw=!0,a(e,t)}var o=e("./zlib/inflate"),s=e("./utils/common"),f=e("./utils/strings"),l=e("./zlib/constants"),d=e("./zlib/messages"),u=e("./zlib/zstream"),c=e("./zlib/gzheader"),h=Object.prototype.toString;n.prototype.push=function(e,t){var i,n,a,r,d,u,c=this.strm,b=this.options.chunkSize,w=this.options.dictionary,m=!1;if(this.ended)return!1;n=t===~~t?t:t===!0?l.Z_FINISH:l.Z_NO_FLUSH,"string"==typeof e?c.input=f.binstring2buf(e):"[object ArrayBuffer]"===h.call(e)?c.input=new Uint8Array(e):c.input=e,c.next_in=0,c.avail_in=c.input.length;do{if(0===c.avail_out&&(c.output=new s.Buf8(b),c.next_out=0,c.avail_out=b),i=o.inflate(c,l.Z_NO_FLUSH),i===l.Z_NEED_DICT&&w&&(u="string"==typeof w?f.string2buf(w):"[object ArrayBuffer]"===h.call(w)?new Uint8Array(w):w,i=o.inflateSetDictionary(this.strm,u)),i===l.Z_BUF_ERROR&&m===!0&&(i=l.Z_OK,m=!1),i!==l.Z_STREAM_END&&i!==l.Z_OK)return this.onEnd(i),this.ended=!0,!1;c.next_out&&(0!==c.avail_out&&i!==l.Z_STREAM_END&&(0!==c.avail_in||n!==l.Z_FINISH&&n!==l.Z_SYNC_FLUSH)||("string"===this.options.to?(a=f.utf8border(c.output,c.next_out),r=c.next_out-a,d=f.buf2string(c.output,a),c.next_out=r,c.avail_out=b-r,r&&s.arraySet(c.output,c.output,a,r,0),this.onData(d)):this.onData(s.shrinkBuf(c.output,c.next_out)))),0===c.avail_in&&0===c.avail_out&&(m=!0)}while((c.avail_in>0||0===c.avail_out)&&i!==l.Z_STREAM_END);return i===l.Z_STREAM_END&&(n=l.Z_FINISH),n===l.Z_FINISH?(i=o.inflateEnd(this.strm),this.onEnd(i),this.ended=!0,i===l.Z_OK):n!==l.Z_SYNC_FLUSH||(this.onEnd(l.Z_OK),c.avail_out=0,!0)},n.prototype.onData=function(e){this.chunks.push(e)},n.prototype.onEnd=function(e){e===l.Z_OK&&("string"===this.options.to?this.result=this.chunks.join(""):this.result=s.flattenChunks(this.chunks)),this.chunks=[],this.err=e,this.msg=this.strm.msg},i.Inflate=n,i.inflate=a,i.inflateRaw=r,i.ungzip=a},{"./utils/common":1,"./utils/strings":2,"./zlib/constants":4,"./zlib/gzheader":6,"./zlib/inflate":8,"./zlib/messages":10,"./zlib/zstream":11}]},{},[])("/lib/inflate.js")});

;(()=>{'use strict';
const {OUTLETS,CLUSTERS,normalized,canonicalOutlet,clusterOf,COACH_HANDOVER_PERIOD,coachForOutletAtPeriod,canonicalCoach,detectHeaders,excelDate,classifyStatus,normalizeCategory,complaintIdentity,normalizeComplaint,verifiedRecordScope,getScopeOutlets,summarize,pendingAge,crossMonthDuplicates}=(()=>{
// Pure complaint normalization, suitable for the browser worker and Node tests.
const OUTLETS=['Akuressa','Aluthgama','Ambalangoda','Embilipitiya','Galle','Karapitiya','Matara','Matara 2','Megalle','Monaragala','Tangalle','Unawatuna','Welipenna A','Welipenna B'];
const CLUSTERS={tharanga:['Akuressa','Embilipitiya','Matara','Matara 2','Monaragala','Tangalle'],morris:['Aluthgama','Ambalangoda','Galle','Karapitiya','Megalle','Unawatuna','Welipenna A','Welipenna B']};
const normalized=v=>String(v??'').toLowerCase().replace(/[^a-z0-9]+/g,'');
const outletMap=new Map(OUTLETS.map(x=>[normalized(x),x]));
for(const alias of ['matara02','matara2','mataraii'])outletMap.set(alias,'Matara 2');
outletMap.set('alutgama','Aluthgama');
const editDistance=(a,b,limit=2)=>{if(Math.abs(a.length-b.length)>limit)return limit+1;let prev=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){const next=[i];for(let j=1;j<=b.length;j++)next[j]=Math.min(next[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));prev=next;}return prev[b.length];};
function canonicalOutlet(value){
 const name=normalized(value);if(!name)return null;
 if(outletMap.has(name))return outletMap.get(name);
 if(['welipenna','welipena','welipenn'].includes(name))return null;
 const digit=name.match(/(?:0?2|ii)$/)?.[0]||'';
 const letter=name.match(/(?:welipenn[ab]|welipena[ab])$/)?.[0]?.slice(-1)||'';
 const candidates=[];
 for(const [alias,outlet] of outletMap){
  if(outlet==='Matara 2'&&!digit)continue;
  if(outlet==='Matara'&&digit)continue;
  if((outlet==='Welipenna A'||outlet==='Welipenna B')&&(!letter||outlet.slice(-1).toLowerCase()!==letter))continue;
  const distance=editDistance(name,alias,2),threshold=name.length>=10?2:1;
  if(distance<=threshold)candidates.push({outlet,distance});
 }
 candidates.sort((a,b)=>a.distance-b.distance);
 if(!candidates.length)return null;
 return new Set(candidates.filter(c=>c.distance===candidates[0].distance).map(c=>c.outlet)).size===1?candidates[0].outlet:null;
}
const clusterOf=outlet=>CLUSTERS.tharanga.includes(outlet)?'Tharanga':CLUSTERS.morris.includes(outlet)?'Morris':null;
// Historical handover. Morris led all 14 outlets until May 2026; the six
// Tharanga-group outlets transfer at the start of June 2026.
const COACH_HANDOVER_PERIOD='2026-06';
function coachForOutletAtPeriod(outlet,period){
 const group=clusterOf(outlet);
 if(!group||!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(period||'')))return null;
 return period<COACH_HANDOVER_PERIOD?'Morris':group;
}
// Exact, bounded name matching: never infer a coach from an unrelated or compound name.
function canonicalCoach(value){let n=normalized(value);n=n.replace(/^(mr|mister|areacoach|ac)/,'').replace(/(areacoach|ac)$/,'');return n==='tharanga'?'Tharanga':n==='morris'?'Morris':null;}
const HEADER_MATCH={
  outlet:['outlet','outletname','branch','branchname','storename','store','restaurant','restaurantname','location'],
  description:['complaintdescription','customercomplaint','complaintdetails','complaintdetail','issuedescription','feedbackdescription','issue','complainttext','feedbackdetails'],
  status:['salescentreclosurestatus','salescenterclosurestatus','complaintclosurestatus','closurestatus','complaintstatus','resolutionstatus','currentstatus','status'],
  closedFlag:['closecomplaintyesno','closecomplaint','complaintclosed','isclosed','closed'],
  closureDirective:['closuredirectiveby','closuredirective','directiveby','closureauthorizedby','closedirectedby'],
  customerName:['customername','nameofcustomer','customer','guestname'],
  customerContact:['customercontactnumber','customercontactno','customerphone','customerphonenumber','contactnumber','contactno','mobilenumber','mobilephone','phonenumber','guestcontactnumber','customertelephone'],
  lodgedBy:['complaintlodgedby','lodgedby','complainant','complaintreceivedby','reportedby'],
  action:['outletcomment','outletcomments','actiontaken','correctiveaction','correctiveactiontaken','actiontakenbyoutlet','outletresponse'],
  salesAction:['salescentrecomment','salescentercomment','callcentrecomment','customercontactaction','contactcentercomment'],
  orderDate:['orderdate','complaintdate','dateofcomplaint','date','reporteddate'],
  orderNumber:['ordernumber','orderno','ordernum','orderid','ordernumberid'],
  type:['complainttype','issuetype','complaintcategory','category','typeofcomplaint'],
  feedback:['customerfeedbackstatus','feedbackstatus','customerresponse','customersatisfaction'],
  notes:['remark','remarks','additionalremarks','additionalnotes','notes'],
  channel:['complaintchannel','sourceofcomplaint','sourcechannel'],
  service:['servicechannel','orderchannel','channel'],
  product:['productdetailsmentionproductnametopping','productdetails','itemdescription','productname','menuitem'],
  coach:['areacoach','areacoachname','areacoachincharge','clustercoach','clustername','coach']
};
function detectHeaders(row){
  const entries=Object.entries(row).map(([c,v])=>[c,normalized(v)]).filter(([,v])=>v);
  const map={};
  const patterns={
    outlet:v=>/^(outlet|branch|store|restaurant|location)(name|code|number|no)?$/.test(v)||/^(name|code|number|no)(of)?(outlet|branch|store)$/.test(v),
    description:v=>/^(complaint|issue|feedback)(description|details|detail|narrative|text|summary|explanation|nature)$/.test(v)||/^(description|details|detail|nature|summary)of(complaint|issue|feedback)$/.test(v),
    coach:v=>/^(area|regional|cluster)(coach|manager|leader)(name|incharge)?$/.test(v)||/^(coach|manager)of(area|cluster)$/.test(v),
    orderNumber:v=>/^(order|invoice|receipt|bill)(number|no|id|reference|ref)$/.test(v),
    orderDate:v=>/^(order|complaint|incident|reported|received)(date|on)$/.test(v),
    action:v=>/^(outlet|store|branch)(comment|comments|action|response|reply)$/.test(v)||/^(action|response|solution)(taken|provided)?(by)?(outlet|store|branch)$/.test(v),
    status:v=>/^(complaint|salescentre|salescenter|case)(close|closure|resolution)?status$/.test(v),
    closedFlag:v=>/^(close|closed|closure)(the)?complaint(yesno|yn|flag|status)?$/.test(v),
    closureDirective:v=>/^(closure|closing)(directive|authorized|approved)(by|from)?$/.test(v),
    customerContact:v=>/^(customer|guest|client)(contact|phone|telephone|mobile)(number|no)?$/.test(v),
    customerName:v=>/^(customer|guest|client)(name|fullname)$/.test(v),
    channel:v=>/^(complaint|feedback)(source|channel|medium)$/.test(v),
    service:v=>/^(service|order|delivery)(channel|mode|type)$/.test(v),
    type:v=>/^(complaint|issue|feedback)(type|category|classification)$/.test(v)
  };
  for(const [field,aliases] of Object.entries(HEADER_MATCH)){
    const hit=entries.find(([,v])=>aliases.includes(v)||(patterns[field]?.(v)??false));
    if(hit)map[field]=hit[0];
  }
  // PHSL templates sometimes contain edited O/R/U column headings. Recover
  // positions only when multiple independent anchors verify this layout.
  const anchors={B:'areacoach',C:'outlet',D:'orderdate',F:'customername',G:'customercontactnumber',H:'ordernumber',I:'servicechannel',J:'complaintchannel',K:'complainttype',P:'salescentrecomment',Q:'complaintlodgedby',T:'commentupdatedby',V:'closuredirectiveby',W:'salescentreclosurestatus',X:'customerfeedbackstatus',Y:'remark',Z:'updatedby'};
  const evidence=Object.entries(anchors).filter(([col,label])=>col!=='B'&&normalized(row[col])===label).length;
  if(map.outlet==='C'&&evidence>=6&&[row.D,row.H,row.K].filter(x=>x!=null).length>=2){
    for(const [field,col] of Object.entries({description:'O',action:'R',closedFlag:'U'}))if(!map[field])map[field]=col;
    map.outlet='C';
  }
  const hasNarrative=!!map.description;
  const hasIdentity=!!(map.orderDate||map.orderNumber||map.customerName||map.lodgedBy);
  return map.outlet?map:null;
}
const pad=n=>String(n).padStart(2,'0');
const validDate=(y,m,d)=>y>1900&&m>=1&&m<=12&&d>=1&&d<=31&&new Date(Date.UTC(y,m-1,d)).getUTCDate()===d;
function excelDate(value){if(value==null||String(value).trim()==='')return '';const s=String(value).trim();
 if(/^\d{4,5}(?:\.\d+)?$/.test(s)){const n=Number(s);if(n>20000&&n<100000)return new Date(Date.UTC(1899,11,30)+Math.floor(n)*86400000).toISOString().slice(0,10);}
 let m=s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);if(m){const y=+m[1],mo=+m[2],d=+m[3];return validDate(y,mo,d)?`${y}-${pad(mo)}-${pad(d)}`:s;}
 m=s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);if(m){const y=+m[3],mo=+m[2],d=+m[1];return validDate(y,mo,d)?`${y}-${pad(mo)}-${pad(d)}`:s;}return s;
}
const text=v=>String(v??'').trim();
const fnv=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return(h>>>0).toString(36);};
function classifyStatus(raw,closedFlag,directive=''){
 const yes=['yes','y','true','1','closed'].includes(normalized(closedFlag));
 if(canonicalCoach(directive)&&yes)return 'resolved';
 const s=normalized(raw);
 if(['resolved','closed','completed','complete','done','settled'].includes(s))return 'resolved';
 if(s)return 'pending';
 return 'pending'; // Yes alone is not an authorized closure when no explicit status exists.
}
const CATEGORIES=new Map([
 ['wrongitem','Wrong item'],['incorrectitem','Wrong item'],['missingitem','Missing item'],['missingitems','Missing item'],
 ['missingproduct','Missing item'],['latedelivery','Late delivery'],['deliverydelay','Late delivery'],
 ['coldfood','Food temperature'],['foodcold','Food temperature'],['temperature','Food temperature'],
 ['productquality','Product quality'],['quality','Product quality'],['badquality','Product quality'],
 ['staffbehavior','Staff behaviour'],['staffbehaviour','Staff behaviour'],['rudeservice','Staff behaviour'],
 ['foodpoisoning','Food safety'],['foodquality','Food quality'],
 ['servicerelated','Service related'],['servicerelatedcomplaint','Service related'],['incompleteorder','Incomplete order'],
 ['productrelated','Product related'],['deliveryrelated','Delivery related'],['orderissue','Order issue'],
 ['orderrelated','Order related'],['incorrectorder','Incorrect Order'],['orderdelays','Order Delays'],['safetyrelated','Safety Related'],['other','Other']
]);
function normalizeCategory(value){const source=text(value).replace(/\s+/g,' ');if(!source)return 'Uncategorized';return CATEGORIES.get(normalized(source))||source;}
// Stable cross-month fingerprint. Order number + outlet + date is primary; fallback uses customer/description.
function complaintIdentity(r){const key=[r.outlet,normalized(r.orderNumber),r.orderDate];
 if(r.orderNumber&&!/^(na|nil|none|notavailable|unknown|unavailable|unabletotrace|notprovided|noordernumber|0)$/.test(normalized(r.orderNumber)))return fnv([...key,normalized(r.description)].join('|'));
 return fnv([r.outlet,r.orderDate,normalized(r.customerContact)||normalized(r.customerName),normalized(r.description)].join('|'));
}
function normalizeComplaint(row,map,sourceRow='',period='',{allowMissingCoach=false}={}){
 const pick=key=>{const val=map[key]?text(row[map[key]]):'';return /^(#N\/A|#REF!|#VALUE!|#DIV\/0!|#NAME\?|#NUM!|#NULL!)$/i.test(val)?'':val;};
 const outlet=canonicalOutlet(pick('outlet'));
 if(!outlet)return {ignored:true,reason:pick('outlet')?'unknownOutlet':'blankOutlet',originalOutlet:pick('outlet'),sourceRow:Number(sourceRow)||0};
 const description=pick('description')||pick('type')||'';
 // Area Coach is informational only. Never reject by coach.\n const expectedCoach=coachForOutletAtPeriod(outlet,period),coachValue=pick('coach');
 const orderDate=excelDate(pick('orderDate')),orderNumber=pick('orderNumber'),customerName=pick('customerName');
 const closedFlag=pick('closedFlag'),closureDirective=pick('closureDirective'),statusRaw=pick('status');
 const r={period,outlet,cluster:expectedCoach,areaCoach:expectedCoach,sourceAreaCoach:coachValue,coachUnverified:false,
  orderDate,orderNumber,customerName,customerContact:pick('customerContact'),lodgedBy:pick('lodgedBy'),
  description,complaintType:pick('type'),category:normalizeCategory(pick('type')),status:classifyStatus(statusRaw,closedFlag,closureDirective),statusRaw,closedFlag,closureDirective,
  action:pick('action'),salesAction:pick('salesAction'),customerFeedback:pick('feedback'),notes:pick('notes'),
  complaintChannel:pick('channel'),serviceChannel:pick('service'),product:pick('product'),sourceRow:Number(sourceRow)||0};
 r.identity=complaintIdentity(r);r.id=fnv([period,r.identity,normalized(r.description),r.sourceRow].join('|'));return r;
}
// Only the approved outlet name is checked, including restored records.
function verifiedRecordScope(r){return !!r&&!!canonicalOutlet(r.outlet);}
function getScopeOutlets(mode,value){if(mode==='outlet')return value==='all'?OUTLETS:OUTLETS.includes(value)?[value]:[];
 return value==='tharanga'?CLUSTERS.tharanga:value==='morris'?CLUSTERS.morris:OUTLETS;}
function summarize(rows){const total=rows.length,resolved=rows.filter(r=>r.status==='resolved').length;return {total,resolved,pending:total-resolved,rate:total?Math.round(resolved/total*100):0};}
function pendingAge(orderDate,reference=new Date()){
 if(!/^\d{4}-\d\d-\d\d$/.test(orderDate||''))return null;
 const time=Date.parse(orderDate+'T00:00:00Z');if(!Number.isFinite(time))return null;
 const now=Date.UTC(reference.getFullYear(),reference.getMonth(),reference.getDate());return Math.max(0,Math.floor((now-time)/86400000));
}
function crossMonthDuplicates(candidate,snapshots){const seen=new Map();for(const s of snapshots)for(const r of s.records||[]){const key=r.identity||complaintIdentity(r);if(!seen.has(key))seen.set(key,new Set());seen.get(key).add(s.period);}
 return candidate.filter(r=>seen.has(r.identity||complaintIdentity(r))).map(r=>({id:r.id,outlet:r.outlet,orderNumber:r.orderNumber,months:[...seen.get(r.identity||complaintIdentity(r))].sort()}));
}

return {OUTLETS,CLUSTERS,normalized,canonicalOutlet,clusterOf,COACH_HANDOVER_PERIOD,coachForOutletAtPeriod,canonicalCoach,detectHeaders,excelDate,classifyStatus,normalizeCategory,complaintIdentity,normalizeComplaint,verifiedRecordScope,getScopeOutlets,summarize,pendingAge,crossMonthDuplicates};
})();

const {openZip}=(()=>{
// ZIP file reader using the native streaming decompressor (no CDN, no external JS).
// Supports ordinary XLSX ZIP files up to 4 GiB; encrypted/ZIP64 files are not supported.
const u16=(dv,p)=>dv.getUint16(p,true),u32=(dv,p)=>dv.getUint32(p,true);
const decoder=new TextDecoder();
async function openZip(blob){
  const tailLen=Math.min(blob.size,65557);
  const end=new DataView(await blob.slice(blob.size-tailLen).arrayBuffer());
  let eocd=-1;
  for(let i=end.byteLength-22;i>=0;i--){if(u32(end,i)===0x06054b50){eocd=i;break;}}
  if(eocd<0)throw Error('This is not a valid .xlsx file. Please select an Excel .xlsx workbook.');
  const count=u16(end,eocd+10),size=u32(end,eocd+12),offset=u32(end,eocd+16);
  if(count===65535 || size===0xffffffff || offset===0xffffffff)throw Error('ZIP64 Excel files are not supported. Save a standard .xlsx copy and retry.');
  if(offset+size>blob.size-tailLen+eocd)throw Error('The Excel ZIP directory has invalid bounds.');
  if(size>20*1024*1024)throw Error('This Excel workbook has unusually large ZIP metadata.');
  const cd=new DataView(await blob.slice(offset,offset+size).arrayBuffer());
  let pos=0;const entries=new Map();
  for(let i=0;i<count;i++){
    if(pos+46>cd.byteLength||u32(cd,pos)!==0x02014b50)throw Error('The Excel ZIP directory could not be read.');
    const method=u16(cd,pos+10),compressed=u32(cd,pos+20),uncompressed=u32(cd,pos+24);
    const flags=u16(cd,pos+8),nameLen=u16(cd,pos+28),extraLen=u16(cd,pos+30),commentLen=u16(cd,pos+32),localOffset=u32(cd,pos+42);
    if(pos+46+nameLen+extraLen+commentLen>cd.byteLength)throw Error('The Excel ZIP directory is incomplete.');
    const name=decoder.decode(new Uint8Array(cd.buffer,cd.byteOffset+pos+46,nameLen));
    if(!(flags&1))entries.set(name,{name,method,compressed,uncompressed,localOffset});
    pos+=46+nameLen+extraLen+commentLen;
  }
  async function entryStream(name){
    const entry=entries.get(name);if(!entry)throw Error(`Missing Excel component: ${name}`);
    if(entry.localOffset+30>blob.size||entry.uncompressed>1024*1024*1024)throw Error('A worksheet is too large or damaged. Save a smaller Excel copy.');
    const head=new DataView(await blob.slice(entry.localOffset,entry.localOffset+30).arrayBuffer());
    if(u32(head,0)!==0x04034b50)throw Error('The Excel file has a damaged ZIP entry.');
    const begin=entry.localOffset+30+u16(head,26)+u16(head,28);
    if(begin+entry.compressed>offset)throw Error('The compressed Excel entry is incomplete.');
    const source=blob.slice(begin,begin+entry.compressed).stream();
    if(entry.method===0)return source;
    if(entry.method!==8)throw Error('This workbook uses an unsupported ZIP compression method.');
    // Native DEFLATE-RAW is fastest. Some Safari/WebKit versions do not support
    // that exact format, so use the locally bundled MIT-licensed pako inflater.
    try{if(typeof DecompressionStream!=='undefined')return source.pipeThrough(new DecompressionStream('deflate-raw'));}catch{}
    if(!self.pako)throw Error("Workbook compression reader unavailable.");
    const inflate=new self.pako.Inflate({raw:true});
    // pako may finish on the last non-empty chunk. Calling push again on an
    // already-ended inflater returns false even for a valid workbook.
    const reader=source.getReader();let chunks=[],bytes=0,finished=false;
    inflate.onData=chunk=>{bytes+=chunk.byteLength;if(bytes>entry.uncompressed)throw Error('Excel entry expanded beyond its declared size.');chunks.push(chunk);};
    return new ReadableStream({
      async pull(controller){try{
        while(!chunks.length&&!finished){const {done,value}=await reader.read();
          if(done){if(!inflate.ended&&!inflate.push(new Uint8Array(0),true))throw Error(inflate.msg||'The Excel file is damaged.');if(!inflate.ended||inflate.err||bytes!==entry.uncompressed)throw Error('The Excel entry could not be fully decompressed.');finished=true;}
          else {if(inflate.ended||!inflate.push(value,false))throw Error(inflate.msg||'The Excel file is damaged.');}
        }
        if(chunks.length)controller.enqueue(chunks.shift());else if(finished)controller.close();
      }catch(e){reader.cancel().catch(()=>{});controller.error(e);}},
      cancel(){reader.cancel().catch(()=>{});}
    });
  }
  async function entryText(name,limit=20*1024*1024){
    const entry=entries.get(name);if(!entry)return '';
    if(entry.uncompressed>limit)throw Error(`The Excel component ${name} is too large to load safely.`);
    const reader=(await entryStream(name)).getReader();let bytes=0;const parts=[];
    for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>limit){await reader.cancel();throw Error('Excel metadata exceeded the safe size limit.');}parts.push(value);}
    const all=new Uint8Array(bytes);let p=0;for(const b of parts){all.set(b,p);p+=b.byteLength;}return decoder.decode(all);
  }
  return {entries,entryStream,entryText};
}

return {openZip};
})();



const xmlDecode=s=>String(s??'').replace(/&(?:#x([\da-f]+)|#(\d+)|amp|lt|gt|quot|apos);/gi,(full,hex,dec)=>{
  if(hex||dec){const n=parseInt(hex||dec,hex?16:10);return Number.isFinite(n)&&n<=0x10ffff?String.fromCodePoint(n):full;}
  return ({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'"})[full.toLowerCase()]??full;
});
const attr=(tag,key)=>{const r=new RegExp('(?:^|\\s)'+key+'="([^"]*)"');return tag.match(r)?.[1]||'';};
const sharedValues=xml=>{
  const out=[];const re=/<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g;let m;
  while((m=re.exec(xml))){let t='',inner=m[1];const ts=/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g;let part;while((part=ts.exec(inner)))t+=xmlDecode(part[1]);out.push(t);}
  return out;
};
const readCells=(fragment,shared)=>{
  const row={}; const re=/<c\b([^>]*?)(?:\/\s*>|>([\s\S]*?)<\/c>)/g;let m;
  while((m=re.exec(fragment))){
    const ref=attr(m[1],'r');const col=ref.match(/^[A-Z]+/)?.[0];if(!col)continue;
    const body=m[2]||'';if(!body)continue;
    const inline=attr(m[1],'t')==='inlineStr';
    let raw='';if(inline){for(const hit of body.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g))raw+=xmlDecode(hit[1]);}
    else{const v=body.match(/<v(?:\s[^>]*)?>([\s\S]*?)<\/v>/);if(!v)continue;raw=xmlDecode(v[1]);}
    row[col]=attr(m[1],'t')==='s'?(shared[Number(raw)]??''):raw;
  }
  return row;
};
async function parseXmlRows(stream, shared, visit, progress, totalBytes){
  const reader=stream.getReader(),decoder=new TextDecoder();let buffer='',readBytes=0,lastPercent=0,rowsScanned=0;
  while(true){const {value,done}=await reader.read();if(done)break;
    readBytes+=value.byteLength;buffer+=decoder.decode(value,{stream:true});
    // Avoid ever building the inflated worksheet in memory. Consume one row at a time.
    const rowRe=/<row\b[^>]*?\/\s*>|<row\b[^>]*?>[\s\S]*?<\/row>/g;
    let m,lastEnd=0;
    while((m=rowRe.exec(buffer))){lastEnd=rowRe.lastIndex;rowsScanned++;
      const xml=m[0];if(!/<(?:v|is)(?:\s|>)/.test(xml))continue;
      const rowNumber=xml.match(/<row\b[^>]*\br="(\d+)"/)?.[1]||String(rowsScanned);
      visit(readCells(xml,shared),rowNumber);
    }
    if(lastEnd)buffer=buffer.slice(lastEnd);
    else if(buffer.length>2_000_000){ // Retain at most an incomplete row, never the XML prefix.
      const start=buffer.lastIndexOf('<row ');buffer=start>=0?buffer.slice(start):buffer.slice(-100);
      if(buffer.length>2_000_000)throw Error('A worksheet row is too large to process safely.');
    }
    const percent=totalBytes?Math.min(96,Math.floor(readBytes/totalBytes*96)):0;
    if(percent>=lastPercent+3){lastPercent=percent;progress(percent,rowsScanned);}
  }
  if(buffer){const re=/<row\b[^>]*>[\s\S]*?<\/row>/g;for(const m of buffer.matchAll(re)){if(/<(?:v|is)(?:\s|>)/.test(m[0]))visit(readCells(m[0],shared),'');}}
  return rowsScanned;
}
function csvRows(text){
  const rows=[];let row=[],field='',quoted=false;
  text=text.replace(/^\ufeff/,'');
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(c==='"'){if(quoted && text[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}
    else if(c===','&&!quoted){row.push(field);field='';}
    else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(field);field='';rows.push(row);row=[];}
    else field+=c;
  }
  if(quoted)throw Error('The CSV contains an unfinished quoted field. Export it again and retry.');
  if(field!==''||row.length){row.push(field);rows.push(row);}return rows;
}
// Import is provisional until user confirms the review. Missing coach columns are
// allowed only under an explicitly acknowledged outlet-only import policy.
function collector(period){
  const seen=new Set(),records=[],reasonCounts={},unknown=new Map(),otherCoaches=new Map(),mismatches=[];
  let headerSheets=0,ignored=0,dateMismatch=0,duplicate=0,missingStatus=0,unverified=0;const sourceSheets=[];const identities=new Set();let possibleDuplicates=0;
  const warnings=[];
  return {
    sheet(mapping,sheetName){headerSheets++;sourceSheets.push(sheetName);},
    add(row,map,sourceRow){
      // Excel formulas fill blank template rows with #N/A; those are not complaints.
      const meaningful=key=>{const v=String(row[map[key]]??'').trim();return v&&!/^#(?:N\/A|REF!|VALUE!|DIV\/0!|NAME\?|NUM!|NULL!)$/i.test(v);};
      if(!['outlet','description','type','customerName','orderNumber'].some(meaningful))return;
      const res=normalizeComplaint(row,map,sourceRow,period);
      if(res.ignored){ignored++;reasonCounts[res.reason]=(reasonCounts[res.reason]||0)+1;
        if(res.reason==='unknownOutlet')unknown.set(res.originalOutlet,(unknown.get(res.originalOutlet)||0)+1);
        return;
      }
      // Exact repeated records are safe to collapse; changed closure/action rows are not silently dropped.
      const {id,sourceRow:source,identity,...fields}=res;const signature=JSON.stringify(fields);
      if(seen.has(signature)){duplicate++;return;}seen.add(signature);
      if(identities.has(res.identity))possibleDuplicates++;identities.add(res.identity);
      if(res.coachUnverified)unverified++;
      if(res.orderDate&&/^\d{4}-\d\d-\d\d$/.test(res.orderDate)&&res.orderDate.slice(0,7)!==period)dateMismatch++;
      if(!res.statusRaw&&!res.closedFlag)missingStatus++;
      records.push(res);
    },
    result(){return {period,records,stats:{found:records.length,ignored,reasonCounts,duplicate,dateMismatch,headerSheets,missingStatus,unverified,sourceSheets,possibleDuplicates,
      missingCoachColumn:false,unknownOutlets:Object.fromEntries(unknown),excludedCoaches:Object.fromEntries(otherCoaches),mismatches,warnings}};}
  };
}
// Locate the real complaint header, not the first occurrence of "Outlet".
const CORE_FIELDS=['description','type','orderDate','orderNumber','customerName','status','closedFlag','action','salesAction','customerContact','lodgedBy'];
function headerEvidence(map){
 if(!map?.outlet)return {strength:0,score:0,fieldCount:0};
 const fields=CORE_FIELDS.filter(k=>!!map[k]);
 const strong=fields.filter(k=>['description','type','orderDate','orderNumber','customerName','status'].includes(k));
 const score=fields.reduce((n,key)=>n+({description:5,type:3,orderNumber:3,orderDate:3,customerName:2,status:2,closedFlag:2,action:2,salesAction:2,customerContact:1,lodgedBy:1}[key]||1),0);
 return {strength:strong.length>=2?3:strong.length===1?2:fields.length?1:0,score,fieldCount:fields.length};
}
function newCandidate(map,sheetName,rowNumber,period){
 const c=collector(period);c.sheet(map,sheetName);
 return {map,c,sheetName,headerRow:Number(rowNumber)||0,rows:0,evidence:headerEvidence(map)};
}
function chooseCandidate(candidates){
 const evaluated=candidates.map(candidate=>({...candidate,result:candidate.c.result()}));
 const usable=evaluated.filter(c=>c.result.records.length>0&&c.evidence.strength>0);
 const qualified=usable.filter(c=>c.evidence.strength>=2);
 const pool=qualified.length?qualified:usable;
 if(!pool.length)return evaluated.sort((a,b)=>b.evidence.strength-a.evidence.strength||b.evidence.score-a.evidence.score)[0]||null;
 return pool.sort((a,b)=>b.evidence.strength-a.evidence.strength||b.result.records.length-a.result.records.length||b.evidence.score-a.evidence.score||a.headerRow-b.headerRow)[0];
}
function captureTableRow(candidates,row,rowNum,period,sheetTitle){
 if(!Object.values(row).some(v=>String(v).trim()))return;
 const map=detectHeaders(row);
 if(map){
  const evidence=headerEvidence(map);
  if(evidence.fieldCount>0){
   const signature=Object.entries(map).sort(([a],[b])=>a.localeCompare(b)).map(([field,col])=>field+':'+col).join('|');
   if(!candidates.some(c=>c.signature===signature)&&candidates.length<24){
    const candidate=newCandidate(map,sheetTitle,rowNum,period);candidate.signature=signature;candidates.push(candidate);
   }
   return;
  }
  return;
 }
 for(const candidate of candidates){
  if(Number(rowNum)>candidate.headerRow){candidate.c.add(row,candidate.map,rowNum);candidate.rows++;}
 }
}
async function readXlsx(file,period){
 postMessage({type:'progress',percent:1,label:'Finding complaint records…'});
 const zip=await openZip(file),shared=sharedValues(await zip.entryText('xl/sharedStrings.xml',120*1024*1024));
 const workbook=await zip.entryText('xl/workbook.xml'),rels=await zip.entryText('xl/_rels/workbook.xml.rels');
 const links=new Map();
 for(const m of rels.matchAll(/<Relationship\b[^>]*>/g)){
  const tag=m[0],target=xmlDecode(attr(tag,'Target'));
  if(attr(tag,'Type').endsWith('/worksheet')&&attr(tag,'TargetMode')!=='External'){
   const raw=target.startsWith('/')?target.slice(1):target.startsWith('xl/')?target:'xl/'+target;
   const parts=[];for(const part of raw.split('/')){if(part==='..')parts.pop();else if(part!=='.'&&part)parts.push(part);}
   links.set(attr(tag,'Id'),parts.join('/'));
  }
 }
 const sheets=[];
 for(const m of workbook.matchAll(/<sheet\b[^>]*>/g)){
  const tag=m[0],path=links.get(attr(tag,'r:id')),entry=zip.entries.get(path);
  if(entry)sheets.push({...entry,title:xmlDecode(attr(tag,'name')),hidden:!!attr(tag,'state')&&attr(tag,'state')!=='visible'});
 }
 if(!sheets.length)throw Error('No readable Excel worksheets were found.');
 const master=x=>/^master\s*sheet(?:\s*\(\d+\))?$/i.test(x.title.trim());
 const summary=x=>/^(data\s*sheet|summary|complaint\s*insights|closure\s*snapshot|pivot\s*table|dashboard)\s*$/i.test(x.title.trim());
 const ordered=[...sheets].sort((a,b)=>{const rank=x=>master(x)?0:!x.hidden&&!summary(x)?1:!x.hidden?2:3;return rank(a)-rank(b);});
 const errors=[];let chosen=null;
 for(let i=0;i<ordered.length;i++){
  const sheet=ordered[i],candidates=[];
  try{
   const stream=await zip.entryStream(sheet.name);
   await parseXmlRows(stream,shared,(row,rowNum)=>captureTableRow(candidates,row,rowNum,period,sheet.title),
    (pct,scanned)=>postMessage({type:'progress',percent:Math.min(96,Math.floor((i+pct/100)/ordered.length*96)),label:`Checking ${sheet.title} · ${scanned.toLocaleString()} rows scanned`}),sheet.uncompressed);
  }catch(e){errors.push(`${sheet.title}: ${String(e?.message||e)}`);continue;}
  const candidate=chooseCandidate(candidates);
  if(!candidate)continue;
  const result=candidate.result,accepted=result.records.length,quality=candidate.evidence.strength;
  if(accepted&&quality){
   if(!chosen||quality>chosen.quality||(quality===chosen.quality&&accepted>chosen.result.records.length))chosen={result,quality,sheetTitle:sheet.title};
  }else if(!chosen){chosen={result,quality,sheetTitle:sheet.title};}
  if(chosen.result.records.length>0&&chosen.quality>=2&&master(sheet)&&!ordered.slice(i+1).some(master))break;
 }
 if(!chosen)throw Error(errors.length?`No usable complaint sheet found. ${errors[0]}`:'No complaint worksheet could be identified. Check that the file contains an Outlet column and complaint records.');
 const result=chosen.result;result.stats.ignoredSheets=sheets.filter(s=>!result.stats.sourceSheets.includes(s.title)).map(s=>s.title);
 if(errors.length)result.stats.warnings.push(...errors);
 return result;
}
async function readCsv(file,period){
 if(file.size>160*1024*1024)throw Error('CSV exceeds the safe text processing size. Please use an Excel .xlsx workbook for very large reports.');
 const rows=csvRows(await file.text()),candidates=[];
 for(let i=0;i<rows.length;i++){
  const o={};rows[i].forEach((v,j)=>{let n=j+1,s='';while(n){n--;s=String.fromCharCode(65+n%26)+s;n=Math.floor(n/26);}o[s]=v;});
  captureTableRow(candidates,o,i+1,period,'CSV');
 }
 const chosen=chooseCandidate(candidates);
 if(!chosen)return collector(period).result();
 const result=chosen.result;result.stats.ignoredSheets=[];return result;
}
self.onmessage=async e=>{
  const {file,period}=e.data||{};
  try{
    if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(period))throw Error('Choose a valid year and month.');
    if(!(file instanceof Blob))throw Error('Please select a file to import.');
    const ext=String(file.name||'').toLowerCase().split('.').pop();
    if(!['xlsx','xlsm','csv'].includes(ext))throw Error('Choose a .xlsx, .xlsm or .csv complaint file.');
    const result=ext==='csv'?await readCsv(file,period):await readXlsx(file,period);
    if(!result.stats.headerSheets){throw Error('No complaint table was detected. Please check that the file contains an Outlet heading and complaint details.');}
    postMessage({type:'complete',result});
  }catch(err){postMessage({type:'error',message:err instanceof Error?err.message:'The file could not be read.'});}
};

})();
