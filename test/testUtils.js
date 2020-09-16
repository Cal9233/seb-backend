"use strict";

import "chai";

const utils = (module.exports = {
  getUserShippoKey: function () {
    return process.env.SHIPPO_TEST_API_KEY || "unittest";
  },

  getSpyableShippo: function (token) {
    // Provide a testable shippo instance
    // That is, with mock-requests built in and hookable

    const Shippo = require("../lib/shippo");
    const shippoInstance = Shippo(token || "fakeAuthToken");

    shippoInstance.REQUESTS = [];

    for (let i in shippoInstance) {
      if (shippoInstance[i] instanceof Shippo.Resource) {
        // Override each _request method so we can make the params
        // avaialable to consuming tests (revealing requests made on
        // REQUESTS and LAST_REQUEST):
        shippoInstance[i]._request = function (method, url, data, auth, cb) {
          const req = (shippoInstance.LAST_REQUEST = {
            method: method,
            url: url,
            data: data,
          });
          if (auth) req.auth = auth;
          shippoInstance.REQUESTS.push(req);
          cb.call(this, null, {});
        };
      }
    }

    return shippoInstance;
  },

  /**
   * A utility where cleanup functions can be registered to be called post-spec.
   * CleanupUtility will automatically register on the mocha afterEach hook,
   * ensuring its called after each descendent-describe block.
   */
  CleanupUtility: (function () {
    CleanupUtility.DEFAULT_TIMEOUT = 20000;

    function CleanupUtility(timeout) {
      let self = this;
      this._cleanupFns = [];
      this._shippo = require("../lib/shippo")(
        utils.getUserShippoKey(),
        "latest"
      );
      afterEach(function (done) {
        this.timeout(timeout || CleanupUtility.DEFAULT_TIMEOUT);
        return self.doCleanup(done);
      });
    }

    CleanupUtility.prototype = {
      doCleanup: function (done) {
        const cleanups = this._cleanupFns;
        const total = cleanups.length;
        const completed = 0;
        for (let fn; (fn = cleanups.shift()); ) {
          const promise = fn.call(this);
          if (!promise || !promise.then) {
            throw new Error(
              "CleanupUtility expects cleanup functions to return promises!"
            );
          }
          promise.then(
            function () {
              // cleanup successful
              ++completed;
              if (completed === total) {
                done();
              }
            },
            function (err) {
              // not successful
              throw err;
            }
          );
        }
        if (total === 0) done();
      },
      add: function (fn) {
        this._cleanupFns.push(fn);
      },
      deleteAddress: function (addId) {
        this.add(function () {
          return this._shippo.address.del(addId);
        });
      },
    };

    return CleanupUtility;
  })(),
});
