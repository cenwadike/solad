import loglevel from 'loglevel';
import { ObliviousSet } from 'oblivious-set';
import { io } from 'socket.io-client';
import { getPublic, sign } from '@toruslabs/eccrypto';
import { keccak256, encryptData, decryptData } from '@toruslabs/metadata-helpers';

// import Bowser from 'bowser';

/**
 * returns true if the given object is a promise
 */
function isPromise(obj) {
  if (obj && typeof obj.then === 'function') {
    return true;
  } else {
    return false;
  }
}
Promise.resolve(false);
Promise.resolve(true);
const PROMISE_RESOLVED_VOID = Promise.resolve();
function sleep(time, resolveWith) {
  if (!time) time = 0;
  return new Promise(res => setTimeout(() => res(resolveWith), time));
}
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * https://stackoverflow.com/a/8084248
 */
function randomToken() {
  return Math.random().toString(36).substring(2);
}
let lastMs = 0;

/**
 * returns the current time in micro-seconds,
 * WARNING: This is a pseudo-function
 * Performance.now is not reliable in webworkers, so we just make sure to never return the same time.
 * This is enough in browsers, and this function will not be used in nodejs.
 * The main reason for this hack is to ensure that BroadcastChannel behaves equal to production when it is used in fast-running unit tests.
 */
function microSeconds$5() {
  let ret = Date.now() * 1000; // milliseconds to microseconds
  if (ret <= lastMs) {
    ret = lastMs + 1;
  }
  lastMs = ret;
  return ret;
}

// the problem is only in iframes. we should default to server in case of iframes.
// storage scoping is present in all browsers now
// Safari and other browsers support native Broadcast channel now. It's in LS.
// test here: https://pubkey.github.io/broadcast-channel/e2e.html?methodType=native
// https://caniuse.com/broadcastchannel
// export function are3PCSupported() {
//     if (typeof navigator === 'undefined') return false;
//     const browserInfo = Bowser.parse(navigator.userAgent);
//     log.info(JSON.stringify(browserInfo), 'current browser info');

//     let thirdPartyCookieSupport = true;
//     // brave
//     if (navigator.brave) {
//         thirdPartyCookieSupport = false;
//     }
//     // All webkit & gecko engine instances use itp (intelligent tracking prevention -
//     // https://webkit.org/tracking-prevention/#intelligent-tracking-prevention-itp)
//     if (browserInfo.engine.name === Bowser.ENGINE_MAP.WebKit || browserInfo.engine.name === Bowser.ENGINE_MAP.Gecko) {
//         thirdPartyCookieSupport = false;
//     }

//     return thirdPartyCookieSupport;
// }

const log = loglevel.getLogger('broadcast-channel');
log.setLevel('error');

const microSeconds$4 = microSeconds$5;
const type$4 = 'native';
function create$4(channelName) {
  const state = {
    time: microSeconds$5(),
    messagesCallback: null,
    bc: new BroadcastChannel(channelName),
    subFns: [] // subscriberFunctions
  };
  state.bc.onmessage = msg => {
    if (state.messagesCallback) {
      state.messagesCallback(msg.data);
    }
  };
  return state;
}
function close$4(channelState) {
  channelState.bc.close();
  channelState.subFns = [];
}
function postMessage$4(channelState, messageJson) {
  try {
    channelState.bc.postMessage(messageJson, false);
    return PROMISE_RESOLVED_VOID;
  } catch (err) {
    return Promise.reject(err);
  }
}
function onMessage$4(channelState, fn) {
  channelState.messagesCallback = fn;
}
function canBeUsed$4() {
  /**
   * in the electron-renderer, isNode will be true even if we are in browser-context
   * so we also check if window is undefined
   */
  if (typeof window === 'undefined') return false;
  if (typeof BroadcastChannel === 'function') {
    if (BroadcastChannel._pubkey) {
      throw new Error('BroadcastChannel: Do not overwrite window.BroadcastChannel with this module, this is not a polyfill');
    }
    return true;
  } else return false;
}
function averageResponseTime$4() {
  return 150;
}
var NativeMethod = {
  create: create$4,
  close: close$4,
  onMessage: onMessage$4,
  postMessage: postMessage$4,
  canBeUsed: canBeUsed$4,
  type: type$4,
  averageResponseTime: averageResponseTime$4,
  microSeconds: microSeconds$4
};

