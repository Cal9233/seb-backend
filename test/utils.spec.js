"use strict";

import "./testUtils";

import {
  makeInterpolator,
  stringifyRequestData,
  protoExtend,
} from "../lib/utils";
import { expect } from "chai";

describe("utils", function () {
  describe("makeURLInterpolator", function () {
    it("Interpolates values into a prepared template", function () {
      let template = makeInterpolator("/some/url/{foo}/{baz}?ok=1");

      expect(template({ foo: 1, baz: 2 })).to.equal("/some/url/1/2?ok=1");

      expect(template({ foo: "", baz: "" })).to.equal("/some/url//?ok=1");
    });
  });

  describe("stringifyRequestData", function () {
    it("Creates a string from an object, handling shallow nested objects", function () {
      expect(
        stringifyRequestData({
          test: 1,
          foo: "baz",
          somethingElse: '::""%&',
          nested: {
            1: 2,
            "a n o t h e r": null,
          },
          arr: [1, 2, 3],
        })
      ).to.equal(
        [
          "test=1",
          "foo=baz",
          "somethingElse=%3A%3A%22%22%25%26",
          "nested%5B1%5D=2",
          "nested%5Ba%20n%20o%20t%20h%20e%20r%5D=",
          "arr%5B%5D=1",
          "arr%5B%5D=2",
          "arr%5B%5D=3",
        ].join("&")
      );
    });
    it("Ensures empty objects are represented", function () {
      expect(
        stringifyRequestData({
          test: {},
        })
      ).to.equal("test=");
    });
  });

  describe("protoExtend", function () {
    it("Provides an extension mechanism", function () {
      function A() {}
      A.extend = protoExtend;
      const B = A.extend({
        constructor: function () {
          this.called = true;
        },
      });
      expect(new B()).to.be.an.instanceof(A);
      expect(new B()).to.be.an.instanceof(B);
      expect(new B().called).to.equal(true);
      expect(B.extend === protoExtend).to.equal(true);
    });
  });
});
