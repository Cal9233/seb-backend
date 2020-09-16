"use strict";

import http from "http";
import https from "https";
import { join } from "path";
import { stringify } from "querystring";
import { protoExtend, makeInterpolator } from "./utils";
import Error, {
  ShippoConnectionError,
  ShippoAPIError,
  ShippoAuthenticationError,
  ShippoNotFoundError,
} from "./Error";

// TODO include here?
Resource.extend = protoExtend;

// Expose method-creator & prepared (basic) methods
Resource.method = require("./Method");
Resource.BASIC_METHODS = require("./Method.basic");
/**
 * Encapsulates request logic for a Shippo Resource
 */
class Resource {
  constructor(shippo, urlData) {
    this._shippo = shippo;
    this._urlData = urlData || {};

    this.basePath = makeInterpolator(shippo.get("basePath"));
    this.path = makeInterpolator(this.path);

    if (this.operations) {
      this.operations.forEach(function (methodName) {
        // TODO
        this[methodName] = Resource.BASIC_METHODS[methodName];
      }, this);
    }
  }
}

Resource.prototype = {
  path: "",

  createFullPath: function (commandPath, urlData) {
    //console.log(this.basePath, urlData);
    return join(
      this.basePath(urlData),
      this.path(urlData),
      typeof commandPath == "function" ? commandPath(urlData) : commandPath
    ).replace(/\\/g, "/"); // ugly workaround for Windows
  },

  createUrlData: function () {
    const urlData = {};
    // Merge in baseData
    for (let i in this._urlData) {
      if (hasOwn.call(this._urlData, i)) {
        urlData[i] = this._urlData[i];
      }
    }
    return urlData;
  },

  wrapTimeout: function (promise, callback) {
    if (callback) {
      // Callback, if provided, is a simply translated to Promise'esque:
      // (Ensure callback is called outside of promise stack)
      promise.then(
        function (res) {
          setTimeout(function () {
            callback(null, res);
          }, 0);
        },
        function (err) {
          setTimeout(function () {
            callback(err, null);
          }, 0);
        }
      );
    }

    return promise;
  },

  _timeoutHandler: function (timeout, req, callback) {
    const self = this;
    return function () {
      let timeoutErr = new Error("ETIMEDOUT");
      timeoutErr.code = "ETIMEDOUT";

      req._isAborted = true;
      req.abort();

      callback.call(
        self,
        new ShippoConnectionError({
          message:
            "Request aborted due to timeout being reached (" + timeout + "ms)",
          detail: timeoutErr,
        }),
        null
      );
    };
  },

  _responseHandler: function (req, callback) {
    const self = this;
    return function (res) {
      // console.log('status %s', res.statusCode);
      let response = "";

      res.setEncoding("utf8");
      res.on("data", function (chunk) {
        response += chunk;
      });
      res.on("end", function () {
        let err;

        try {
          response = JSON.parse(response);
        } catch (e) {
          return callback.call(
            self,
            new ShippoAPIError({
              message: "Invalid JSON received from the Shippo API",
            }),
            null
          );
        }

        const errData = {
          detail: response,
          path: req.path,
          statusCode: res.statusCode,
        };

        if (res.statusCode === 401) {
          errData.message = "Invalid credentials";
          err = new ShippoAuthenticationError(errData);
        } else if (res.statusCode === 404) {
          errData.message = "Item not found";
          err = new ShippoNotFoundError(errData);
        } else if (res.statusCode === 301) {
          errData.message =
            "API sent us a 301 redirect, stopping call. Please contact our tech team and provide them with the operation that caused this error.";
          err = new ShippoAPIError(errData);
        } else if (res.statusCode === 400) {
          errData.message = "The data you sent was not accepted as valid";
          err = new ShippoAPIError(errData);
        }
        if (err) {
          return callback.call(self, err, null);
        } else {
          callback.call(self, null, response);
        }
      });
    };
  },

  _errorHandler: function (req, callback) {
    let self = this;
    return function (error) {
      if (req._isAborted) return; // already handled
      callback.call(
        self,
        new ShippoConnectionError({
          message: "An error occurred with our connection to Shippo",
          detail: error,
        }),
        null
      );
    };
  },
  _get_headers: function (requestData) {
    const apiVersion = this._shippo.get("version");
    const headers = {
      // Use specified auth token or use default from this shippo instance:
      Authorization:
        this._shippo.get("authScheme") + " " + this._shippo.get("token"),
      Accept: "application/json",
      "Content-Type": "application/json",
      "Content-Length": requestData.length,
      "User-Agent": "Shippo/v1 NodeBindings",
    };

    if (apiVersion) {
      headers["Shippo-API-Version"] = apiVersion;
    }
    return headers;
  },
  _request: function (method, path, data, auth, callback) {
    const requestData = new Buffer(JSON.stringify(data || {}));
    const self = this;
    const queryParams = stringify(data);

    if (queryParams) {
      path = [path, queryParams].join("?");
    }

    const headers = self._get_headers(requestData);
    makeRequest();

    function makeRequest() {
      const timeout = self._shippo.get("timeout");
      const request_obj = {
        host: self._shippo.get("host"),
        port: self._shippo.get("port"),
        path: path,
        method: method,
        headers: headers,
      };
      const req = (self._shippo.get("protocol") == "http"
        ? http
        : https
      ).request(request_obj);

      req.setTimeout(timeout, self._timeoutHandler(timeout, req, callback));
      req.on("response", self._responseHandler(req, callback));
      req.on("error", self._errorHandler(req, callback));

      req.write(requestData);
      req.end();
    }
  },
};

export default Resource;