function fillOptionsWithDefaults() {
  let originalOptions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  const options = JSON.parse(JSON.stringify(originalOptions));

  // main
  if (typeof options.webWorkerSupport === 'undefined') options.webWorkerSupport = true;

  // indexed-db
  if (!options.idb) options.idb = {};
  //  after this time the messages get deleted
  if (!options.idb.ttl) options.idb.ttl = 1000 * 45;
  if (!options.idb.fallbackInterval) options.idb.fallbackInterval = 150;
  //  handles abrupt db onclose events.
  if (originalOptions.idb && typeof originalOptions.idb.onclose === 'function') options.idb.onclose = originalOptions.idb.onclose;

  // localstorage
  if (!options.localstorage) options.localstorage = {};
  if (!options.localstorage.removeTimeout) options.localstorage.removeTimeout = 1000 * 60;

  // server
  if (!options.server) options.server = {};
  if (!options.server.url) options.server.url = 'https://session.web3auth.io';
  if (!options.server.removeTimeout) options.server.removeTimeout = 1000 * 60 * 5; // 5 minutes

  // custom methods
  if (originalOptions.methods) options.methods = originalOptions.methods;
  return options;
}

/**
 * this method uses indexeddb to store the messages
 * There is currently no observerAPI for idb
 * @link https://github.com/w3c/IndexedDB/issues/51
 *
 * When working on this, ensure to use these performance optimizations:
 * @link https://rxdb.info/slow-indexeddb.html
 */

const microSeconds$3 = microSeconds$5;
const DB_PREFIX = 'pubkey.broadcast-channel-0-';
const OBJECT_STORE_ID = 'messages';

/**
 * Use relaxed durability for faster performance on all transactions.
 * @link https://nolanlawson.com/2021/08/22/speeding-up-indexeddb-reads-and-writes/
 */
const TRANSACTION_SETTINGS = {
  durability: 'relaxed'
};
const type$3 = 'idb';
function getIdb() {
  if (typeof indexedDB !== 'undefined') return indexedDB;
  if (typeof window !== 'undefined') {
    if (typeof window.mozIndexedDB !== 'undefined') return window.mozIndexedDB;
    if (typeof window.webkitIndexedDB !== 'undefined') return window.webkitIndexedDB;
    if (typeof window.msIndexedDB !== 'undefined') return window.msIndexedDB;
  }
  return false;
}

/**
 * If possible, we should explicitly commit IndexedDB transactions
 * for better performance.
 * @link https://nolanlawson.com/2021/08/22/speeding-up-indexeddb-reads-and-writes/
 */
function commitIndexedDBTransaction(tx) {
  if (tx.commit) {
    tx.commit();
  }
}
function createDatabase(channelName) {
  const IndexedDB = getIdb();

  // create table
  const dbName = DB_PREFIX + channelName;

  /**
   * All IndexedDB databases are opened without version
   * because it is a bit faster, especially on firefox
   * @link http://nparashuram.com/IndexedDB/perf/#Open%20Database%20with%20version
   */
  const openRequest = IndexedDB.open(dbName);
  openRequest.onupgradeneeded = ev => {
    const db = ev.target.result;
    db.createObjectStore(OBJECT_STORE_ID, {
      keyPath: 'id',
      autoIncrement: true
    });
  };
  const dbPromise = new Promise((res, rej) => {
    openRequest.onerror = ev => rej(ev);
    openRequest.onsuccess = () => {
      res(openRequest.result);
    };
  });
  return dbPromise;
}

/**
 * writes the new message to the database
 * so other readers can find it
 */
