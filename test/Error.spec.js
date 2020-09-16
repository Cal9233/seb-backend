"use strict";

import "./testUtils";

import Error, {
  ShippoError,
  ShippoInvalidRequestError,
  ShippoAPIError,
} from "../lib/Error";
import { expect } from "chai";

describe("Error", function () {
  it("Populates with type and message params", function () {
    const e = new Error("FooError", "Foo happened");
    expect(e).to.have.property("type", "FooError");
    expect(e).to.have.property("message", "Foo happened");
  });

  describe("ShippoError", function () {
    it("Generates specific instance depending on error-type", function () {
      expect(
        ShippoError.generate({ type: "invalid_request_error" })
      ).to.be.instanceOf(ShippoInvalidRequestError);
      expect(ShippoError.generate({ type: "api_error" })).to.be.instanceOf(
        ShippoAPIError
      );
    });

    it("Populates named parameters", function () {
      const fields = {
        statusCode: 400,
        detail: { stuff: "is bad" },
        message: "bad stuff",
        path: "/badpath/",
      };
      const e = new ShippoAPIError(fields);
      for (let k in Object.keys(fields)) {
        expect(e[k]).to.eql(fields[k]);
      }
    });
  });
});
