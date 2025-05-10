import _defineProperty from '@babel/runtime/helpers/defineProperty';
import { Duplex } from 'readable-stream';
import safeStringify from 'fast-safe-stringify';
import _objectSpread from '@babel/runtime/helpers/objectSpread2';
import { EventEmitter } from 'events';
import eos from 'end-of-stream';
import once from 'once';
import pump from 'pump';

function noop() {
  return undefined;
}
const SYN = "SYN";
const ACK = "ACK";
const BRK = "BRK";
class BasePostMessageStream extends Duplex {
  constructor(_ref) {
    let {
      name,
      target,
      targetWindow = window,
      targetOrigin = "*"
    } = _ref;
    super({
      objectMode: true
    });
    _defineProperty(this, "_init", void 0);
    _defineProperty(this, "_haveSyn", void 0);
    _defineProperty(this, "_name", void 0);
    _defineProperty(this, "_target", void 0);
    _defineProperty(this, "_targetWindow", void 0);
    _defineProperty(this, "_targetOrigin", void 0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _defineProperty(this, "_onMessage", void 0);
    _defineProperty(this, "_synIntervalId", void 0);
    if (!name || !target) {
      throw new Error("Invalid input.");
    }
    this._init = false;
    this._haveSyn = false;
    this._name = name;
    this._target = target; // target origin
    this._targetWindow = targetWindow;
    this._targetOrigin = targetOrigin;
    this._onMessage = this.onMessage.bind(this);
    this._synIntervalId = null;
    window.addEventListener("message", this._onMessage, false);
    this._handShake();
  }
  _break() {
    this.cork();
    this._write(BRK, null, noop);
    this._haveSyn = false;
    this._init = false;
  }
  _handShake() {
    this._write(SYN, null, noop);
    this.cork();
  }
  _onData(data) {
    if (!this._init) {
      // listen for handshake
      if (data === SYN) {
        this._haveSyn = true;
        this._write(ACK, null, noop);
      } else if (data === ACK) {
        this._init = true;
        if (!this._haveSyn) {
          this._write(ACK, null, noop);
        }
        this.uncork();
      }
    } else if (data === BRK) {
      this._break();
    } else {
      // forward message
      try {
        this.push(data);
      } catch (err) {
        this.emit("error", err);
      }
    }
  }
  _postMessage(data) {
    const originConstraint = this._targetOrigin;
    this._targetWindow.postMessage({
      target: this._target,
      data
    }, originConstraint);
  }
  onMessage(event) {
    const message = event.data;

    // validate message
    if (this._targetOrigin !== "*" && event.origin !== this._targetOrigin || event.source !== this._targetWindow || typeof message !== "object" || message.target !== this._name || !message.data) {
      return;
    }
    this._onData(message.data);
  }
  _read() {
    return undefined;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _write(data, _, cb) {
    this._postMessage(data);
    cb();
  }
  _destroy() {
    window.removeEventListener("message", this._onMessage, false);
  }
}

const errorCodes = {
  rpc: {
    invalidInput: -32000,
    resourceNotFound: -32001,
    resourceUnavailable: -32002,
    transactionRejected: -32003,
    methodNotSupported: -32004,
    limitExceeded: -32005,
    parse: -32700,
    invalidRequest: -32600,
    methodNotFound: -32601,
    invalidParams: -32602,
    internal: -32603
  },
  provider: {
    userRejectedRequest: 4001,
    unauthorized: 4100,
    unsupportedMethod: 4200,
    disconnected: 4900,
    chainDisconnected: 4901
  }
};
const errorValues = {
  "-32700": {
    standard: "JSON RPC 2.0",
    message: "Invalid JSON was received by the server. An error occurred on the server while parsing the JSON text."
  },
  "-32600": {
    standard: "JSON RPC 2.0",
    message: "The JSON sent is not a valid Request object."
  },
  "-32601": {
    standard: "JSON RPC 2.0",
    message: "The method does not exist / is not available."
  },
  "-32602": {
    standard: "JSON RPC 2.0",
    message: "Invalid method parameter(s)."
  },
  "-32603": {
    standard: "JSON RPC 2.0",
    message: "Internal JSON-RPC error."
  },
  "-32000": {
    standard: "EIP-1474",
    message: "Invalid input."
  },
  "-32001": {
    standard: "EIP-1474",
    message: "Resource not found."
  },
  "-32002": {
    standard: "EIP-1474",
    message: "Resource unavailable."
  },
  "-32003": {
    standard: "EIP-1474",
    message: "Transaction rejected."
  },
  "-32004": {
    standard: "EIP-1474",
    message: "Method not supported."
  },
  "-32005": {
    standard: "EIP-1474",
    message: "Request limit exceeded."
  },
  "4001": {
    standard: "EIP-1193",
    message: "User rejected the request."
  },
  "4100": {
    standard: "EIP-1193",
    message: "The requested account and/or method has not been authorized by the user."
  },
  "4200": {
    standard: "EIP-1193",
    message: "The requested method is not supported by this Ethereum provider."
  },
  "4900": {
    standard: "EIP-1193",
    message: "The provider is disconnected from all chains."
  },
  "4901": {
    standard: "EIP-1193",
    message: "The provider is disconnected from the specified chain."
  }
};

const FALLBACK_ERROR_CODE = errorCodes.rpc.internal;
const FALLBACK_MESSAGE = "Unspecified error message. This is a bug, please report it.";
const JSON_RPC_SERVER_ERROR_MESSAGE = "Unspecified server error.";
/**
 * Returns whether the given code is valid.
 * A code is valid if it is an integer.
 *
 * @param code - The error code.
 * @returns Whether the given code is valid.
 */
function isValidCode(code) {
  return Number.isInteger(code);
}
function isValidString(value) {
  return typeof value === "string" && value.length > 0;
}

/**
 * A type guard for {@link RuntimeObject}.
 *
 * @param value - The value to check.
 * @returns Whether the specified value has a runtime type of `object` and is
 * neither `null` nor an `Array`.
 */
function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/**
 * Check if the value is plain object.
 *
 * @param value - Value to be checked.
 * @returns True if an object is the plain JavaScript object,
 * false if the object is not plain (e.g. function).
 */
function isPlainObject(value) {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  try {
    let proto = value;
    while (Object.getPrototypeOf(proto) !== null) {
      proto = Object.getPrototypeOf(proto);
    }
    return Object.getPrototypeOf(value) === proto;
  } catch (_) {
    return false;
  }
}

/**
 * Check if the given code is a valid JSON-RPC server error code.
 *
 * @param code - The error code.
 * @returns Whether the given code is a valid JSON-RPC server error code.
 */
function isJsonRpcServerError(code) {
  return code >= -32099 && code <= -32000;
}
function isJsonRpcError(value) {
  const castValue = value;
  if (!castValue) return false;
  if (!isValidCode(castValue.code) || !isValidString(castValue.message)) return false;
  if (castValue.stack && !isValidString(castValue.stack)) return false;
  return true;
}

/**
 * Gets the message for a given code, or a fallback message if the code has
 * no corresponding message.
 *
 * @param code - The error code.
 * @param fallbackMessage - The fallback message to use if the code has no
 * corresponding message.
 * @returns The message for the given code, or the fallback message if the code
 * has no corresponding message.
 */
function getMessageFromCode(code) {
  let fallbackMessage = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : FALLBACK_MESSAGE;
  if (isValidCode(code)) {
    const codeString = code.toString();
    if (Object.hasOwn(errorValues, codeString)) {
      return errorValues[codeString].message;
    }
    if (isJsonRpcServerError(code)) {
      return JSON_RPC_SERVER_ERROR_MESSAGE;
    }
  }
  return fallbackMessage;
}
const FALLBACK_ERROR = {
  code: FALLBACK_ERROR_CODE,
  message: getMessageFromCode(FALLBACK_ERROR_CODE)
};
function isValidJson(str) {
  try {
    JSON.parse(JSON.stringify(str, (strKey, strVal) => {
      if (strKey === "__proto__" || strKey === "constructor") {
        throw new Error("Not valid json");
      }
      if (typeof strVal === "function" || typeof strVal === "symbol") {
        throw new Error("Not valid json");
      }
      return strVal;
    }), (propKey, propValue) => {
      // Strip __proto__ and constructor properties to prevent prototype pollution.
      if (propKey === "__proto__" || propKey === "constructor") {
        return undefined;
      }
      return propValue;
    });
    // this means, it's a valid json so far
  } catch (e) {
    return false;
  }
  return true;
}

/**
 * Extracts all JSON-serializable properties from an object.
 *
 * @param object - The object in question.
 * @returns An object containing all the JSON-serializable properties.
 */
function serializeObject(object) {
  return Object.getOwnPropertyNames(object).reduce((acc, key) => {
    const value = object[key];
    if (isValidJson(value)) {
      acc[key] = value;
    }
    return acc;
  }, {});
}

/**
 * Serializes an unknown error to be used as the `cause` in a fallback error.
 *
 * @param error - The unknown error.
 * @returns A JSON-serializable object containing as much information about the original error as possible.
 */
function serializeCause(error) {
  if (Array.isArray(error)) {
    return error.map(entry => {
      if (isValidJson(entry)) {
        return entry;
      } else if (isObject(entry)) {
        return serializeObject(entry);
      }
      return null;
    });
  } else if (isObject(error)) {
    return serializeObject(error);
  }
  if (isValidJson(error)) {
    return error;
  }
  return null;
}

/**
 * Construct a JSON-serializable object given an error and a JSON serializable `fallbackError`
 *
 * @param error - The error in question.
 * @param fallbackError - A JSON serializable fallback error.
 * @returns A JSON serializable error object.
 */
function buildError(error, fallbackError) {
  // If an error specifies a `serialize` function, we call it and return the result.
  if (error && typeof error === "object" && "serialize" in error && typeof error.serialize === "function") {
    return error.serialize();
  }
  if (isJsonRpcError(error)) {
    return error;
  }

  // If the error does not match the JsonRpcError type, use the fallback error, but try to include the original error as `cause`.
  const cause = serializeCause(error);
  const fallbackWithCause = _objectSpread(_objectSpread({}, fallbackError), {}, {
    data: {
      cause
    }
  });
  return fallbackWithCause;
}

/**
 * Serializes the given error to an Ethereum JSON RPC-compatible error object.
 * If the given error is not fully compatible, it will be preserved on the
 * returned object's data.cause property.
 *
 * @param error - The error to serialize.
 * @param options - Options bag.
 * @param options.fallbackError - The error to return if the given error is
 * not compatible. Should be a JSON serializable value.
 * @param options.shouldIncludeStack - Whether to include the error's stack
 * on the returned object.
 * @returns The serialized error.
 */
function serializeError(error) {
  let {
    fallbackError = FALLBACK_ERROR,
    shouldIncludeStack = true
  } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  if (!isJsonRpcError(fallbackError)) {
    throw new Error("Must provide fallback error with integer number code and string message.");
  }
  const serialized = buildError(error, fallbackError);
  if (!shouldIncludeStack) {
    delete serialized.stack;
  }
  return serialized;
}

/**
 * Returns true if supplied error data has a usable `cause` property; false otherwise.
 *
 * @param data - Optional data to validate.
 * @returns Whether cause property is present and an object.
 */
function dataHasCause(data) {
  return isObject(data) && Object.hasOwn(data, "cause") && isObject(data.cause);
}

/**
 * Check if the given code is a valid JSON-RPC error code.
 *
 * @param code - The code to check.
 * @returns Whether the code is valid.
 */
function isValidEthProviderCode(code) {
  return Number.isInteger(code) && code >= 1000 && code <= 4999;
}

/**
 * A JSON replacer function that omits circular references.
 *
 * @param _ - The key being replaced.
 * @param value - The value being replaced.
 * @returns The value to use in place of the original value.
 */
function stringifyReplacer(_, value) {
  if (value === "[Circular]") {
    return undefined;
  }
  return value;
}

/**
 * Error subclass implementing JSON RPC 2.0 errors and Ethereum RPC errors
 * per EIP-1474.
 *
 * Permits any integer error code.
 */
class JsonRpcError extends Error {
  constructor(code, message, data) {
    if (!Number.isInteger(code)) {
      throw new Error('"code" must be an integer.');
    }
    if (!message || typeof message !== "string") {
      throw new Error('"message" must be a non-empty string.');
    }
    if (dataHasCause(data)) {
      super(message, {
        cause: data.cause
      });

      // Browser backwards-compatibility fallback
      // The `cause` definition can be removed when tsconfig lib and/or target have changed to >=es2022
      _defineProperty(this, "cause", void 0);
      _defineProperty(this, "code", void 0);
      _defineProperty(this, "data", void 0);
      if (!Object.hasOwn(this, "cause")) {
        Object.assign(this, {
          cause: data.cause
        });
      }
    } else {
      super(message);
      // The `cause` definition can be removed when tsconfig lib and/or target have changed to >=es2022
      _defineProperty(this, "cause", void 0);
      _defineProperty(this, "code", void 0);
      _defineProperty(this, "data", void 0);
    }
    if (data !== undefined) {
      this.data = data;
    }
    this.code = code;
    this.cause = data === null || data === void 0 ? void 0 : data.cause;
  }

  /**
   * Get the error as JSON-serializable object.
   *
   * @returns A plain object with all public class properties.
   */
  serialize() {
    const serialized = {
      code: this.code,
      message: this.message
    };
    if (this.data !== undefined) {
      // `this.data` is not guaranteed to be a plain object, but this simplifies
      // the type guard below. We can safely cast it because we know it's a
      // JSON-serializable value.
      serialized.data = this.data;
      if (isPlainObject(this.data)) {
        serialized.data.cause = serializeCause(this.data.cause);
      }
    }
    if (this.stack) {
      serialized.stack = this.stack;
    }
    return serialized;
  }

  /**
   * Get a string representation of the serialized error, omitting any circular
   * references.
   *
   * @returns A string representation of the serialized error.
   */
  toString() {
    return safeStringify(this.serialize(), stringifyReplacer, 2);
  }
}

/**
 * Error subclass implementing Ethereum Provider errors per EIP-1193.
 * Permits integer error codes in the [ 1000 <= 4999 ] range.
 */
class EthereumProviderError extends JsonRpcError {
  /**
   * Create an Ethereum Provider JSON-RPC error.
   *
   * @param code - The JSON-RPC error code. Must be an integer in the
   * `1000 <= n <= 4999` range.
   * @param message - The JSON-RPC error message.
   * @param data - Optional data to include in the error.
   */
  constructor(code, message, data) {
    if (!isValidEthProviderCode(code)) {
      throw new Error('"code" must be an integer such that: 1000 <= code <= 4999');
    }
    super(code, message, data);
  }
}

/**
 * Get an error message and optional data from an options bag.
 *
 * @param arg - The error message or options bag.
 * @returns A tuple containing the error message and optional data.
 */
function parseOpts(arg) {
  if (arg) {
    if (typeof arg === "string") {
      return [arg];
    } else if (typeof arg === "object" && !Array.isArray(arg)) {
      const {
        message,
        data
      } = arg;
      if (message && typeof message !== "string") {
        throw new Error("Must specify string message.");
      }
      return [message !== null && message !== void 0 ? message : undefined, data];
    }
  }
  return [];
}

/**
 * Get a generic JSON-RPC error class instance.
 *
 * @param code - The error code.
 * @param arg - The error message or options bag.
 * @returns An instance of the {@link JsonRpcError} class.
 */
function getJsonRpcError(code, arg) {
  const [message, data] = parseOpts(arg);
  return new JsonRpcError(code, message !== null && message !== void 0 ? message : getMessageFromCode(code), data);
}

/**
 * Get an Ethereum Provider error class instance.
 *
 * @param code - The error code.
 * @param arg - The error message or options bag.
 * @returns An instance of the {@link EthereumProviderError} class.
 */
function getEthProviderError(code, arg) {
  const [message, data] = parseOpts(arg);
  return new EthereumProviderError(code, message !== null && message !== void 0 ? message : getMessageFromCode(code), data);
}
const rpcErrors = {
  /**
   * Get a JSON RPC 2.0 Parse (-32700) error.
   *
   * @param arg - The error message or options bag.
   * @returns An instance of the {@link JsonRpcError} class.
   */
  parse: arg => getJsonRpcError(errorCodes.rpc.parse, arg),
  /**
   * Get a JSON RPC 2.0 Invalid Request (-32600) error.
   *
   * @param arg - The error message or options bag.
   * @returns An instance of the {@link JsonRpcError} class.
   */
  invalidRequest: arg => getJsonRpcError(errorCodes.rpc.invalidRequest, arg),
  /**
   * Get a JSON RPC 2.0 Invalid Params (-32602) error.
   *
   * @param arg - The error message or options bag.
   * @returns An instance of the {@link JsonRpcError} class.
   */
  invalidParams: arg => getJsonRpcError(errorCodes.rpc.invalidParams, arg),
  /**
   * Get a JSON RPC 2.0 Method Not Found (-32601) error.
   *
   * @param arg - The error message or options bag.
   * @returns An instance of the {@link JsonRpcError} class.
   */
  methodNotFound: arg => getJsonRpcError(errorCodes.rpc.methodNotFound, arg),
  /**
   * Get a JSON RPC 2.0 Internal (-32603) error.
   *
   * @param arg - The error message or options bag.
   * @returns An instance of the {@link JsonRpcError} class.
   */
  internal: arg => getJsonRpcError(errorCodes.rpc.internal, arg),
  /**
   * Get a JSON RPC 2.0 Server error.
   * Permits integer error codes in the [ -32099 <= -32005 ] range.
   * Codes -32000 through -32004 are reserved by EIP-1474.
   *
   * @param opts - The error options bag.
   * @returns An instance of the {@link JsonRpcError} class.
   */
  server: opts => {
    if (!opts || typeof opts !== "object" || Array.isArray(opts)) {
      throw new Error("Ethereum RPC Server errors must provide single object argument.");
    }
    const {
      code
    } = opts;
    if (!Number.isInteger(code) || code > -32005 || code < -32099) {
      throw new Error('"code" must be an integer such that: -32099 <= code <= -32005');
    }
    return getJsonRpcError(code, opts);
  },
  /**
   * Get an Ethereum JSON RPC Invalid Input (-32000) error.
   *
   * @param arg - The error message or options bag.
   * @returns An instance of the {@link JsonRpcError} class.
   */
  invalidInput: arg => getJsonRpcError(errorCodes.rpc.invalidInput, arg),
  /**
   * Get an Ethereum JSON RPC Resource Not Found (-32001) error.
   *
   * @param arg - The error message or options bag.
   * @returns An instance of the {@link JsonRpcError} class.
   */
  resourceNotFound: arg => getJsonRpcError(errorCodes.rpc.resourceNotFound, arg),
  /**
   * Get an Ethereum JSON RPC Resource Unavailable (-32002) error.
   *
   * @param arg - The error message or options bag.
   * @returns An instance of the {@link JsonRpcError} class.
   */
  resourceUnavailable: arg => getJsonRpcError(errorCodes.rpc.resourceUnavailable, arg),
  /**
   * Get an Ethereum JSON RPC Transaction Rejected (-32003) error.
   *
   * @param arg - The error message or options bag.
   * @returns An instance of the {@link JsonRpcError} class.
   */
  transactionRejected: arg => getJsonRpcError(errorCodes.rpc.transactionRejected, arg),
  /**
   * Get an Ethereum JSON RPC Method Not Supported (-32004) error.
   *
   * @param arg - The error message or options bag.
   * @returns An instance of the {@link JsonRpcError} class.
   */
  methodNotSupported: arg => getJsonRpcError(errorCodes.rpc.methodNotSupported, arg),
  /**
   * Get an Ethereum JSON RPC Limit Exceeded (-32005) error.
   *
   * @param arg - The error message or options bag.
   * @returns An instance of the {@link JsonRpcError} class.
   */
  limitExceeded: arg => getJsonRpcError(errorCodes.rpc.limitExceeded, arg)
};
const providerErrors = {
  /**
   * Get an Ethereum Provider User Rejected Request (4001) error.
   *
   * @param arg - The error message or options bag.
   * @returns An instance of the {@link EthereumProviderError} class.
   */
  userRejectedRequest: arg => {
    return getEthProviderError(errorCodes.provider.userRejectedRequest, arg);
  },
  /**
   * Get an Ethereum Provider Unauthorized (4100) error.
   *
   * @param arg - The error message or options bag.
   * @returns An instance of the {@link EthereumProviderError} class.
   */
  unauthorized: arg => {
    return getEthProviderError(errorCodes.provider.unauthorized, arg);
  },
  /**
   * Get an Ethereum Provider Unsupported Method (4200) error.
   *
   * @param arg - The error message or options bag.
   * @returns An instance of the {@link EthereumProviderError} class.
   */
  unsupportedMethod: arg => {
    return getEthProviderError(errorCodes.provider.unsupportedMethod, arg);
  },
  /**
   * Get an Ethereum Provider Not Connected (4900) error.
   *
   * @param arg - The error message or options bag.
   * @returns An instance of the {@link EthereumProviderError} class.
   */
  disconnected: arg => {
    return getEthProviderError(errorCodes.provider.disconnected, arg);
  },
  /**
   * Get an Ethereum Provider Chain Not Connected (4901) error.
   *
   * @param arg - The error message or options bag.
   * @returns An instance of the {@link EthereumProviderError} class.
   */
  chainDisconnected: arg => {
    return getEthProviderError(errorCodes.provider.chainDisconnected, arg);
  },
  /**
   * Get a custom Ethereum Provider error.
   *
   * @param opts - The error options bag.
   * @returns An instance of the {@link EthereumProviderError} class.
   */
  custom: opts => {
    if (!opts || typeof opts !== "object" || Array.isArray(opts)) {
      throw new Error("Ethereum Provider custom errors must provide single object argument.");
    }
    const {
      code,
      message,
      data
    } = opts;
    if (!message || typeof message !== "string") {
      throw new Error('"message" must be a nonempty string');
    }
    return new EthereumProviderError(code, message, data);
  }
};

/* eslint-disable @typescript-eslint/no-explicit-any */
function safeApply(handler, context, args) {
  try {
    Reflect.apply(handler, context, args);
  } catch (err) {
    // Throw error after timeout so as not to interrupt the stack
    setTimeout(() => {
      throw err;
    });
  }
}
function arrayClone(arr) {
  const n = arr.length;
  const copy = new Array(n);
  for (let i = 0; i < n; i += 1) {
    copy[i] = arr[i];
  }
  return copy;
}
class SafeEventEmitter extends EventEmitter {
  emit(type) {
    let doError = type === "error";
    const events = this._events;
    if (events !== undefined) {
      doError = doError && events.error === undefined;
    } else if (!doError) {
      return false;
    }

    // If there is no 'error' event listener then throw.
    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }
    if (doError) {
      let er;
      if (args.length > 0) {
        [er] = args;
      }
      if (er instanceof Error) {
        // Note: The comments on the `throw` lines are intentional, they show
        // up in Node's output if this results in an unhandled exception.
        throw er; // Unhandled 'error' event
      }
      // At least give some kind of context to the user
      const err = new Error(`Unhandled error.${er ? ` (${er.message})` : ""}`);
      err.context = er;
      throw err; // Unhandled 'error' event
    }
    const handler = events[type];
    if (handler === undefined) {
      return false;
    }
    if (typeof handler === "function") {
      safeApply(handler, this, args);
    } else {
      const len = handler.length;
      const listeners = arrayClone(handler);
      for (let i = 0; i < len; i += 1) {
        safeApply(listeners[i], this, args);
      }
    }
    return true;
  }
}

class SerializableError extends Error {
  constructor(_ref) {
    let {
      code,
      message,
      data
    } = _ref;
    if (!Number.isInteger(code)) {
      throw new Error("code must be an integer");
    }
    if (!message || typeof message !== "string") {
      throw new Error("message must be string");
    }
    super(message);
    _defineProperty(this, "code", void 0);
    _defineProperty(this, "data", void 0);
    this.code = code;
    if (data !== undefined) {
      this.data = data;
    }
  }
  toString() {
    return safeStringify({
      code: this.code,
      message: this.message,
      data: this.data,
      stack: this.stack
    });
  }
}

const getRpcPromiseCallback = function (resolve, reject) {
  let unwrapResult = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
  return (error, response) => {
    if (error || response.error) {
      reject(error || response.error);
    } else if (!unwrapResult || Array.isArray(response)) {
      resolve(response);
    } else {
      resolve(response.result);
    }
  };
};
function createErrorMiddleware(log) {
  return (req, res, next, end) => {
    try {
      // json-rpc-engine will terminate the request when it notices this error
      if (typeof req.method !== "string" || !req.method) {
        res.error = new SerializableError({
          code: -32603,
          message: "invalid method"
        });
        end();
        return;
      }
      next(done => {
        const {
          error
        } = res;
        if (!error) {
          return done();
        }
        log.error(`OpenLogin - RPC Error: ${error.message}`, error);
        return done();
      });
    } catch (error) {
      log.error(`OpenLogin - RPC Error thrown: ${error.message}`, error);
      res.error = new SerializableError({
        code: -32603,
        message: error.message
      });
      end();
    }
  };
}
function createStreamMiddleware() {
  const idMap = {};
  function readNoop() {
    return false;
  }
  const events = new SafeEventEmitter();
  function processResponse(res) {
    const context = idMap[res.id];
    if (!context) {
      throw new Error(`StreamMiddleware - Unknown response id "${res.id}"`);
    }
    delete idMap[res.id];
    // copy whole res onto original res
    Object.assign(context.res, res);
    // run callback on empty stack,
    // prevent internal stream-handler from catching errors
    setTimeout(context.end);
  }
  function processNotification(res) {
    events.emit("notification", res);
  }
  function processMessage(res, _encoding, cb) {
    let err;
    try {
      const isNotification = !res.id;
      if (isNotification) {
        processNotification(res);
      } else {
        processResponse(res);
      }
    } catch (_err) {
      err = _err;
    }
    // continue processing stream
    cb(err);
  }
  const stream = new Duplex({
    objectMode: true,
    read: readNoop,
    write: processMessage
  });
  const middleware = (req, res, next, end) => {
    // write req to stream
    stream.push(req);
    // register request on id map
    idMap[req.id] = {
      req,
      res,
      next,
      end
    };
  };
  return {
    events,
    middleware,
    stream
  };
}
function createScaffoldMiddleware(handlers) {
  return (req, res, next, end) => {
    const handler = handlers[req.method];
    // if no handler, return
    if (handler === undefined) {
      return next();
    }
    // if handler is fn, call as middleware
    if (typeof handler === "function") {
      return handler(req, res, next, end);
    }
    // if handler is some other value, use as result
    res.result = handler;
    return end();
  };
}
function createIdRemapMiddleware() {
  return (req, res, next, _end) => {
    const originalId = req.id;
    const newId = Math.random().toString(36).slice(2);
    req.id = newId;
    res.id = newId;
    next(done => {
      req.id = originalId;
      res.id = originalId;
      done();
    });
  };
}
function createLoggerMiddleware(logger) {
  return (req, res, next, _) => {
    logger.debug("REQ", req, "RES", res);
    next();
  };
}
function createAsyncMiddleware(asyncMiddleware) {
  return async (req, res, next, end) => {
    // nextPromise is the key to the implementation
    // it is resolved by the return handler passed to the
    // "next" function
    let resolveNextPromise;
    const nextPromise = new Promise(resolve => {
      resolveNextPromise = resolve;
    });
    let returnHandlerCallback = null;
    let nextWasCalled = false;

    // This will be called by the consumer's async middleware.
    const asyncNext = async () => {
      nextWasCalled = true;

      // We pass a return handler to next(). When it is called by the engine,
      // the consumer's async middleware will resume executing.

      next(runReturnHandlersCallback => {
        // This callback comes from JRPCEngine._runReturnHandlers
        returnHandlerCallback = runReturnHandlersCallback;
        resolveNextPromise();
      });
      await nextPromise;
    };
    try {
      await asyncMiddleware(req, res, asyncNext);
      if (nextWasCalled) {
        await nextPromise; // we must wait until the return handler is called
        returnHandlerCallback(null);
      } else {
        end(null);
      }
    } catch (err) {
      const error = err;
      if (returnHandlerCallback) {
        returnHandlerCallback(error);
      } else {
        end(error);
      }
    }
  };
}

/**
 * A JSON-RPC request and response processor.
 * Give it a stack of middleware, pass it requests, and get back responses.
 */
class JRPCEngine extends SafeEventEmitter {
  constructor() {
    super();
    _defineProperty(this, "_middleware", void 0);
    this._middleware = [];
  }