function writeMessage(db, readerUuid, messageJson) {
  const time = Date.now();
  const writeObject = {
    uuid: readerUuid,
    time,
    data: messageJson
  };
  const tx = db.transaction([OBJECT_STORE_ID], 'readwrite', TRANSACTION_SETTINGS);
  return new Promise((res, rej) => {
    tx.oncomplete = () => res();
    tx.onerror = ev => rej(ev);
    const objectStore = tx.objectStore(OBJECT_STORE_ID);
    objectStore.add(writeObject);
    commitIndexedDBTransaction(tx);
  });
}
function getAllMessages(db) {
  const tx = db.transaction(OBJECT_STORE_ID, 'readonly', TRANSACTION_SETTINGS);
  const objectStore = tx.objectStore(OBJECT_STORE_ID);
  const ret = [];
  return new Promise(res => {
    objectStore.openCursor().onsuccess = ev => {
      const cursor = ev.target.result;
      if (cursor) {
        ret.push(cursor.value);
        //alert("Name for SSN " + cursor.key + " is " + cursor.value.name);
        cursor.continue();
      } else {
        commitIndexedDBTransaction(tx);
        res(ret);
      }
    };
  });
}
function getMessagesHigherThan(db, lastCursorId) {
  const tx = db.transaction(OBJECT_STORE_ID, 'readonly', TRANSACTION_SETTINGS);
  const objectStore = tx.objectStore(OBJECT_STORE_ID);
  const ret = [];
  let keyRangeValue = IDBKeyRange.bound(lastCursorId + 1, Infinity);

  /**
   * Optimization shortcut,
   * if getAll() can be used, do not use a cursor.
   * @link https://rxdb.info/slow-indexeddb.html
   */
  if (objectStore.getAll) {
    const getAllRequest = objectStore.getAll(keyRangeValue);
    return new Promise((res, rej) => {
      getAllRequest.onerror = err => rej(err);
      getAllRequest.onsuccess = function (e) {
        res(e.target.result);
      };
    });
  }
  function openCursor() {
    // Occasionally Safari will fail on IDBKeyRange.bound, this
    // catches that error, having it open the cursor to the first
    // item. When it gets data it will advance to the desired key.
    try {
      keyRangeValue = IDBKeyRange.bound(lastCursorId + 1, Infinity);
      return objectStore.openCursor(keyRangeValue);
    } catch (e) {
      return objectStore.openCursor();
    }
  }
  return new Promise((res, rej) => {
    const openCursorRequest = openCursor();
    openCursorRequest.onerror = err => rej(err);
    openCursorRequest.onsuccess = ev => {
      const cursor = ev.target.result;
      if (cursor) {
        if (cursor.value.id < lastCursorId + 1) {
          cursor.continue(lastCursorId + 1);
        } else {
          ret.push(cursor.value);
          cursor.continue();
        }
      } else {
        commitIndexedDBTransaction(tx);
        res(ret);
      }
    };
  });
}
function removeMessagesById(db, ids) {
  const tx = db.transaction([OBJECT_STORE_ID], 'readwrite', TRANSACTION_SETTINGS);
  const objectStore = tx.objectStore(OBJECT_STORE_ID);
  return Promise.all(ids.map(id => {
    const deleteRequest = objectStore.delete(id);
    return new Promise(res => {
      deleteRequest.onsuccess = () => res();
    });
  }));
}
function getOldMessages(db, ttl) {
  const olderThen = Date.now() - ttl;
  const tx = db.transaction(OBJECT_STORE_ID, 'readonly', TRANSACTION_SETTINGS);
  const objectStore = tx.objectStore(OBJECT_STORE_ID);
  const ret = [];
  return new Promise(res => {
    objectStore.openCursor().onsuccess = ev => {
      const cursor = ev.target.result;
      if (cursor) {
        const msgObk = cursor.value;
        if (msgObk.time < olderThen) {
          ret.push(msgObk);
          //alert("Name for SSN " + cursor.key + " is " + cursor.value.name);
          cursor.continue();
        } else {
          // no more old messages,
          commitIndexedDBTransaction(tx);
          res(ret);
          return;
        }
      } else {
        res(ret);
      }
    };
  });
}
function cleanOldMessages(db, ttl) {
  return getOldMessages(db, ttl).then(tooOld => {
    return removeMessagesById(db, tooOld.map(msg => msg.id));
  });
}
function create$3(channelName, options) {
  options = fillOptionsWithDefaults(options);
  return createDatabase(channelName).then(db => {
    const state = {
      closed: false,
      lastCursorId: 0,
      channelName,
      options,
      uuid: randomToken(),
      /**
       * emittedMessagesIds
       * contains all messages that have been emitted before
       * @type {ObliviousSet}
       */
      eMIs: new ObliviousSet(options.idb.ttl * 2),
      // ensures we do not read messages in parrallel
      writeBlockPromise: PROMISE_RESOLVED_VOID,
      messagesCallback: null,
      readQueuePromises: [],
      db,
      time: microSeconds$5()
    };

    /**
     * Handle abrupt closes that do not originate from db.close().
     * This could happen, for example, if the underlying storage is
     * removed or if the user clears the database in the browser's
     * history preferences.
     */
    db.onclose = function () {
      state.closed = true;
      if (options.idb.onclose) options.idb.onclose();
    };

    /**
     * if service-workers are used,
     * we have no 'storage'-event if they post a message,
     * therefore we also have to set an interval
     */
    _readLoop(state);
    return state;
  });
}
function _readLoop(state) {
  if (state.closed) return;
  readNewMessages(state).then(() => sleep(state.options.idb.fallbackInterval)).then(() => _readLoop(state));
}
function _filterMessage(msgObj, state) {
  if (msgObj.uuid === state.uuid) return false; // send by own
  if (state.eMIs.has(msgObj.id)) return false; // already emitted
  if (msgObj.data.time < state.messagesCallbackTime) return false; // older then onMessageCallback
  return true;
}

/**
 * reads all new messages from the database and emits them
 */
