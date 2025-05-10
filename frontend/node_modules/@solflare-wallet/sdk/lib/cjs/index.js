"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var web3_js_1 = require("@solana/web3.js");
var eventemitter3_1 = __importDefault(require("eventemitter3"));
var web_1 = __importDefault(require("./adapters/web"));
var iframe_1 = __importDefault(require("./adapters/iframe"));
var utils_1 = require("./utils");
var version_1 = require("./version");
var Solflare = /** @class */ (function (_super) {
    __extends(Solflare, _super);
    function Solflare(config) {
        var _this = _super.call(this) || this;
        _this._network = 'mainnet-beta';
        _this._provider = null;
        _this._iframeParams = {};
        _this._adapterInstance = null;
        _this._element = null;
        _this._iframe = null;
        _this._connectHandler = null;
        _this._flutterHandlerInterval = null;
        _this._handleEvent = function (event) {
            var _a, _b, _c, _d;
            switch (event.type) {
                case 'connect_native_web': {
                    _this._collapseIframe();
                    _this._adapterInstance = new web_1.default(_this._iframe, _this._network, ((_a = event.data) === null || _a === void 0 ? void 0 : _a.provider) || _this._provider || 'https://solflare.com/provider');
                    _this._adapterInstance.on('connect', _this._webConnected);
                    _this._adapterInstance.on('disconnect', _this._webDisconnected);
                    _this._adapterInstance.connect();
                    _this._setPreferredAdapter('native_web');
                    return;
                }
                case 'connect': {
                    _this._collapseIframe();
                    _this._adapterInstance = new iframe_1.default(_this._iframe, ((_b = event.data) === null || _b === void 0 ? void 0 : _b.publicKey) || '');
                    _this._adapterInstance.connect();
                    _this._setPreferredAdapter((_c = event.data) === null || _c === void 0 ? void 0 : _c.adapter);
                    if (_this._connectHandler) {
                        _this._connectHandler.resolve();
                        _this._connectHandler = null;
                    }
                    _this.emit('connect', _this.publicKey);
                    return;
                }
                case 'disconnect': {
                    if (_this._connectHandler) {
                        _this._connectHandler.reject();
                        _this._connectHandler = null;
                    }
                    _this._disconnected();
                    _this.emit('disconnect');
                    return;
                }
                case 'accountChanged': {
                    if ((_d = event.data) === null || _d === void 0 ? void 0 : _d.publicKey) {
                        _this._adapterInstance = new iframe_1.default(_this._iframe, event.data.publicKey);
                        _this._adapterInstance.connect();
                        _this.emit('accountChanged', _this.publicKey);
                    }
                    else {
                        _this.emit('accountChanged', undefined);
                    }
                    return;
                }
                // legacy event, use resize message type instead
                case 'collapse': {
                    _this._collapseIframe();
                    return;
                }
                default: {
                    return;
                }
            }
        };
        _this._handleResize = function (data) {
            if (data.resizeMode === 'full') {
                if (data.params.mode === 'fullscreen') {
                    _this._expandIframe();
                }
                else if (data.params.mode === 'hide') {
                    _this._collapseIframe();
                }
            }
            else if (data.resizeMode === 'coordinates') {
                if (_this._iframe) {
                    _this._iframe.style.top = isFinite(data.params.top) ? "".concat(data.params.top, "px") : '';
                    _this._iframe.style.bottom = isFinite(data.params.bottom) ? "".concat(data.params.bottom, "px") : '';
                    _this._iframe.style.left = isFinite(data.params.left) ? "".concat(data.params.left, "px") : '';
                    _this._iframe.style.right = isFinite(data.params.right) ? "".concat(data.params.right, "px") : '';
                    _this._iframe.style.width = isFinite(data.params.width) ? "".concat(data.params.width, "px") : data.params.width;
                    _this._iframe.style.height = isFinite(data.params.height) ? "".concat(data.params.height, "px") : data.params.height;
                }
            }
        };
        _this._handleMessage = function (event) {
            var _a;
            if (((_a = event.data) === null || _a === void 0 ? void 0 : _a.channel) !== 'solflareIframeToWalletAdapter') {
                return;
            }
            var data = event.data.data || {};
            if (data.type === 'event') {
                _this._handleEvent(data.event);
            }
            else if (data.type === 'resize') {
                _this._handleResize(data);
            }
            else if (data.type === 'response') {
                if (_this._adapterInstance) {
                    _this._adapterInstance.handleMessage(data);
                }
            }
        };
        _this._removeElement = function () {
            if (_this._flutterHandlerInterval !== null) {
                clearInterval(_this._flutterHandlerInterval);
                _this._flutterHandlerInterval = null;
            }
            if (_this._element) {
                _this._element.remove();
                _this._element = null;
            }
        };
        _this._removeDanglingElements = function () {
            var e_1, _a;
            var elements = document.getElementsByClassName('solflare-wallet-adapter-iframe');
            try {
                for (var elements_1 = __values(elements), elements_1_1 = elements_1.next(); !elements_1_1.done; elements_1_1 = elements_1.next()) {
                    var element = elements_1_1.value;
                    if (element.parentElement) {
                        element.remove();
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (elements_1_1 && !elements_1_1.done && (_a = elements_1.return)) _a.call(elements_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
        };
        _this._injectElement = function () {
            _this._removeElement();
            _this._removeDanglingElements();
            var params = __assign(__assign({}, _this._iframeParams), { cluster: _this._network || 'mainnet-beta', origin: window.location.origin || '', title: document.title || '', version: 1, sdkVersion: version_1.VERSION || 'unknown' });
            var preferredAdapter = _this._getPreferredAdapter();
            if (preferredAdapter) {
                params.adapter = preferredAdapter;
            }
            if (_this._provider) {
                params.provider = _this._provider;
            }
            var queryString = Object.keys(params)
                .map(function (key) { return "".concat(key, "=").concat(encodeURIComponent(params[key])); })
                .join('&');
            var iframeUrl = "".concat(Solflare.IFRAME_URL, "?").concat(queryString);
            _this._element = document.createElement('div');
            _this._element.className = 'solflare-wallet-adapter-iframe';
            _this._element.innerHTML = "\n      <iframe src='".concat(iframeUrl, "' referrerPolicy='strict-origin-when-cross-origin' style='position: fixed; top: 0; bottom: 0; left: 0; right: 0; width: 100%; height: 100%; border: none; border-radius: 0; z-index: 99999; color-scheme: auto;' allowtransparency='true'></iframe>\n    ");
            document.body.appendChild(_this._element);
            _this._iframe = _this._element.querySelector('iframe');
            // @ts-ignore
            window.fromFlutter = _this._handleMobileMessage;
            _this._flutterHandlerInterval = setInterval(function () {
                // @ts-ignore
                window.fromFlutter = _this._handleMobileMessage;
            }, 100);
            window.addEventListener('message', _this._handleMessage, false);
        };
        _this._collapseIframe = function () {
            if (_this._iframe) {
                _this._iframe.style.top = '';
                _this._iframe.style.right = '';
                _this._iframe.style.height = '2px';
                _this._iframe.style.width = '2px';
            }
        };
        _this._expandIframe = function () {
            if (_this._iframe) {
                _this._iframe.style.top = '0px';
                _this._iframe.style.bottom = '0px';
                _this._iframe.style.left = '0px';
                _this._iframe.style.right = '0px';
                _this._iframe.style.width = '100%';
                _this._iframe.style.height = '100%';
            }
        };
        _this._getPreferredAdapter = function () {
            if (localStorage) {
                return localStorage.getItem('solflarePreferredWalletAdapter') || null;
            }
            return null;
        };
        _this._setPreferredAdapter = function (adapter) {
            if (localStorage && adapter) {
                localStorage.setItem('solflarePreferredWalletAdapter', adapter);
            }
        };
        _this._clearPreferredAdapter = function () {
            if (localStorage) {
                localStorage.removeItem('solflarePreferredWalletAdapter');
            }
        };
        _this._webConnected = function () {
            if (_this._connectHandler) {
                _this._connectHandler.resolve();
                _this._connectHandler = null;
            }
            _this.emit('connect', _this.publicKey);
        };
        _this._webDisconnected = function () {
            if (_this._connectHandler) {
                _this._connectHandler.reject();
                _this._connectHandler = null;
            }
            _this._disconnected();
            _this.emit('disconnect');
        };
        _this._disconnected = function () {
            window.removeEventListener('message', _this._handleMessage, false);
            _this._removeElement();
            _this._clearPreferredAdapter();
            _this._adapterInstance = null;
        };
        _this._handleMobileMessage = function (data) {
            var _a, _b;
            (_b = (_a = _this._iframe) === null || _a === void 0 ? void 0 : _a.contentWindow) === null || _b === void 0 ? void 0 : _b.postMessage({
                channel: 'solflareMobileToIframe',
                data: data
            }, '*');
        };
        if (config === null || config === void 0 ? void 0 : config.network) {
            _this._network = config === null || config === void 0 ? void 0 : config.network;
        }
        if (config === null || config === void 0 ? void 0 : config.provider) {
            _this._provider = config === null || config === void 0 ? void 0 : config.provider;
        }
        if (config === null || config === void 0 ? void 0 : config.params) {
            _this._iframeParams = __assign({}, config === null || config === void 0 ? void 0 : config.params);
        }
        return _this;
    }
    Object.defineProperty(Solflare.prototype, "publicKey", {
        get: function () {
            var _a;
            return ((_a = this._adapterInstance) === null || _a === void 0 ? void 0 : _a.publicKey) || null;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Solflare.prototype, "isConnected", {
        get: function () {
            var _a;
            return !!((_a = this._adapterInstance) === null || _a === void 0 ? void 0 : _a.connected);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Solflare.prototype, "connected", {
        get: function () {
            return this.isConnected;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Solflare.prototype, "autoApprove", {
        get: function () {
            return false;
        },
        enumerable: false,
        configurable: true
    });
    Solflare.prototype.connect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.connected) {
                            return [2 /*return*/];
                        }
                        this._injectElement();
                        return [4 /*yield*/, new Promise(function (resolve, reject) {
                                _this._connectHandler = { resolve: resolve, reject: reject };
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Solflare.prototype.disconnect = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this._adapterInstance) {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this._adapterInstance.disconnect()];
                    case 1:
                        _a.sent();
                        this._disconnected();
                        this.emit('disconnect');
                        return [2 /*return*/];
                }
            });
        });
    };
    Solflare.prototype.signTransaction = function (transaction) {
        return __awaiter(this, void 0, void 0, function () {
            var serializedTransaction, signedTransaction;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.connected) {
                            throw new Error('Wallet not connected');
                        }
                        serializedTransaction = (0, utils_1.isLegacyTransactionInstance)(transaction) ?
                            Uint8Array.from(transaction.serialize({ verifySignatures: false, requireAllSignatures: false })) :
                            transaction.serialize();
                        return [4 /*yield*/, this._adapterInstance.signTransaction(serializedTransaction)];
                    case 1:
                        signedTransaction = _a.sent();
                        return [2 /*return*/, (0, utils_1.isLegacyTransactionInstance)(transaction) ? web3_js_1.Transaction.from(signedTransaction) : web3_js_1.VersionedTransaction.deserialize(signedTransaction)];
                }
            });
        });
    };
    Solflare.prototype.signAllTransactions = function (transactions) {
        return __awaiter(this, void 0, void 0, function () {
            var serializedTransactions, signedTransactions;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.connected) {
                            throw new Error('Wallet not connected');
                        }
                        serializedTransactions = transactions.map(function (transaction) {
                            return (0, utils_1.isLegacyTransactionInstance)(transaction) ?
                                Uint8Array.from(transaction.serialize({ verifySignatures: false, requireAllSignatures: false })) :
                                transaction.serialize();
                        });
                        return [4 /*yield*/, this._adapterInstance.signAllTransactions(serializedTransactions)];
                    case 1:
                        signedTransactions = _a.sent();
                        if (signedTransactions.length !== transactions.length) {
                            throw new Error('Failed to sign all transactions');
                        }
                        return [2 /*return*/, signedTransactions.map(function (signedTransaction, index) {
                                return (0, utils_1.isLegacyTransactionInstance)(transactions[index]) ? web3_js_1.Transaction.from(signedTransaction) : web3_js_1.VersionedTransaction.deserialize(signedTransaction);
                            })];
                }
            });
        });
    };
    Solflare.prototype.signAndSendTransaction = function (transaction, options) {
        return __awaiter(this, void 0, void 0, function () {
            var serializedTransaction;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.connected) {
                            throw new Error('Wallet not connected');
                        }
                        serializedTransaction = (0, utils_1.isLegacyTransactionInstance)(transaction) ? transaction.serialize({ verifySignatures: false, requireAllSignatures: false }) : transaction.serialize();
                        return [4 /*yield*/, this._adapterInstance.signAndSendTransaction(serializedTransaction, options)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Solflare.prototype.signMessage = function (data, display) {
        if (display === void 0) { display = 'utf8'; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.connected) {
                            throw new Error('Wallet not connected');
                        }
                        return [4 /*yield*/, this._adapterInstance.signMessage(data, display)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Solflare.prototype.sign = function (data, display) {
        if (display === void 0) { display = 'utf8'; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.signMessage(data, display)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Solflare.prototype.detectWallet = function (timeout) {
        var _a;
        if (timeout === void 0) { timeout = 10; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_b) {
                if (window.SolflareApp || ((_a = window.solflare) === null || _a === void 0 ? void 0 : _a.isSolflare)) {
                    return [2 /*return*/, true];
                }
                return [2 /*return*/, new Promise(function (resolve) {
                        var pollInterval, pollTimeout;
                        pollInterval = setInterval(function () {
                            var _a;
                            if (window.SolflareApp || ((_a = window.solflare) === null || _a === void 0 ? void 0 : _a.isSolflare)) {
                                clearInterval(pollInterval);
                                clearTimeout(pollTimeout);
                                resolve(true);
                            }
                        }, 500);
                        pollTimeout = setTimeout(function () {
                            clearInterval(pollInterval);
                            resolve(false);
                        }, timeout * 1000);
                    })];
            });
        });
    };
    Solflare.IFRAME_URL = 'https://connect.solflare.com/';
    return Solflare;
}(eventemitter3_1.default));
exports.default = Solflare;