  /**
   * Serially executes the given stack of middleware.
   *
   * @returns An array of any error encountered during middleware execution,
   * a boolean indicating whether the request was completed, and an array of
   * middleware-defined return handlers.
   */
  static async _runAllMiddleware(req, res, middlewareStack) {
    const returnHandlers = [];
    let error = null;
    let isComplete = false;

    // Go down stack of middleware, call and collect optional returnHandlers
    for (const middleware of middlewareStack) {
      [error, isComplete] = await JRPCEngine._runMiddleware(req, res, middleware, returnHandlers);
      if (isComplete) {
        break;
      }
    }
    return [error, isComplete, returnHandlers.reverse()];
  }

  /**
   * Runs an individual middleware.
   *
   * @returns An array of any error encountered during middleware execution,
   * and a boolean indicating whether the request should end.
   */
  static _runMiddleware(req, res, middleware, returnHandlers) {
    return new Promise(resolve => {
      const end = err => {
        const error = err || res.error;
        if (error) {
          if (typeof error === "object" && Object.keys(error).includes("stack") === false) error.stack = "Stack trace is not available.";
          res.error = serializeError(error, {
            shouldIncludeStack: true,
            fallbackError: {
              message: (error === null || error === void 0 ? void 0 : error.message) || (error === null || error === void 0 ? void 0 : error.toString()),
              code: (error === null || error === void 0 ? void 0 : error.code) || -32603,
              stack: (error === null || error === void 0 ? void 0 : error.stack) || "Stack trace is not available.",
              data: (error === null || error === void 0 ? void 0 : error.data) || (error === null || error === void 0 ? void 0 : error.message) || (error === null || error === void 0 ? void 0 : error.toString())
            }
          });
        }
        // True indicates that the request should end
        resolve([error, true]);
      };
      const next = returnHandler => {
        if (res.error) {
          end(res.error);
        } else {
          if (returnHandler) {
            if (typeof returnHandler !== "function") {
              end(new SerializableError({
                code: -32603,
                message: "JRPCEngine: 'next' return handlers must be functions"
              }));
            }
            returnHandlers.push(returnHandler);
          }

          // False indicates that the request should not end
          resolve([null, false]);
        }
      };
      try {
        middleware(req, res, next, end);
      } catch (error) {
        end(error);
      }
    });
  }