function readNewMessages(state) {
  // channel already closed
  if (state.closed) return PROMISE_RESOLVED_VOID;

  // if no one is listening, we do not need to scan for new messages
  if (!state.messagesCallback) return PROMISE_RESOLVED_VOID;
  return getMessagesHigherThan(state.db, state.lastCursorId).then(newerMessages => {
    const useMessages = newerMessages
    /**
     * there is a bug in iOS where the msgObj can be undefined some times
     * so we filter them out
     * @link https://github.com/pubkey/broadcast-channel/issues/19
     */.filter(msgObj => !!msgObj).map(msgObj => {
      if (msgObj.id > state.lastCursorId) {
        state.lastCursorId = msgObj.id;
      }
      return msgObj;
    }).filter(msgObj => _filterMessage(msgObj, state)).sort((msgObjA, msgObjB) => msgObjA.time - msgObjB.time); // sort by time
    useMessages.forEach(msgObj => {
      if (state.messagesCallback) {
        state.eMIs.add(msgObj.id);
        state.messagesCallback(msgObj.data);
      }
    });
    return PROMISE_RESOLVED_VOID;
  });
}
function close$3(channelState) {
  channelState.closed = true;
  channelState.db.close();
}
function postMessage$3(channelState, messageJson) {
  channelState.writeBlockPromise = channelState.writeBlockPromise.then(() => writeMessage(channelState.db, channelState.uuid, messageJson)).then(() => {
    if (randomInt(0, 10) === 0) {
      /* await (do not await) */
      cleanOldMessages(channelState.db, channelState.options.idb.ttl);
    }
  });
  return channelState.writeBlockPromise;
}
function onMessage$3(channelState, fn, time) {
  channelState.messagesCallbackTime = time;
  channelState.messagesCallback = fn;
  readNewMessages(channelState);
}
function canBeUsed$3() {
  const idb = getIdb();
  if (!idb) return false;
  return true;
}
function averageResponseTime$3(options) {
  return options.idb.fallbackInterval * 2;
}
var IndexeDbMethod = {
  getIdb,
  createDatabase,
  create: create$3,
  close: close$3,
  onMessage: onMessage$3,
  postMessage: postMessage$3,
  canBeUsed: canBeUsed$3,
  type: type$3,
  averageResponseTime: averageResponseTime$3,
  microSeconds: microSeconds$3,
  writeMessage,
  getAllMessages,
  cleanOldMessages,
  getMessagesHigherThan,
  getOldMessages
};

/**
 * A localStorage-only method which uses localstorage and its 'storage'-event
 * This does not work inside of webworkers because they have no access to locastorage
 * This is basically implemented to support IE9 or your grandmothers toaster.
 * @link https://caniuse.com/#feat=namevalue-storage
 * @link https://caniuse.com/#feat=indexeddb
 */

const microSeconds$2 = microSeconds$5;
const KEY_PREFIX$1 = 'pubkey.broadcastChannel-';
const type$2 = 'localstorage';

/**
 * copied from crosstab
 * @link https://github.com/tejacques/crosstab/blob/master/src/crosstab.js#L32
 */
function getLocalStorage() {
  let localStorage;
  if (typeof window === 'undefined') return null;
  try {
    localStorage = window.localStorage;
    localStorage = window['ie8-eventlistener/storage'] || window.localStorage;
  } catch (e) {
    // New versions of Firefox throw a Security exception
    // if cookies are disabled. See
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1028153
  }
  return localStorage;
}
function storageKey$1(channelName) {
  return KEY_PREFIX$1 + channelName;
}

/**
 * writes the new message to the storage
 * and fires the storage-event so other readers can find it
 */
