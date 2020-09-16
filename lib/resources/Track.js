"use strict";
import method from "../Method";
export default require("../Resource").extend({
  path: "tracks/",
  operations: ["create"],
  get_status: method({
    method: "GET",
    path: "{carrier}/{trackingNumber}/",
    urlParams: ["carrier", "trackingNumber"],
  }),
});