  /**
   * Serially executes array of return handlers. The request and response are
   * assumed to be in their scope.
   */
  static async _runReturnHandlers(handlers) {
    for (const handler of handlers) {
      await new Promise((resolve, reject) => {
        handler(err => err ? reject(err) : resolve());
      });
    }
  }

  /**
   * Throws an error if the response has neither a result nor an error, or if
   * the "isComplete" flag is falsy.
   */
  static _checkForCompletion(_req, res, isComplete) {
    if (!("result" in res) && !("error" in res)) {
      throw new SerializableError({
        code: -32603,
        message: "Response has no error or result for request"
      });
    }
    if (!isComplete) {
      throw new SerializableError({
        code: -32603,
        message: "Nothing ended request"
      });
    }
  }

  /**
   * Add a middleware function to the engine's middleware stack.
   *
   * @param middleware - The middleware function to add.
   */
  push(middleware) {
    this._middleware.push(middleware);
  }

  /**
   * Handle a JSON-RPC request, and return a response.
   *
   * @param request - The request to handle.
   * @param callback - An error-first callback that will receive the response.
   */

  /**
   * Handle an array of JSON-RPC requests, and return an array of responses.
   *
   * @param request - The requests to handle.
   * @param callback - An error-first callback that will receive the array of
   * responses.
   */