function postMessage$2(channelState, messageJson) {
  return new Promise(res => {
    sleep().then(() => {
      const key = storageKey$1(channelState.channelName);
      const writeObj = {
        token: randomToken(),
        time: Date.now(),
        data: messageJson,
        uuid: channelState.uuid
      };
      const value = JSON.stringify(writeObj);
      getLocalStorage().setItem(key, value);

      /**
       * StorageEvent does not fire the 'storage' event
       * in the window that changes the state of the local storage.
       * So we fire it manually
       */
      const ev = document.createEvent('Event');
      ev.initEvent('storage', true, true);
      ev.key = key;
      ev.newValue = value;
      window.dispatchEvent(ev);
      res();
    });
  });
}
function addStorageEventListener(channelName, fn) {
  const key = storageKey$1(channelName);
  const listener = ev => {
    if (ev.key === key) {
      fn(JSON.parse(ev.newValue));
    }
  };
  window.addEventListener('storage', listener);
  return listener;
}
function removeStorageEventListener(listener) {
  window.removeEventListener('storage', listener);
}
function create$2(channelName, options) {
  options = fillOptionsWithDefaults(options);
  if (!canBeUsed$2()) {
    throw new Error('BroadcastChannel: localstorage cannot be used');
  }
  const uuid = randomToken();

  /**
   * eMIs
   * contains all messages that have been emitted before
   * @type {ObliviousSet}
   */
  const eMIs = new ObliviousSet(options.localstorage.removeTimeout);
  const state = {
    channelName,
    uuid,
    time: microSeconds$5(),
    eMIs // emittedMessagesIds
  };
  state.listener = addStorageEventListener(channelName, msgObj => {
    if (!state.messagesCallback) return; // no listener
    if (msgObj.uuid === uuid) return; // own message
    if (!msgObj.token || eMIs.has(msgObj.token)) return; // already emitted
    if (msgObj.data.time && msgObj.data.time < state.messagesCallbackTime) return; // too old

    eMIs.add(msgObj.token);
    state.messagesCallback(msgObj.data);
  });
  return state;
}
function close$2(channelState) {
  removeStorageEventListener(channelState.listener);
}
function onMessage$2(channelState, fn, time) {
  channelState.messagesCallbackTime = time;
  channelState.messagesCallback = fn;
}
function canBeUsed$2() {
  const ls = getLocalStorage();
  if (!ls) return false;
  try {
    const key = '__broadcastchannel_check';
    ls.setItem(key, 'works');
    ls.removeItem(key);
  } catch (e) {
    // Safari 10 in private mode will not allow write access to local
    // storage and fail with a QuotaExceededError. See
    // https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API#Private_Browsing_Incognito_modes
    return false;
  }
  return true;
}
function averageResponseTime$2() {
  const defaultTime = 120;
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
    // safari is much slower so this time is higher
    return defaultTime * 2;
  }
  return defaultTime;
}
var LocalstorageMethod = {
  getLocalStorage,
  create: create$2,
  close: close$2,
  onMessage: onMessage$2,
  postMessage: postMessage$2,
  canBeUsed: canBeUsed$2,
  type: type$2,
  averageResponseTime: averageResponseTime$2,
  microSeconds: microSeconds$2,
  storageKey: storageKey$1,
  addStorageEventListener,
  removeStorageEventListener
};

/**
 * A localStorage-only method which uses localstorage and its 'storage'-event
 * This does not work inside of webworkers because they have no access to locastorage
 * This is basically implemented to support IE9 or your grandmothers toaster.
 * @link https://caniuse.com/#feat=namevalue-storage
 * @link https://caniuse.com/#feat=indexeddb
 */

const microSeconds$1 = microSeconds$5;
const KEY_PREFIX = 'pubkey.broadcastChannel-';
const type$1 = 'server';
let SOCKET_CONN_INSTANCE = null;
// used to decide to reconnect socket e.g. when socket connection is disconnected unexpectedly
const runningChannels = new Set();
function storageKey(channelName) {
  return KEY_PREFIX + channelName;
}

/**
 * writes the new message to the storage
 * and fires the storage-event so other readers can find it
 */
