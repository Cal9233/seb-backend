"use strict";
import method from "../Method";
export default require("../Resource").extend({
  path: "orders/",
  operations: ["create", "list", "retrieve"],
});