  /**
   * Handle a JSON-RPC request, and return a response.
   *
   * @param request - The request to handle.
   * @returns A promise that resolves with the response, or rejects with an
   * error.
   */

  /**
   * Handle an array of JSON-RPC requests, and return an array of responses.
   *
   * @param request - The requests to handle.
   * @returns A promise that resolves with the array of responses, or rejects
   * with an error.
   */

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handle(req, cb) {
    if (cb && typeof cb !== "function") {
      throw new Error('"callback" must be a function if provided.');
    }
    if (Array.isArray(req)) {
      if (cb) {
        return this._handleBatch(req, cb);
      }
      return this._handleBatch(req);
    }
    if (cb) {
      return this._handle(req, cb);
    }
    return this._promiseHandle(req);
  }

  /**
   * Returns this engine as a middleware function that can be pushed to other
   * engines.
   *
   * @returns This engine as a middleware function.
   */
  asMiddleware() {
    return async (req, res, next, end) => {
      try {
        const [middlewareError, isComplete, returnHandlers] = await JRPCEngine._runAllMiddleware(req, res, this._middleware);
        if (isComplete) {
          await JRPCEngine._runReturnHandlers(returnHandlers);
          return end(middlewareError);
        }
        return next(async handlerCallback => {
          try {
            await JRPCEngine._runReturnHandlers(returnHandlers);
          } catch (error) {
            return handlerCallback(error);
          }
          return handlerCallback();
        });
      } catch (error) {
        return end(error);
      }
    };
  }

