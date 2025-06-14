var OpenverseApiClient = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // node_modules/cross-fetch/dist/browser-ponyfill.js
  var require_browser_ponyfill = __commonJS({
    "node_modules/cross-fetch/dist/browser-ponyfill.js"(exports, module) {
      var __global__ = typeof globalThis !== "undefined" && globalThis || typeof self !== "undefined" && self || typeof global !== "undefined" && global;
      var __globalThis__ = function() {
        function F() {
          this.fetch = false;
          this.DOMException = __global__.DOMException;
        }
        F.prototype = __global__;
        return new F();
      }();
      (function(globalThis2) {
        var irrelevant = function(exports2) {
          var g = typeof globalThis2 !== "undefined" && globalThis2 || typeof self !== "undefined" && self || // eslint-disable-next-line no-undef
          typeof global !== "undefined" && global || {};
          var support = {
            searchParams: "URLSearchParams" in g,
            iterable: "Symbol" in g && "iterator" in Symbol,
            blob: "FileReader" in g && "Blob" in g && function() {
              try {
                new Blob();
                return true;
              } catch (e) {
                return false;
              }
            }(),
            formData: "FormData" in g,
            arrayBuffer: "ArrayBuffer" in g
          };
          function isDataView(obj) {
            return obj && DataView.prototype.isPrototypeOf(obj);
          }
          if (support.arrayBuffer) {
            var viewClasses = [
              "[object Int8Array]",
              "[object Uint8Array]",
              "[object Uint8ClampedArray]",
              "[object Int16Array]",
              "[object Uint16Array]",
              "[object Int32Array]",
              "[object Uint32Array]",
              "[object Float32Array]",
              "[object Float64Array]"
            ];
            var isArrayBufferView = ArrayBuffer.isView || function(obj) {
              return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1;
            };
          }
          function normalizeName(name) {
            if (typeof name !== "string") {
              name = String(name);
            }
            if (/[^a-z0-9\-#$%&'*+.^_`|~!]/i.test(name) || name === "") {
              throw new TypeError('Invalid character in header field name: "' + name + '"');
            }
            return name.toLowerCase();
          }
          function normalizeValue(value) {
            if (typeof value !== "string") {
              value = String(value);
            }
            return value;
          }
          function iteratorFor(items) {
            var iterator = {
              next: function() {
                var value = items.shift();
                return { done: value === void 0, value };
              }
            };
            if (support.iterable) {
              iterator[Symbol.iterator] = function() {
                return iterator;
              };
            }
            return iterator;
          }
          function Headers2(headers) {
            this.map = {};
            if (headers instanceof Headers2) {
              headers.forEach(function(value, name) {
                this.append(name, value);
              }, this);
            } else if (Array.isArray(headers)) {
              headers.forEach(function(header) {
                if (header.length != 2) {
                  throw new TypeError("Headers constructor: expected name/value pair to be length 2, found" + header.length);
                }
                this.append(header[0], header[1]);
              }, this);
            } else if (headers) {
              Object.getOwnPropertyNames(headers).forEach(function(name) {
                this.append(name, headers[name]);
              }, this);
            }
          }
          Headers2.prototype.append = function(name, value) {
            name = normalizeName(name);
            value = normalizeValue(value);
            var oldValue = this.map[name];
            this.map[name] = oldValue ? oldValue + ", " + value : value;
          };
          Headers2.prototype["delete"] = function(name) {
            delete this.map[normalizeName(name)];
          };
          Headers2.prototype.get = function(name) {
            name = normalizeName(name);
            return this.has(name) ? this.map[name] : null;
          };
          Headers2.prototype.has = function(name) {
            return this.map.hasOwnProperty(normalizeName(name));
          };
          Headers2.prototype.set = function(name, value) {
            this.map[normalizeName(name)] = normalizeValue(value);
          };
          Headers2.prototype.forEach = function(callback, thisArg) {
            for (var name in this.map) {
              if (this.map.hasOwnProperty(name)) {
                callback.call(thisArg, this.map[name], name, this);
              }
            }
          };
          Headers2.prototype.keys = function() {
            var items = [];
            this.forEach(function(value, name) {
              items.push(name);
            });
            return iteratorFor(items);
          };
          Headers2.prototype.values = function() {
            var items = [];
            this.forEach(function(value) {
              items.push(value);
            });
            return iteratorFor(items);
          };
          Headers2.prototype.entries = function() {
            var items = [];
            this.forEach(function(value, name) {
              items.push([name, value]);
            });
            return iteratorFor(items);
          };
          if (support.iterable) {
            Headers2.prototype[Symbol.iterator] = Headers2.prototype.entries;
          }
          function consumed(body) {
            if (body._noBody) return;
            if (body.bodyUsed) {
              return Promise.reject(new TypeError("Already read"));
            }
            body.bodyUsed = true;
          }
          function fileReaderReady(reader) {
            return new Promise(function(resolve, reject) {
              reader.onload = function() {
                resolve(reader.result);
              };
              reader.onerror = function() {
                reject(reader.error);
              };
            });
          }
          function readBlobAsArrayBuffer(blob) {
            var reader = new FileReader();
            var promise = fileReaderReady(reader);
            reader.readAsArrayBuffer(blob);
            return promise;
          }
          function readBlobAsText(blob) {
            var reader = new FileReader();
            var promise = fileReaderReady(reader);
            var match = /charset=([A-Za-z0-9_-]+)/.exec(blob.type);
            var encoding = match ? match[1] : "utf-8";
            reader.readAsText(blob, encoding);
            return promise;
          }
          function readArrayBufferAsText(buf) {
            var view = new Uint8Array(buf);
            var chars = new Array(view.length);
            for (var i = 0; i < view.length; i++) {
              chars[i] = String.fromCharCode(view[i]);
            }
            return chars.join("");
          }
          function bufferClone(buf) {
            if (buf.slice) {
              return buf.slice(0);
            } else {
              var view = new Uint8Array(buf.byteLength);
              view.set(new Uint8Array(buf));
              return view.buffer;
            }
          }
          function Body() {
            this.bodyUsed = false;
            this._initBody = function(body) {
              this.bodyUsed = this.bodyUsed;
              this._bodyInit = body;
              if (!body) {
                this._noBody = true;
                this._bodyText = "";
              } else if (typeof body === "string") {
                this._bodyText = body;
              } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
                this._bodyBlob = body;
              } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
                this._bodyFormData = body;
              } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
                this._bodyText = body.toString();
              } else if (support.arrayBuffer && support.blob && isDataView(body)) {
                this._bodyArrayBuffer = bufferClone(body.buffer);
                this._bodyInit = new Blob([this._bodyArrayBuffer]);
              } else if (support.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))) {
                this._bodyArrayBuffer = bufferClone(body);
              } else {
                this._bodyText = body = Object.prototype.toString.call(body);
              }
              if (!this.headers.get("content-type")) {
                if (typeof body === "string") {
                  this.headers.set("content-type", "text/plain;charset=UTF-8");
                } else if (this._bodyBlob && this._bodyBlob.type) {
                  this.headers.set("content-type", this._bodyBlob.type);
                } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
                  this.headers.set("content-type", "application/x-www-form-urlencoded;charset=UTF-8");
                }
              }
            };
            if (support.blob) {
              this.blob = function() {
                var rejected = consumed(this);
                if (rejected) {
                  return rejected;
                }
                if (this._bodyBlob) {
                  return Promise.resolve(this._bodyBlob);
                } else if (this._bodyArrayBuffer) {
                  return Promise.resolve(new Blob([this._bodyArrayBuffer]));
                } else if (this._bodyFormData) {
                  throw new Error("could not read FormData body as blob");
                } else {
                  return Promise.resolve(new Blob([this._bodyText]));
                }
              };
            }
            this.arrayBuffer = function() {
              if (this._bodyArrayBuffer) {
                var isConsumed = consumed(this);
                if (isConsumed) {
                  return isConsumed;
                } else if (ArrayBuffer.isView(this._bodyArrayBuffer)) {
                  return Promise.resolve(
                    this._bodyArrayBuffer.buffer.slice(
                      this._bodyArrayBuffer.byteOffset,
                      this._bodyArrayBuffer.byteOffset + this._bodyArrayBuffer.byteLength
                    )
                  );
                } else {
                  return Promise.resolve(this._bodyArrayBuffer);
                }
              } else if (support.blob) {
                return this.blob().then(readBlobAsArrayBuffer);
              } else {
                throw new Error("could not read as ArrayBuffer");
              }
            };
            this.text = function() {
              var rejected = consumed(this);
              if (rejected) {
                return rejected;
              }
              if (this._bodyBlob) {
                return readBlobAsText(this._bodyBlob);
              } else if (this._bodyArrayBuffer) {
                return Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer));
              } else if (this._bodyFormData) {
                throw new Error("could not read FormData body as text");
              } else {
                return Promise.resolve(this._bodyText);
              }
            };
            if (support.formData) {
              this.formData = function() {
                return this.text().then(decode);
              };
            }
            this.json = function() {
              return this.text().then(JSON.parse);
            };
            return this;
          }
          var methods = ["CONNECT", "DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT", "TRACE"];
          function normalizeMethod(method) {
            var upcased = method.toUpperCase();
            return methods.indexOf(upcased) > -1 ? upcased : method;
          }
          function Request(input, options) {
            if (!(this instanceof Request)) {
              throw new TypeError('Please use the "new" operator, this DOM object constructor cannot be called as a function.');
            }
            options = options || {};
            var body = options.body;
            if (input instanceof Request) {
              if (input.bodyUsed) {
                throw new TypeError("Already read");
              }
              this.url = input.url;
              this.credentials = input.credentials;
              if (!options.headers) {
                this.headers = new Headers2(input.headers);
              }
              this.method = input.method;
              this.mode = input.mode;
              this.signal = input.signal;
              if (!body && input._bodyInit != null) {
                body = input._bodyInit;
                input.bodyUsed = true;
              }
            } else {
              this.url = String(input);
            }
            this.credentials = options.credentials || this.credentials || "same-origin";
            if (options.headers || !this.headers) {
              this.headers = new Headers2(options.headers);
            }
            this.method = normalizeMethod(options.method || this.method || "GET");
            this.mode = options.mode || this.mode || null;
            this.signal = options.signal || this.signal || function() {
              if ("AbortController" in g) {
                var ctrl = new AbortController();
                return ctrl.signal;
              }
            }();
            this.referrer = null;
            if ((this.method === "GET" || this.method === "HEAD") && body) {
              throw new TypeError("Body not allowed for GET or HEAD requests");
            }
            this._initBody(body);
            if (this.method === "GET" || this.method === "HEAD") {
              if (options.cache === "no-store" || options.cache === "no-cache") {
                var reParamSearch = /([?&])_=[^&]*/;
                if (reParamSearch.test(this.url)) {
                  this.url = this.url.replace(reParamSearch, "$1_=" + (/* @__PURE__ */ new Date()).getTime());
                } else {
                  var reQueryString = /\?/;
                  this.url += (reQueryString.test(this.url) ? "&" : "?") + "_=" + (/* @__PURE__ */ new Date()).getTime();
                }
              }
            }
          }
          Request.prototype.clone = function() {
            return new Request(this, { body: this._bodyInit });
          };
          function decode(body) {
            var form = new FormData();
            body.trim().split("&").forEach(function(bytes) {
              if (bytes) {
                var split = bytes.split("=");
                var name = split.shift().replace(/\+/g, " ");
                var value = split.join("=").replace(/\+/g, " ");
                form.append(decodeURIComponent(name), decodeURIComponent(value));
              }
            });
            return form;
          }
          function parseHeaders(rawHeaders) {
            var headers = new Headers2();
            var preProcessedHeaders = rawHeaders.replace(/\r?\n[\t ]+/g, " ");
            preProcessedHeaders.split("\r").map(function(header) {
              return header.indexOf("\n") === 0 ? header.substr(1, header.length) : header;
            }).forEach(function(line) {
              var parts = line.split(":");
              var key = parts.shift().trim();
              if (key) {
                var value = parts.join(":").trim();
                try {
                  headers.append(key, value);
                } catch (error) {
                  console.warn("Response " + error.message);
                }
              }
            });
            return headers;
          }
          Body.call(Request.prototype);
          function Response(bodyInit, options) {
            if (!(this instanceof Response)) {
              throw new TypeError('Please use the "new" operator, this DOM object constructor cannot be called as a function.');
            }
            if (!options) {
              options = {};
            }
            this.type = "default";
            this.status = options.status === void 0 ? 200 : options.status;
            if (this.status < 200 || this.status > 599) {
              throw new RangeError("Failed to construct 'Response': The status provided (0) is outside the range [200, 599].");
            }
            this.ok = this.status >= 200 && this.status < 300;
            this.statusText = options.statusText === void 0 ? "" : "" + options.statusText;
            this.headers = new Headers2(options.headers);
            this.url = options.url || "";
            this._initBody(bodyInit);
          }
          Body.call(Response.prototype);
          Response.prototype.clone = function() {
            return new Response(this._bodyInit, {
              status: this.status,
              statusText: this.statusText,
              headers: new Headers2(this.headers),
              url: this.url
            });
          };
          Response.error = function() {
            var response = new Response(null, { status: 200, statusText: "" });
            response.ok = false;
            response.status = 0;
            response.type = "error";
            return response;
          };
          var redirectStatuses = [301, 302, 303, 307, 308];
          Response.redirect = function(url, status) {
            if (redirectStatuses.indexOf(status) === -1) {
              throw new RangeError("Invalid status code");
            }
            return new Response(null, { status, headers: { location: url } });
          };
          exports2.DOMException = g.DOMException;
          try {
            new exports2.DOMException();
          } catch (err) {
            exports2.DOMException = function(message, name) {
              this.message = message;
              this.name = name;
              var error = Error(message);
              this.stack = error.stack;
            };
            exports2.DOMException.prototype = Object.create(Error.prototype);
            exports2.DOMException.prototype.constructor = exports2.DOMException;
          }
          function fetch2(input, init) {
            return new Promise(function(resolve, reject) {
              var request = new Request(input, init);
              if (request.signal && request.signal.aborted) {
                return reject(new exports2.DOMException("Aborted", "AbortError"));
              }
              var xhr = new XMLHttpRequest();
              function abortXhr() {
                xhr.abort();
              }
              xhr.onload = function() {
                var options = {
                  statusText: xhr.statusText,
                  headers: parseHeaders(xhr.getAllResponseHeaders() || "")
                };
                if (request.url.indexOf("file://") === 0 && (xhr.status < 200 || xhr.status > 599)) {
                  options.status = 200;
                } else {
                  options.status = xhr.status;
                }
                options.url = "responseURL" in xhr ? xhr.responseURL : options.headers.get("X-Request-URL");
                var body = "response" in xhr ? xhr.response : xhr.responseText;
                setTimeout(function() {
                  resolve(new Response(body, options));
                }, 0);
              };
              xhr.onerror = function() {
                setTimeout(function() {
                  reject(new TypeError("Network request failed"));
                }, 0);
              };
              xhr.ontimeout = function() {
                setTimeout(function() {
                  reject(new TypeError("Network request timed out"));
                }, 0);
              };
              xhr.onabort = function() {
                setTimeout(function() {
                  reject(new exports2.DOMException("Aborted", "AbortError"));
                }, 0);
              };
              function fixUrl(url) {
                try {
                  return url === "" && g.location.href ? g.location.href : url;
                } catch (e) {
                  return url;
                }
              }
              xhr.open(request.method, fixUrl(request.url), true);
              if (request.credentials === "include") {
                xhr.withCredentials = true;
              } else if (request.credentials === "omit") {
                xhr.withCredentials = false;
              }
              if ("responseType" in xhr) {
                if (support.blob) {
                  xhr.responseType = "blob";
                } else if (support.arrayBuffer) {
                  xhr.responseType = "arraybuffer";
                }
              }
              if (init && typeof init.headers === "object" && !(init.headers instanceof Headers2 || g.Headers && init.headers instanceof g.Headers)) {
                var names = [];
                Object.getOwnPropertyNames(init.headers).forEach(function(name) {
                  names.push(normalizeName(name));
                  xhr.setRequestHeader(name, normalizeValue(init.headers[name]));
                });
                request.headers.forEach(function(value, name) {
                  if (names.indexOf(name) === -1) {
                    xhr.setRequestHeader(name, value);
                  }
                });
              } else {
                request.headers.forEach(function(value, name) {
                  xhr.setRequestHeader(name, value);
                });
              }
              if (request.signal) {
                request.signal.addEventListener("abort", abortXhr);
                xhr.onreadystatechange = function() {
                  if (xhr.readyState === 4) {
                    request.signal.removeEventListener("abort", abortXhr);
                  }
                };
              }
              xhr.send(typeof request._bodyInit === "undefined" ? null : request._bodyInit);
            });
          }
          fetch2.polyfill = true;
          if (!g.fetch) {
            g.fetch = fetch2;
            g.Headers = Headers2;
            g.Request = Request;
            g.Response = Response;
          }
          exports2.Headers = Headers2;
          exports2.Request = Request;
          exports2.Response = Response;
          exports2.fetch = fetch2;
          return exports2;
        }({});
      })(__globalThis__);
      __globalThis__.fetch.ponyfill = true;
      delete __globalThis__.fetch.polyfill;
      var ctx = __global__.fetch ? __global__ : __globalThis__;
      exports = ctx.fetch;
      exports.default = ctx.fetch;
      exports.fetch = ctx.fetch;
      exports.Headers = ctx.Headers;
      exports.Request = ctx.Request;
      exports.Response = ctx.Response;
      module.exports = exports;
    }
  });

  // node_modules/@openverse/api-client/src/index.ts
  var index_exports = {};
  __export(index_exports, {
    OpenverseClient: () => OpenverseClient
  });

  // node_modules/@openverse/api-client/src/types.ts
  var RestAPIMeta = Object.freeze({
    "POST v1/auth_tokens/register/": {
      contentType: "application/json",
      pathParams: [],
      jsonResponse: true
    },
    "POST v1/auth_tokens/token/": {
      contentType: "application/x-www-form-urlencoded",
      pathParams: [],
      jsonResponse: true
    },
    "GET v1/rate_limit/": {
      contentType: "application/json",
      pathParams: [],
      jsonResponse: true
    },
    "GET v1/images/stats/": {
      contentType: "application/json",
      pathParams: [],
      jsonResponse: true
    },
    "GET v1/audio/stats/": {
      contentType: "application/json",
      pathParams: [],
      jsonResponse: true
    },
    "GET v1/images/": {
      contentType: "application/json",
      pathParams: [],
      jsonResponse: true
    },
    "GET v1/audio/": {
      contentType: "application/json",
      pathParams: [],
      jsonResponse: true
    },
    "GET v1/images/:identifier/": {
      contentType: "application/json",
      pathParams: ["identifier"],
      jsonResponse: true
    },
    "GET v1/audio/:identifier/": {
      contentType: "application/json",
      pathParams: ["identifier"],
      jsonResponse: true
    },
    "GET v1/images/:identifier/related/": {
      contentType: "application/json",
      pathParams: ["identifier"],
      jsonResponse: true
    },
    "GET v1/audio/:identifier/related/": {
      contentType: "application/json",
      pathParams: ["identifier"],
      jsonResponse: true
    },
    "GET v1/images/:identifier/thumb/": {
      contentType: "application/json",
      pathParams: ["identifier"],
      jsonResponse: false
    },
    "GET v1/audio/:identifier/thumb/": {
      contentType: "application/json",
      pathParams: ["identifier"],
      jsonResponse: false
    },
    "GET v1/audio/:identifier/waveform/": {
      contentType: "application/json",
      pathParams: ["identifier"],
      jsonResponse: true
    },
    "GET v1/images/oembed": {
      contentType: "application/json",
      pathParams: [],
      jsonResponse: true
    }
  });

  // node_modules/@openverse/api-client/src/client.ts
  var currTimestamp = () => Math.floor(Date.now() / 1e3);
  var expiryThreshold = 5;
  async function getFetch() {
    if (globalThis.fetch) {
      return {
        fetch,
        Headers
      };
    } else {
      return Promise.resolve().then(() => __toESM(require_browser_ponyfill(), 1)).then((d) => ({
        fetch: d.default,
        Headers: d.Headers
      }));
    }
  }
  var OpenverseClient = ({
    baseUrl = "https://api.openverse.engineering/",
    credentials
  } = {}) => {
    let apiToken = null;
    const apiTokenMutex = {
      requesting: false
    };
    let tokenExpiry = null;
    const normalisedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
    const baseRequest = async (endpoint, { headers, ...req }) => {
      let [method, url] = endpoint.split(" ");
      const endpointMeta = RestAPIMeta[endpoint];
      const params = "params" in req ? { ...req.params } : {};
      endpointMeta.pathParams.forEach((param) => {
        url = url.replace(`:${param}`, params[param]);
        delete params[param];
      });
      const { fetch: fetch2, Headers: Headers2 } = await getFetch();
      const finalHeaders = new Headers2(headers);
      if (!finalHeaders.has("content-type")) {
        finalHeaders.set("content-type", endpointMeta.contentType);
      }
      const requestConfig = {
        method,
        headers: finalHeaders
      };
      if (method === "POST") {
        if (finalHeaders.get("content-type") == "application/json") {
          requestConfig["body"] = JSON.stringify(params);
        } else {
          const form = new FormData();
          Object.keys(params).forEach((key) => {
            form.set(key, params[key]);
          });
          requestConfig["body"] = form;
        }
      } else {
        const search = new URLSearchParams(params);
        if (search.size != 0) {
          url = `${url}?${search}`;
        }
      }
      const fullUrl = `${normalisedBaseUrl}${url}`;
      const response = await fetch2(fullUrl, requestConfig);
      const body = endpointMeta.jsonResponse ? await response.json() : response.body;
      return {
        body,
        meta: {
          headers: response.headers,
          status: response.status,
          url: fullUrl,
          request: requestConfig
        }
      };
    };
    const cannotProceedWithoutToken = () => credentials && (!(apiToken && tokenExpiry) || tokenExpiry <= currTimestamp());
    const shouldTriggerTokenRefresh = () => credentials && !apiTokenMutex.requesting && (!(apiToken && tokenExpiry) || tokenExpiry - expiryThreshold < currTimestamp());
    const refreshApiToken = async () => {
      apiTokenMutex.requesting = true;
      try {
        const tokenResponse = await baseRequest(
          "POST v1/auth_tokens/token/",
          {
            params: {
              grant_type: "client_credentials",
              client_id: credentials.clientId,
              client_secret: credentials.clientSecret
            }
          }
        );
        tokenExpiry = currTimestamp() + tokenResponse.body.expires_in;
        apiToken = tokenResponse.body;
      } catch (e) {
        console.error("[openverse-api-client]: Token refresh failed!", e);
      }
      apiTokenMutex.requesting = false;
    };
    const awaitApiToken = async () => {
      while (apiTokenMutex.requesting) {
        await new Promise((res) => setTimeout(res, 300));
      }
    };
    const getAuthHeaders = async (headers) => {
      if (!credentials) {
        return new Headers(headers);
      }
      if (shouldTriggerTokenRefresh()) {
        refreshApiToken();
      }
      if (cannotProceedWithoutToken()) {
        await awaitApiToken();
      }
      const withAuth = new Headers(headers);
      withAuth.append(
        "Authorization",
        `Bearer ${apiToken.access_token}`
      );
      return withAuth;
    };
    const request = async (endpoint, req) => {
      const authHeaders = await getAuthHeaders(req?.headers ?? {});
      return baseRequest(endpoint, {
        ...req ?? {},
        headers: authHeaders
      });
    };
    return request;
  };
  return __toCommonJS(index_exports);
})();
