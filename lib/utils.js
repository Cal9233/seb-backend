"use strict";

import querystring from "querystring";

const hasOwn = {}.hasOwnProperty;
const toString = {}.toString;

const utils = (module.exports = {
  isObject: function (o) {
    return toString.call(o) === "[object Object]";
  },

  isArrayObject: function (o) {
    return toString.call(o) === "[object Array]";
  },

  stringifyRequestData: function (data) {
    const output = [];

    for (let i in data) {
      if (hasOwn.call(data, i)) {
        if (isObject(data[i])) {
          let hasProps = false;
          for (let ii in data[i]) {
            if (hasOwn.call(data[i], ii)) {
              hasProps = true;
              output.push(
                encode(i + "[" + ii + "]") + "=" + encode(data[i][ii])
              );
            }
          }
          if (!hasProps) {
            output.push(encode(i) + "=" + encode(""));
          }
        } else if (Array.isArray(data[i])) {
          for (let a = 0, l = data[i].length; a < l; ++a) {
            output.push(encode(i + "[]") + "=" + encode(data[i][a]));
          }
        } else {
          output.push(encode(i) + "=" + encode(data[i]));
        }
      }
    }

    return output.join("&");

    function encode(v) {
      return v == null ? "" : encodeURIComponent(v);
    }
  },

  makeInterpolator: (function () {
    const rc = {
      "\n": "\\n",
      '"': '\\"',
      "\u2028": "\\u2028",
      "\u2029": "\\u2029",
    };
    return function makeInterpolator(str) {
      return new Function(
        "o",
        'return "' +
          str
            .replace(/["\n\r\u2028\u2029]/g, function ($0) {
              return rc[$0];
            })
            .replace(/\{([\s\S]+?)\}/g, '" + o["$1"] + "') +
          '";'
      );
    };
  })(),

  protoExtend: function (sub) {
    let Super = this;
    const Constructor = hasOwn.call(sub, "constructor")
      ? sub.constructor
      : function () {
          Super.apply(this, arguments);
        };
    Constructor.prototype = Object.create(Super.prototype);
    for (let i in sub) {
      if (hasOwn.call(sub, i)) {
        Constructor.prototype[i] = sub[i];
      }
    }
    for (i in Super) {
      if (hasOwn.call(Super, i)) {
        Constructor[i] = Super[i];
      }
    }
    return Constructor;
  },
});