  /**
   * Like _handle, but for batch requests.
   */

  /**
   * Like _handle, but for batch requests.
   */

  async _handleBatch(reqs, cb) {
    // The order here is important
    try {
      // 2. Wait for all requests to finish, or throw on some kind of fatal
      // error
      const responses = await Promise.all(
      // 1. Begin executing each request in the order received
      reqs.map(this._promiseHandle.bind(this)));

      // 3. Return batch response
      if (cb) {
        return cb(null, responses);
      }
      return responses;
    } catch (error) {
      if (cb) {
        return cb(error);
      }
      throw error;
    }
  }

  /**
   * A promise-wrapped _handle.
   */
  _promiseHandle(req) {
    return new Promise((resolve, reject) => {
      this._handle(req, (_err, res) => {
        // There will always be a response, and it will always have any error
        // that is caught and propagated.
        if (_err && res === undefined) {
          reject(_err);
        } else resolve(res);
      }).catch(reject);
    });
  }

  /**
   * Ensures that the request object is valid, processes it, and passes any
   * error and the response object to the given callback.
   *
   * Does not reject.
   */
  async _handle(callerReq, cb) {
    if (!callerReq || Array.isArray(callerReq) || typeof callerReq !== "object") {
      const error = new SerializableError({
        code: -32603,
        message: "request must be plain object"
      });
      return cb(error, {
        id: undefined,
        jsonrpc: "2.0",
        error
      });
    }
    if (typeof callerReq.method !== "string") {
      const error = new SerializableError({
        code: -32603,
        message: "method must be string"
      });
      return cb(error, {
        id: callerReq.id,
        jsonrpc: "2.0",
        error
      });
    }
    const req = _objectSpread({}, callerReq);
    const res = {
      id: req.id,
      jsonrpc: req.jsonrpc
    };
    let error = null;
    try {
      await this._processRequest(req, res);
    } catch (_error) {
      // A request handler error, a re-thrown middleware error, or something
      // unexpected.
      error = _error;
    }
    if (error) {
      // Ensure no result is present on an errored response
      delete res.result;
      if (!res.error) {
        var _error2, _error3, _error4, _error5, _error6, _error7, _error8;
        if (typeof error === "object" && Object.keys(error).includes("stack") === false) error.stack = "Stack trace is not available.";
        res.error = serializeError(error, {
          shouldIncludeStack: true,
          fallbackError: {
            message: ((_error2 = error) === null || _error2 === void 0 ? void 0 : _error2.message) || ((_error3 = error) === null || _error3 === void 0 ? void 0 : _error3.toString()),
            code: ((_error4 = error) === null || _error4 === void 0 ? void 0 : _error4.code) || -32603,
            stack: ((_error5 = error) === null || _error5 === void 0 ? void 0 : _error5.stack) || "Stack trace is not available.",
            data: ((_error6 = error) === null || _error6 === void 0 ? void 0 : _error6.data) || ((_error7 = error) === null || _error7 === void 0 ? void 0 : _error7.message) || ((_error8 = error) === null || _error8 === void 0 ? void 0 : _error8.toString())
          }
        });
      }
    }
    return cb(error, res);
  }

