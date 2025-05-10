var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// package.json
var package_exports = {};
__export(package_exports, {
  default: () => package_default,
  dependencies: () => dependencies,
  devDependencies: () => devDependencies,
  files: () => files,
  gitHead: () => gitHead,
  license: () => license,
  main: () => main,
  module: () => module,
  name: () => name,
  peerDependencies: () => peerDependencies,
  publishConfig: () => publishConfig,
  scripts: () => scripts,
  type: () => type,
  types: () => types,
  version: () => version
});
var name, version, files, type, main, module, types, license, publishConfig, dependencies, peerDependencies, devDependencies, scripts, gitHead, package_default;
var init_package = __esm({
  "package.json"() {
    name = "@particle-network/solana-wallet";
    version = "1.3.2";
    files = [
      "es",
      "lib",
      "LICENSE"
    ];
    type = "module";
    main = "lib/index.js";
    module = "es/index.js";
    types = "lib/types/index.d.ts";
    license = "Apache-2.0";
    publishConfig = {
      access: "public"
    };
    dependencies = {
      "@particle-network/auth": "^1.3.1"
    };
    peerDependencies = {
      "@solana/web3.js": "^1.50.1",
      bs58: "^4.0.1"
    };
    devDependencies = {
      "@solana/web3.js": "^1.50.1",
      "@types/bs58": "^4.0.1",
      bs58: "^4.0.1",
      "ts-loader": "^9.3.1",
      "webpack-cli": "^4.10.0"
    };
    scripts = {
      clean: "shx rm -rf lib/* && shx rm -rf es/*",
      package: `shx echo '{ "type": "commonjs" }' > lib/package.json`,
      build: "yarn clean && node ./esBuild.js && tsc --emitDeclarationOnly -p tsconfig.json && yarn package",
      "build:min.js": "webpack",
      version: "yarn build"
    };
    gitHead = "cc999e430ebfb1dd821783f7cf099ddd51f3495a";
    package_default = {
      name,
      version,
      files,
      type,
      main,
      module,
      types,
      license,
      publishConfig,
      dependencies,
      peerDependencies,
      devDependencies,
      scripts,
      gitHead
    };
  }
});

// src/solana-wallet.ts
import { rpcUrl } from "@particle-network/auth";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import bs58 from "bs58";
import { Buffer as Buffer2 } from "buffer";
import { EventEmitter } from "events";

// src/utils.ts
function getVersion() {
  const packages = (init_package(), __toCommonJS(package_exports));
  return `web_${packages.version}`;
}

// src/solana-wallet.ts
var SolanaWallet = class {
  constructor(auth) {
    this.auth = auth;
    this.isParticleNetwork = true;
    this.name = "Particle";
    this.url = "https://particle.network";
    this.icon = "https://static.particle.network/wallet-icons/Particle.png";
    this.events = new EventEmitter();
    this.auth = auth;
    this._connecting = false;
    const userInfo = this.auth.getUserInfo();
    if (userInfo) {
      const wallet = userInfo.wallets.find((w) => w.chain_name === "solana" && w.public_address.length > 0);
      if (wallet) {
        this._publicKey = new PublicKey(wallet.public_address);
      } else {
        this._publicKey = null;
      }
    } else {
      this._publicKey = null;
    }
    this.auth.on("connect", (userInfo2) => {
      const wallet = userInfo2.wallets.find((w) => w.chain_name === "solana" && w.public_address.length > 0);
      if (wallet) {
        this._publicKey = new PublicKey(wallet.public_address);
        this.events.emit("connect", this._publicKey);
      }
    });
    this.auth.on("disconnect", () => {
      this._publicKey = null;
      this.events.emit("disconnect");
    });
    if (typeof window !== "undefined" && window.particle) {
      window.particle.solanaWallet = this;
    }
  }
  get version() {
    return getVersion();
  }
  on(event, listener) {
    this.events.on(event, listener);
  }
  once(event, listener) {
    this.events.once(event, listener);
  }
  off(event, listener) {
    this.events.off(event, listener);
  }
  removeListener(event, listener) {
    this.events.removeListener(event, listener);
  }
  get connecting() {
    return this._connecting;
  }
  get connected() {
    return this._publicKey !== null;
  }
  get publicKey() {
    return this._publicKey;
  }
  connect(config) {
    return __async(this, null, function* () {
      try {
        this._connecting = true;
        let wallet = this.auth.getWallet();
        if (wallet) {
          this._publicKey = new PublicKey(wallet.public_address);
          return Promise.resolve();
        }
        yield this.auth.login(config);
        wallet = this.auth.getWallet();
        if (wallet) {
          this._publicKey = new PublicKey(wallet.public_address);
          return Promise.resolve();
        } else {
          return Promise.reject("wallet create failed");
        }
      } catch (e) {
        return Promise.reject(e);
      } finally {
        this._connecting = false;
      }
    });
  }
  disconnect() {
    return __async(this, null, function* () {
      yield this.auth.logout();
      this._publicKey = null;
      return Promise.resolve();
    });
  }
  signTransaction(transaction) {
    return __async(this, null, function* () {
      const signature = yield this.auth.sign(
        "signTransaction",
        bs58.encode(transaction.serialize({ requireAllSignatures: false, verifySignatures: false }))
      );
      return Transaction.from(Buffer2.from(signature, "base64"));
    });
  }
  signAllTransactions(transactions) {
    return __async(this, null, function* () {
      const signatures = yield this.auth.signAllTransactions(
        transactions.map(
          (tx) => bs58.encode(tx.serialize({ requireAllSignatures: false, verifySignatures: false }))
        )
      );
      return signatures.map((signed) => Transaction.from(Buffer2.from(signed, "base64")));
    });
  }
  signAndSendTransaction(transaction) {
    return __async(this, null, function* () {
      return this.auth.sendTransaction(
        bs58.encode(transaction.serialize({ requireAllSignatures: false, verifySignatures: false }))
      );
    });
  }
  signMessage(message) {
    return __async(this, null, function* () {
      const signature = yield this.auth.sign("signMessage", bs58.encode(message));
      return Buffer2.from(signature, "base64");
    });
  }
  getConnection(config) {
    const url = `${rpcUrl()}/solana`;
    return new Connection(
      `${url}?chainId=${this.auth.getChainId()}&projectUuid=${this.auth.config.projectId}&projectKey=${this.auth.config.clientKey}`,
      {
        commitment: config == null ? void 0 : config.commitment,
        wsEndpoint: config == null ? void 0 : config.wsEndpoint,
        httpHeaders: {
          Authorization: this.auth.basicCredentials()
        },
        fetch: config == null ? void 0 : config.fetch,
        fetchMiddleware: config == null ? void 0 : config.fetchMiddleware,
        disableRetryOnRateLimit: config == null ? void 0 : config.disableRetryOnRateLimit,
        confirmTransactionInitialTimeout: config == null ? void 0 : config.confirmTransactionInitialTimeout
      }
    );
  }
};

// src/index.ts
import { ParticleNetwork } from "@particle-network/auth";
export {
  ParticleNetwork,
  SolanaWallet
};
//# sourceMappingURL=index.js.map
