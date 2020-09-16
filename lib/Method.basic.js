"use strict";

import Method from "./Method";
import utils from "./utils";

export const create = Method({
  method: "POST",
});
export const list = Method({
  method: "GET",
  path: "",
});
export const retrieve = Method({
  method: "GET",
  path: "/{id}",
  urlParams: ["id"],
});
export const update = Method({
  method: "PUT",
  path: "{id}",
  urlParams: ["id"],
});