  /**
   * For the given request and response, runs all middleware and their return
   * handlers, if any, and ensures that internal request processing semantics
   * are satisfied.
   */
  async _processRequest(req, res) {
    const [error, isComplete, returnHandlers] = await JRPCEngine._runAllMiddleware(req, res, this._middleware);

    // Throw if "end" was not called, or if the response has neither a result
    // nor an error.
    JRPCEngine._checkForCompletion(req, res, isComplete);

    // The return handlers should run even if an error was encountered during
    // middleware processing.
    await JRPCEngine._runReturnHandlers(returnHandlers);

    // Now we re-throw the middleware processing error, if any, to catch it
    // further up the call chain.
    if (error) {
      throw error;
    }
  }
}
function mergeMiddleware(middlewareStack) {
  const engine = new JRPCEngine();
  middlewareStack.forEach(middleware => engine.push(middleware));
  return engine.asMiddleware();
}
function createEngineStream(opts) {
  if (!opts || !opts.engine) {
    throw new Error("Missing engine parameter!");
  }
  const {
    engine
  } = opts;
  // eslint-disable-next-line prefer-const
  let stream;
  function read() {
    return undefined;
  }
  function write(req, _encoding, cb) {
    engine.handle(req, (_err, res) => {
      stream.push(res);
    });
    cb();
  }
  stream = new Duplex({
    objectMode: true,
    read,
    write
  });

  // forward notifications
  if (engine.on) {
    engine.on("notification", message => {
      stream.push(message);
    });
  }
  return stream;
}
function providerFromEngine(engine) {
  const provider = new SafeEventEmitter();
  // handle both rpc send methods
  provider.sendAsync = async req => {
    const res = await engine.handle(req);
    if (res.error) {
      var _res$error, _res$error2, _res$error3, _res$error4, _res$error5, _res$error6, _res$error7;
      if (typeof res.error === "object" && Object.keys(res.error).includes("stack") === false) res.error.stack = "Stack trace is not available.";
      const err = serializeError(res.error, {
        fallbackError: {
          message: ((_res$error = res.error) === null || _res$error === void 0 ? void 0 : _res$error.message) || ((_res$error2 = res.error) === null || _res$error2 === void 0 ? void 0 : _res$error2.toString()),
          code: ((_res$error3 = res.error) === null || _res$error3 === void 0 ? void 0 : _res$error3.code) || -32603,
          stack: ((_res$error4 = res.error) === null || _res$error4 === void 0 ? void 0 : _res$error4.stack) || "Stack trace is not available.",
          data: ((_res$error5 = res.error) === null || _res$error5 === void 0 ? void 0 : _res$error5.data) || ((_res$error6 = res.error) === null || _res$error6 === void 0 ? void 0 : _res$error6.message) || ((_res$error7 = res.error) === null || _res$error7 === void 0 ? void 0 : _res$error7.toString())
        },
        shouldIncludeStack: true
      });
      throw rpcErrors.internal(err);
    }
    return res.result;
  };
  provider.send = (req, callback) => {
    if (typeof callback !== "function") {
      throw new Error('Must provide callback to "send" method.');
    }
    engine.handle(req, callback);
  };
  // forward notifications
  if (engine.on) {
    engine.on("notification", message => {
      provider.emit("data", null, message);
    });
  }
  provider.request = async args => {
    const req = _objectSpread(_objectSpread({}, args), {}, {
      id: Math.random().toString(36).slice(2),
      jsonrpc: "2.0"
    });
    const res = await provider.sendAsync(req);
    return res;
  };
  return provider;
}
function providerFromMiddleware(middleware) {
  const engine = new JRPCEngine();
  engine.push(middleware);
  const provider = providerFromEngine(engine);
  return provider;
}
function providerAsMiddleware(provider) {
  return async (req, res, _next, end) => {
    // send request to provider
    try {
      const providerRes = await provider.sendAsync(req);
      res.result = providerRes;
      return end();
    } catch (error) {
      return end(error);
    }
  };
}

class Substream extends Duplex {
  constructor(_ref) {
    let {
      parent,
      name
    } = _ref;
    super({
      objectMode: true
    });
    _defineProperty(this, "_parent", void 0);
    _defineProperty(this, "_name", void 0);
    this._parent = parent;
    this._name = name;
  }