function postMessage$1(channelState, messageJson) {
  return new Promise((res, rej) => {
    sleep().then(async () => {
      const key = storageKey(channelState.channelName);
      const channelEncPrivKey = keccak256(Buffer.from(key, 'utf8'));
      const encData = await encryptData(channelEncPrivKey.toString('hex'), {
        token: randomToken(),
        time: Date.now(),
        data: messageJson,
        uuid: channelState.uuid
      });
      const body = {
        sameOriginCheck: true,
        sameIpCheck: true,
        key: getPublic(channelEncPrivKey).toString('hex'),
        data: encData,
        signature: (await sign(channelEncPrivKey, keccak256(Buffer.from(encData, 'utf8')))).toString('hex')
      };
      if (channelState.timeout) body.timeout = channelState.timeout;
      return fetch(channelState.serverUrl + '/channel/set', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        }
      }).then(res).catch(rej);
    });
  });
}
function getSocketInstance(serverUrl) {
  if (SOCKET_CONN_INSTANCE) {
    return SOCKET_CONN_INSTANCE;
  }
  const SOCKET_CONN = io(serverUrl, {
    transports: ['websocket', 'polling'],
    // use WebSocket first, if available
    withCredentials: true,
    reconnectionDelayMax: 10000,
    reconnectionAttempts: 10
  });
  SOCKET_CONN.on('connect_error', err => {
    // revert to classic upgrade
    SOCKET_CONN.io.opts.transports = ['polling', 'websocket'];
    log.error('connect error', err);
  });
  SOCKET_CONN.on('connect', async () => {
    const {
      engine
    } = SOCKET_CONN.io;
    log.debug('initially connected to', engine.transport.name); // in most cases, prints "polling"
    engine.once('upgrade', () => {
      // called when the transport is upgraded (i.e. from HTTP long-polling to WebSocket)
      log.debug('upgraded', engine.transport.name); // in most cases, prints "websocket"
    });
    engine.once('close', reason => {
      // called when the underlying connection is closed
      log.debug('connection closed', reason);
    });
  });
  SOCKET_CONN.on('error', err => {
    log.error('socket errored', err);
    SOCKET_CONN.disconnect();
  });
  SOCKET_CONN_INSTANCE = SOCKET_CONN;
  return SOCKET_CONN;
}
function setupSocketConnection(serverUrl, channelState, fn) {
  const socketConn = getSocketInstance(serverUrl);
  const key = storageKey(channelState.channelName);
  const channelEncPrivKey = keccak256(Buffer.from(key, 'utf8'));
  const channelPubKey = getPublic(channelEncPrivKey).toString('hex');
  if (socketConn.connected) {
    socketConn.emit('check_auth_status', channelPubKey, {
      sameOriginCheck: true,
      sameIpCheck: true
    });
  } else {
    socketConn.once('connect', () => {
      log.debug('connected with socket');
      socketConn.emit('check_auth_status', channelPubKey, {
        sameOriginCheck: true,
        sameIpCheck: true
      });
    });
  }
  const reconnect = () => {
    socketConn.once('connect', async () => {
      if (runningChannels.has(channelState.channelName)) {
        socketConn.emit('check_auth_status', channelPubKey, {
          sameOriginCheck: true,
          sameIpCheck: true
        });
      }
    });
  };
  const visibilityListener = () => {
    // if channel is closed, then remove the listener.
    if (!socketConn || !runningChannels.has(channelState.channelName)) {
      document.removeEventListener('visibilitychange', visibilityListener);
      return;
    }
    // if not connected, then wait for connection and ping server for latest msg.
    if (!socketConn.connected && document.visibilityState === 'visible') {
      reconnect();
    }
  };
  const listener = async ev => {
    try {
      const decData = await decryptData(channelEncPrivKey.toString('hex'), ev);
      log.info(decData);
      fn(decData);
    } catch (error) {
      log.error(error);
    }
  };
  socketConn.on('disconnect', () => {
    log.debug('socket disconnected');
    if (runningChannels.has(channelState.channelName)) {
      log.error('socket disconnected unexpectedly, reconnecting socket');
      reconnect();
    }
  });
  socketConn.on(`${channelPubKey}_success`, listener);
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', visibilityListener);
  return socketConn;
}
function create$1(channelName, options) {
  options = fillOptionsWithDefaults(options);
  const uuid = randomToken();

  /**
   * eMIs
   * contains all messages that have been emitted before
   * @type {ObliviousSet}
   */
  const eMIs = new ObliviousSet(options.server.removeTimeout);
  const state = {
    channelName,
    uuid,
    eMIs,
    // emittedMessagesIds
    serverUrl: options.server.url,
    time: microSeconds$5()
  };
  if (options.server.timeout) state.timeout = options.server.timeout;
  setupSocketConnection(options.server.url, state, msgObj => {
    if (!state.messagesCallback) return; // no listener
    if (msgObj.uuid === state.uuid) return; // own message
    if (!msgObj.token || state.eMIs.has(msgObj.token)) return; // already emitted
    // if (msgObj.data.time && msgObj.data.time < state.messagesCallbackTime) return; // too old

    state.eMIs.add(msgObj.token);
    state.messagesCallback(msgObj.data);
  });
  runningChannels.add(channelName);
  return state;
}
function close$1(channelState) {
  runningChannels.delete(channelState.channelName);
  // give 2 sec for all msgs which are in transit to be consumed
  // by receiver.
  // window.setTimeout(() => {
  //     removeStorageEventListener(channelState);
  //     SOCKET_CONN_INSTANCE = null;
  // }, 1000);
}
function onMessage$1(channelState, fn, time) {
  channelState.messagesCallbackTime = time;
  channelState.messagesCallback = fn;
}
function canBeUsed$1() {
  return true;
}
function averageResponseTime$1() {
  const defaultTime = 500;
  // TODO: Maybe increase it based on operation
  return defaultTime;
}
var ServerMethod = {
  create: create$1,
  close: close$1,
  onMessage: onMessage$1,
  postMessage: postMessage$1,
  canBeUsed: canBeUsed$1,
  type: type$1,
  averageResponseTime: averageResponseTime$1,
  microSeconds: microSeconds$1
};

