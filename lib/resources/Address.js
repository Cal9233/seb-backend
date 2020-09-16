"use strict";
import method from "../Method";
export default require("../Resource").extend({
  path: "addresses/",
  operations: ["create", "list", "retrieve"],
  validate: method({
    method: "GET",
    path: "{id}/validate/",
    urlParams: ["id"],
  }),
});