  /**
   * Explicitly sets read operations to a no-op.
   */
  _read() {
    return undefined;
  }

  /**
   * Called when data should be written to this writable stream.
   *
   * @param chunk - Arbitrary object to write
   * @param encoding - Encoding to use when writing payload
   * @param callback - Called when writing is complete or an error occurs
   */
  _write(chunk, _encoding, callback) {
    this._parent.push({
      name: this._name,
      data: chunk
    });
    callback();
  }
}

const IGNORE_SUBSTREAM = Symbol("IGNORE_SUBSTREAM");
class ObjectMultiplex extends Duplex {
  constructor() {
    let opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    super(_objectSpread(_objectSpread({}, opts), {}, {
      objectMode: true
    }));
    _defineProperty(this, "_substreams", void 0);
    _defineProperty(this, "getStream", void 0);
    this._substreams = {};
  }
  createStream(name) {
    // validate name
    if (!name) {
      throw new Error("ObjectMultiplex - name must not be empty");
    }
    if (this._substreams[name]) {
      throw new Error(`ObjectMultiplex - Substream for name "${name}" already exists`);
    }

    // create substream
    const substream = new Substream({
      parent: this,
      name
    });
    this._substreams[name] = substream;

    // listen for parent stream to end
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    anyStreamEnd(this, _error => substream.destroy(_error || undefined));
    return substream;
  }