const microSeconds = microSeconds$5;
const type = 'simulate';
const SIMULATE_CHANNELS = new Set();
const SIMULATE_DELAY_TIME = 5;
function create(channelName) {
  const state = {
    time: microSeconds$5(),
    name: channelName,
    messagesCallback: null
  };
  SIMULATE_CHANNELS.add(state);
  return state;
}
function close(channelState) {
  SIMULATE_CHANNELS.delete(channelState);
}
function postMessage(channelState, messageJson) {
  return new Promise(res => setTimeout(() => {
    const channelArray = Array.from(SIMULATE_CHANNELS);
    channelArray.forEach(channel => {
      if (channel.name === channelState.name &&
      // has same name
      channel !== channelState &&
      // not own channel
      !!channel.messagesCallback &&
      // has subscribers
      channel.time < messageJson.time // channel not created after postMessage() call
      ) {
        channel.messagesCallback(messageJson);
      }
    });
    res();
  }, SIMULATE_DELAY_TIME));
}
function onMessage(channelState, fn) {
  channelState.messagesCallback = fn;
}
function canBeUsed() {
  return true;
}
function averageResponseTime() {
  return SIMULATE_DELAY_TIME;
}
var SimulateMethod = {
  create,
  close,
  onMessage,
  postMessage,
  canBeUsed,
  type,
  averageResponseTime,
  microSeconds
};

// order is important
const METHODS = [NativeMethod,
// fastest
IndexeDbMethod, LocalstorageMethod, ServerMethod];
function chooseMethod(options) {
  let chooseMethods = [].concat(options.methods, METHODS).filter(Boolean);

  // directly chosen
  if (options.type) {
    if (options.type === 'simulate') {
      // only use simulate-method if directly chosen
      return SimulateMethod;
    }
    const ret = chooseMethods.find(m => m.type === options.type);
    if (!ret) throw new Error('method-type ' + options.type + ' not found');else return ret;
  }

  /**
   * if no webworker support is needed,
   * remove idb from the list so that localstorage is been chosen
   */
  if (!options.webWorkerSupport) {
    chooseMethods = chooseMethods.filter(m => m.type !== 'idb');
  }
  const useMethod = chooseMethods.find(method => method.canBeUsed(options));
  if (!useMethod) throw new Error(`No useable method found in ${JSON.stringify(METHODS.map(m => m.type))}`);else return useMethod;
}

/**
 * Contains all open channels,
 * used in tests to ensure everything is closed.
 */
const OPEN_BROADCAST_CHANNELS = new Set();
let lastId = 0;
const BroadcastChannel$1 = function (name, options) {
  // identifier of the channel to debug stuff
  this.id = lastId++;
  OPEN_BROADCAST_CHANNELS.add(this);
  this.name = name;
  if (ENFORCED_OPTIONS) {
    options = ENFORCED_OPTIONS;
  }
  this.options = fillOptionsWithDefaults(options);
  this.method = chooseMethod(this.options);

  // isListening
  this._iL = false;

  /**
   * _onMessageListener
   * setting onmessage twice,
   * will overwrite the first listener
   */
  this._onML = null;

  /**
   * _addEventListeners
   */
  this._addEL = {
    message: [],
    internal: []
  };

  /**
   * Unsend message promises
   * where the sending is still in progress
   * @type {Set<Promise>}
   */
  this._uMP = new Set();

  /**
   * _beforeClose
   * array of promises that will be awaited
   * before the channel is closed
   */
  this._befC = [];

  /**
   * _preparePromise
   */
  this._prepP = null;
  _prepareChannel(this);
};

// STATICS

/**
 * used to identify if someone overwrites
 * window.BroadcastChannel with this
 * See methods/native.js
 */
BroadcastChannel$1._pubkey = true;

/**
 * if set, this method is enforced,
 * no mather what the options are
 */
let ENFORCED_OPTIONS;
function enforceOptions(options) {
  ENFORCED_OPTIONS = options;
}