  // ignore streams (dont display orphaned data warning)
  ignoreStream(name) {
    // validate name
    if (!name) {
      throw new Error("ObjectMultiplex - name must not be empty");
    }
    if (this._substreams[name]) {
      throw new Error(`ObjectMultiplex - Substream for name "${name}" already exists`);
    }
    // set
    this._substreams[name] = IGNORE_SUBSTREAM;
  }
  _read() {
    return undefined;
  }
  _write(chunk, _encoding, callback) {
    const {
      name,
      data
    } = chunk;
    if (!name) {
      window.console.warn(`ObjectMultiplex - malformed chunk without name "${chunk}"`);
      return callback();
    }

    // get corresponding substream
    const substream = this._substreams[name];
    if (!substream) {
      window.console.warn(`ObjectMultiplex - orphaned data for stream "${name}"`);
      return callback();
    }

    // push data into substream
    if (substream !== IGNORE_SUBSTREAM) {
      substream.push(data);
    }
    return callback();
  }
}

// util
function anyStreamEnd(stream, _cb) {
  const cb = once(_cb);
  eos(stream, {
    readable: false
  }, cb);
  eos(stream, {
    writable: false
  }, cb);
}
function setupMultiplex(stream) {
  const mux = new ObjectMultiplex();
  mux.getStream = function streamHelper(name) {
    if (this._substreams[name]) {
      return this._substreams[name];
    }
    return this.createStream(name);
  };
  pump(stream, mux, stream, err => {
    if (err) window.console.error(err);
  });
  return mux;
}

class PostMessageStream extends BasePostMessageStream {
  _postMessage(data) {
    let originConstraint = this._targetOrigin;
    if (typeof data === "object") {
      const dataObj = data;
      if (typeof dataObj.data === "object") {
        const dataObjData = dataObj.data;
        if (Array.isArray(dataObjData.params) && dataObjData.params.length > 0) {
          const dataObjDataParam = dataObjData.params[0];
          if (dataObjDataParam._origin) {
            originConstraint = dataObjDataParam._origin;
          }

          // add a constraint for the response
          dataObjDataParam._origin = window.location.origin;
        }
      }
    }
    this._targetWindow.postMessage({
      target: this._target,
      data
    }, originConstraint);
  }
}

export { BasePostMessageStream, EthereumProviderError, IGNORE_SUBSTREAM, JRPCEngine, JSON_RPC_SERVER_ERROR_MESSAGE, JsonRpcError, ObjectMultiplex, PostMessageStream, SafeEventEmitter, SerializableError, Substream, createAsyncMiddleware, createEngineStream, createErrorMiddleware, createIdRemapMiddleware, createLoggerMiddleware, createScaffoldMiddleware, createStreamMiddleware, dataHasCause, errorCodes, errorValues, getMessageFromCode, getRpcPromiseCallback, isObject, isPlainObject, isValidCode, isValidString, mergeMiddleware, providerAsMiddleware, providerErrors, providerFromEngine, providerFromMiddleware, rpcErrors, serializeCause, serializeError, setupMultiplex };