// PROTOTYPE
BroadcastChannel$1.prototype = {
  postMessage(msg) {
    if (this.closed) {
      throw new Error('BroadcastChannel.postMessage(): ' + 'Cannot post message after channel has closed ' +
      /**
       * In the past when this error appeared, it was realy hard to debug.
       * So now we log the msg together with the error so it at least
       * gives some clue about where in your application this happens.
       */
      JSON.stringify(msg));
    }
    return _post(this, 'message', msg);
  },
  postInternal(msg) {
    return _post(this, 'internal', msg);
  },
  set onmessage(fn) {
    const time = this.method.microSeconds();
    const listenObj = {
      time,
      fn
    };
    _removeListenerObject(this, 'message', this._onML);
    if (fn && typeof fn === 'function') {
      this._onML = listenObj;
      _addListenerObject(this, 'message', listenObj);
    } else {
      this._onML = null;
    }
  },
  addEventListener(type, fn) {
    const time = this.method.microSeconds();
    const listenObj = {
      time,
      fn
    };
    _addListenerObject(this, type, listenObj);
  },
  removeEventListener(type, fn) {
    const obj = this._addEL[type].find(obj => obj.fn === fn);
    _removeListenerObject(this, type, obj);
  },
  close() {
    if (this.closed) {
      return;
    }
    OPEN_BROADCAST_CHANNELS.delete(this);
    this.closed = true;
    const awaitPrepare = this._prepP ? this._prepP : PROMISE_RESOLVED_VOID;
    this._onML = null;
    this._addEL.message = [];
    return awaitPrepare
    // wait until all current sending are processed
    .then(() => Promise.all(Array.from(this._uMP)))
    // run before-close hooks
    .then(() => Promise.all(this._befC.map(fn => fn())))
    // close the channel
    .then(() => this.method.close(this._state));
  },
  get type() {
    return this.method.type;
  },
  get isClosed() {
    return this.closed;
  }
};

/**
 * Post a message over the channel
 * @returns {Promise} that resolved when the message sending is done
 */
function _post(broadcastChannel, type, msg) {
  const time = broadcastChannel.method.microSeconds();
  const msgObj = {
    time,
    type,
    data: msg
  };
  const awaitPrepare = broadcastChannel._prepP ? broadcastChannel._prepP : PROMISE_RESOLVED_VOID;
  return awaitPrepare.then(() => {
    const sendPromise = broadcastChannel.method.postMessage(broadcastChannel._state, msgObj);

    // add/remove to unsend messages list
    broadcastChannel._uMP.add(sendPromise);
    sendPromise.catch().then(() => broadcastChannel._uMP.delete(sendPromise));
    return sendPromise;
  });
}
function _prepareChannel(channel) {
  const maybePromise = channel.method.create(channel.name, channel.options);
  if (isPromise(maybePromise)) {
    channel._prepP = maybePromise;
    maybePromise.then(s => {
      // used in tests to simulate slow runtime
      /*if (channel.options.prepareDelay) {
           await new Promise(res => setTimeout(res, this.options.prepareDelay));
      }*/
      channel._state = s;
    });
  } else {
    channel._state = maybePromise;
  }
}
function _hasMessageListeners(channel) {
  if (channel._addEL.message.length > 0) return true;
  if (channel._addEL.internal.length > 0) return true;
  return false;
}
function _addListenerObject(channel, type, obj) {
  channel._addEL[type].push(obj);
  _startListening(channel);
}
function _removeListenerObject(channel, type, obj) {
  channel._addEL[type] = channel._addEL[type].filter(o => o !== obj);
  _stopListening(channel);
}
function _startListening(channel) {
  if (!channel._iL && _hasMessageListeners(channel)) {
    // someone is listening, start subscribing

    const listenerFn = msgObj => {
      channel._addEL[msgObj.type].forEach(listenerObject => {
        /**
         * Getting the current time in JavaScript has no good precision.
         * So instead of only listening to events that happend 'after' the listener
         * was added, we also listen to events that happended 100ms before it.
         * This ensures that when another process, like a WebWorker, sends events
         * we do not miss them out because their timestamp is a bit off compared to the main process.
         * Not doing this would make messages missing when we send data directly after subscribing and awaiting a response.
         * @link https://johnresig.com/blog/accuracy-of-javascript-time/
         */
        // const hundredMsInMicro = 100 * 1000;
        // const minMessageTime = listenerObject.time - hundredMsInMicro;

        if (msgObj.time >= listenerObject.time) {
          listenerObject.fn(msgObj.data);
        } else if (channel.method.type === 'server') {
          // server msg might lag based on connection.
          listenerObject.fn(msgObj.data);
        }
      });
    };
    const time = channel.method.microSeconds();
    if (channel._prepP) {
      channel._prepP.then(() => {
        channel._iL = true;
        channel.method.onMessage(channel._state, listenerFn, time);
      });
    } else {
      channel._iL = true;
      channel.method.onMessage(channel._state, listenerFn, time);
    }
  }
}
function _stopListening(channel) {
  if (channel._iL && !_hasMessageListeners(channel)) {
    // noone is listening, stop subscribing
    channel._iL = false;
    const time = channel.method.microSeconds();
    channel.method.onMessage(channel._state, null, time);
  }
}

export { BroadcastChannel$1 as BroadcastChannel, IndexeDbMethod as IndexedDbMethod, LocalstorageMethod as LocalStorageMethod, NativeMethod, OPEN_BROADCAST_CHANNELS, ServerMethod, chooseMethod, enforceOptions };
