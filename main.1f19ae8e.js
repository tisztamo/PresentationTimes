// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"model/chain.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.me = me;
exports.setMe = setMe;
exports.recreateMe = recreateMe;
exports.createIdentity = createIdentity;
exports.getTransaction = getTransaction;
exports.simpleOutput = simpleOutput;
exports.postTransaction = postTransaction;
exports.listOutputs = listOutputs;
exports.searchAssets = searchAssets;
exports.searchMetadata = searchMetadata;
exports.populateWithAsset = populateWithAsset;
exports.synchChainTime = synchChainTime;
exports.getChainSynchedTS = getChainSynchedTS;
exports.getChainTimeMillis = getChainTimeMillis;
exports.WS_BASE_URL = exports.API_BASE_URL = void 0;
var API_BASE_URL = 'https://test.bigchaindb.com/api/v1/';
exports.API_BASE_URL = API_BASE_URL;
var WS_BASE_URL = 'wss://test.bigchaindb.com:443/api/v1/';
exports.WS_BASE_URL = WS_BASE_URL;
var conn = new BigchainDB.Connection(API_BASE_URL);
var _me = null;
loadOrCreateMe();

function me() {
  return _me;
}

function setMe(newMe) {
  _me = newMe;
  localStorage.setItem("me", JSON.stringify(newMe));
}

function recreateMe() {
  setMe(createIdentity());
}

function createIdentity() {
  return new BigchainDB.Ed25519Keypair();
}

function loadOrCreateMe() {
  if (document && document.location && document.location.search.startsWith("?keys=")) {
    var keys = document.location.search.substr("?keys=".length).split(",");
    setMe({
      publicKey: keys[0],
      privateKey: keys[1],
      tokens: null
    });
    return;
  }

  var storedMe = localStorage.getItem("me");

  if (storedMe) {
    _me = JSON.parse(storedMe);
  } else {
    recreateMe();
  }
}

function getTransaction(txId) {
  var cached = localStorage.getItem("txcache_" + txId);

  if (cached) {
    return Promise.resolve(JSON.parse(cached));
  }

  return conn.getTransaction(txId).then(function (tx) {
    if (tx && tx.id) {
      localStorage.setItem("txcache_" + tx.id, JSON.stringify(tx));
    }

    return tx;
  });
}

function simpleOutput(publicKey, amount) {
  return BigchainDB.Transaction.makeOutput(BigchainDB.Transaction.makeEd25519Condition(publicKey), amount);
}

function postTransaction(tx) {
  var txSigned = BigchainDB.Transaction.signTransaction(tx, me().privateKey);
  return conn.postTransactionCommit(txSigned);
}

function listOutputs(publicKey) {
  return conn.listOutputs(publicKey, false);
}

function searchAssets(search) {
  return conn.searchAssets(search);
}

function searchMetadata(search) {
  return conn.searchMetadata(search);
}

function populateWithAsset(transferTx) {
  if (!transferTx) {
    return null;
  }

  return getTransaction(transferTx.asset.id).then(function (assetTx) {
    assetTx.asset.id = transferTx.asset.id;
    transferTx.asset = assetTx.asset;
    return transferTx;
  });
}

function filetime_to_unixtimems(ft) {
  var epoch_diff = 116444736000000000;
  var rate_diff = 10000;
  return Math.round((ft - epoch_diff) / rate_diff);
}

var syncedTS = {
  serverTS: 0,
  clientTS: 0
};

function synchChainTime() {
  var beforeTS = Date.now();
  var clientTS = 0;
  fetch("http://worldclockapi.com/api/json/utc/now").then(function (response) {
    clientTS = Math.round((Date.now() + beforeTS) / 2);
    return response.json();
  }).then(function (data) {
    syncedTS.serverTS = filetime_to_unixtimems(Number(data.currentFileTime));
    syncedTS.clientTS = clientTS;
  });
}

synchChainTime();

function getChainSynchedTS() {
  return Date.now() - syncedTS.clientTS + syncedTS.serverTS;
}

function getChainTimeMillis() {
  return Math.round(getChainSynchedTS() / 1000);
}
},{}],"model/token.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.tokenLaunch = tokenLaunch;
exports.giveTokens = giveTokens;
exports.getOwnedTokens = getOwnedTokens;
exports.transferAllToNewIdentity = transferAllToNewIdentity;
exports.selectToken = selectToken;
exports.selectTokenById = selectTokenById;
exports.dropSelectedToken = dropSelectedToken;
exports.selectedToken = void 0;

var _chain = require("./chain.js");

var selectedToken = null;
exports.selectedToken = selectedToken;

function tokenLaunch() {
  var nTokens = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1000000;
  var creator = (0, _chain.me)();
  var tx = BigchainDB.Transaction.makeCreateTransaction({
    token: 'BPNT Time Token',
    number_tokens: nTokens
  }, {
    datetime: new Date().toString()
  }, [(0, _chain.simpleOutput)(creator.publicKey, nTokens.toString())], creator.publicKey);
  return (0, _chain.postTransaction)(tx).then(function (res) {
    selectToken({
      id: res.id,
      tokensLeft: nTokens,
      creator: creator,
      createTx: res
    });
    return selectedToken;
  });
}

function findSourceTxForAmount(txs, amount) {
  return txs.find(function (tx) {
    return Number(tx.outputs[tx.ownerOutputIdx].amount) >= amount;
  });
}

function giveTokens(token, receiverPubKey, amount) {
  var metadata = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
  return getOwnedTokens((0, _chain.me)().publicKey).then(function (ownedTokens) {
    var sourceTx = findSourceTxForAmount(ownedTokens.transactions, amount);
    var sourceAmount = Number(sourceTx.outputs[sourceTx.ownerOutputIdx].amount);

    if (sourceAmount < amount) {
      console.error("Source transaction does not contain " + amount + " tokens", sourceTx);
      return;
    }

    var remaining = sourceAmount - amount;
    var outputs = [];

    if (remaining > 0) {
      outputs.push((0, _chain.simpleOutput)((0, _chain.me)().publicKey, remaining.toString()));
    }

    outputs.push((0, _chain.simpleOutput)(receiverPubKey, amount.toString()));
    var tx = BigchainDB.Transaction.makeTransferTransaction([{
      tx: sourceTx,
      // TODO: handle multiple unspent outputs (if needed)
      output_index: sourceTx.ownerOutputIdx
    }], outputs, metadata);
    return (0, _chain.postTransaction)(tx).then(function (tx) {
      token.tokensLeft -= amount;
      selectToken(token);
      return tx;
    });
  });
} //TODO filter by token type


function getOwnedTokens(publicKey) {
  return (0, _chain.listOutputs)(publicKey).then(function (outputs) {
    return Promise.all(outputs.map(function (output) {
      return (0, _chain.getTransaction)(output.transaction_id);
    })).then(function (txs) {
      var total = 0;

      for (var i = 0; i < outputs.length; i++) {
        txs[i].ownerOutputIdx = outputs[i].output_index;
        txs[i].ownerOutput = txs[i].outputs[outputs[i].output_index];
        total += Number(txs[i].ownerOutput.amount);
      }

      return {
        total: total,
        transactions: txs
      };
    });
  });
}

function transferAllToNewIdentity() {
  var newMe = (0, _chain.createIdentity)();
  return getOwnedTokens((0, _chain.me)().publicKey).then(function (ownedTokens) {
    return giveTokens(selectedToken, newMe.publicKey, ownedTokens.total).then(function () {
      (0, _chain.setMe)(newMe);
    });
  });
}

function selectToken(token) {
  exports.selectedToken = selectedToken = token;
  saveSelectedToken();
  return token;
}

function selectTokenById(tokenId) {
  return (0, _chain.getTransaction)(tokenId).then(function (createTx) {
    return selectToken({
      createTx: createTx,
      id: createTx.id,
      creator: {
        publicKey: createTx.inputs[0].owners_before[0]
      },
      tokensLeft: 'Unknown'
    });
  });
}

function saveSelectedToken() {
  localStorage.setItem("currentToken", JSON.stringify(selectedToken));
}

function dropSelectedToken() {
  localStorage.removeItem("currentToken");
}

function loadSelectedToken() {
  var token = localStorage.getItem("currentToken");

  if (token) {
    selectToken(JSON.parse(token));
  }
}

loadSelectedToken();
},{"./chain.js":"model/chain.js"}],"model/presentation.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.findPresentations = findPresentations;
exports.createPresentation = createPresentation;
exports.startPresentation = startPresentation;
exports.grantTime = grantTime;
exports.collectedVotesDuringLastPeriod = collectedVotesDuringLastPeriod;
exports.autoGrant = autoGrant;
exports.findRunningPresentation = findRunningPresentation;
exports.voteForRunning = voteForRunning;

var _token = require("./token.js");

var _chain = require("./chain.js");

var PRESENTATION_STARTED = "presentation_started";
var PRESENTATION = "presentation";

function findPresentations() {
  return (0, _chain.searchAssets)(PRESENTATION).then(function (assets) {
    return Promise.all(assets.filter(function (asset) {
      return asset.data.token === _token.selectedToken.id;
    }).map(function (asset) {
      return (0, _chain.getTransaction)(asset.id);
    }));
  });
}

function createPresentation(presenterName, title, abstract) {
  var presenter = (0, _chain.createIdentity)();
  var creator = (0, _chain.me)();
  var presentation = {
    type: PRESENTATION,
    presenterName: presenterName,
    title: title,
    abstract: abstract,
    presenterPublicKey: presenter.publicKey,
    token: _token.selectedToken.id
  };
  var tx = BigchainDB.Transaction.makeCreateTransaction(presentation, {
    datetime: new Date().toString()
  }, [(0, _chain.simpleOutput)(creator.publicKey)], creator.publicKey);
  return (0, _chain.postTransaction)(tx);
}

function startPresentation(presentation) {
  var grantedLength = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 240;
  var timeStamp = (0, _chain.getChainTimeMillis)();
  var tx = BigchainDB.Transaction.makeTransferTransaction([{
    tx: presentation,
    output_index: 0
  }], [(0, _chain.simpleOutput)((0, _chain.me)().publicKey)], {
    state: PRESENTATION_STARTED,
    startTS: timeStamp,
    ts: timeStamp,
    token: presentation.asset.data.token,
    grantedLength: grantedLength
  });
  return (0, _chain.postTransaction)(tx);
}

function grantTime(presentation) {
  var grantedLength = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 20;
  var usedTokens = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
  var timeStamp = (0, _chain.getChainTimeMillis)();
  var tx = BigchainDB.Transaction.makeTransferTransaction([{
    tx: presentation,
    output_index: 0
  }], [(0, _chain.simpleOutput)((0, _chain.me)().publicKey)], {
    state: PRESENTATION_STARTED,
    startTS: presentation.metadata.startTS,
    ts: timeStamp,
    token: presentation.asset.data.token,
    grantedLength: Number(presentation.metadata.grantedLength) + Number(grantedLength),
    usedTokens: usedTokens
  });
  return (0, _chain.postTransaction)(tx);
}

function collectedVotesDuringLastPeriod(presentation) {
  var presenterPublicKey = presentation.asset.data.presenterPublicKey;
  return (0, _token.getOwnedTokens)(presenterPublicKey).then(function (tokens) {
    return tokens.total - (presentation.metadata.usedTokens || 0);
  });
}

function autoGrant(presentation) {
  var neededNewTokens = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
  var grantedLength = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 60;
  return collectedVotesDuringLastPeriod(presentation).then(function (tokens) {
    if (tokens >= neededNewTokens) {
      console.log("Granting " + grantedLength + " secs on " + tokens + " votes.");
      return grantTime(presentation, grantedLength, tokens + (presentation.metadata.usedTokens || 0));
    } else {
      console.log(String(tokens) + " votes are not enough...");
    }
  });
}

function findRunningPresentation() {
  return (0, _chain.searchMetadata)(PRESENTATION_STARTED).then(function (txs) {
    var filtered = txs.filter(function (tx) {
      return tx.metadata.token === _token.selectedToken.id;
    });
    var found = null;
    var maxTS = -Infinity;

    for (var i = 0; i < filtered.length; i++) {
      if (filtered[i].metadata.ts > maxTS) {
        found = filtered[i];
        maxTS = filtered[i].metadata.ts;
      }
    }

    return found && maxTS > (0, _chain.getChainTimeMillis)() - found.metadata.grantedLength ? (0, _chain.getTransaction)(found.id) : null;
  }).then(_chain.populateWithAsset);
}

function voteForRunning() {
  return findRunningPresentation().then(function (running) {
    if (!running) {
      alert("No active presentation found");
      return;
    }

    return (0, _token.giveTokens)(_token.selectedToken, running.asset.data.presenterPublicKey, 1);
  });
}
},{"./token.js":"model/token.js","./chain.js":"model/chain.js"}],"view/hostpage.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.HostPage = void 0;

var _chain = require("../model/chain.js");

var _token = require("../model/token.js");

var _main = require("../main.js");

var _presentation = require("../model/presentation.js");

var HostPage = Vue.component('host-page', {
  data: function data() {
    return {
      token: _token.selectedToken,
      presenterName: null,
      title: null,
      abstract: null
    };
  },
  methods: {
    createToken: function createToken() {
      var _this = this;

      return (0, _token.tokenLaunch)().then(function (t) {
        _this.token = t;
        console.log("Token created: " + t.id);
      });
    },
    entrance: function entrance() {
      _main.app.route("entrance");
    },
    timer: function timer() {
      _main.app.route("timer");
    },
    newIdentity: function newIdentity() {
      if (window.confirm("Are you sure to create new identity?")) {
        (0, _chain.recreateMe)();
        (0, _token.dropSelectedToken)();
        location.reload();
      }
    },
    addPresentation: function addPresentation() {
      (0, _presentation.createPresentation)(this.presenterName, this.title, this.abstract).then(function (pres) {
        document.location.reload();
      });
    }
  },
  template: "\n  <v-content>\n    <v-container fluid>\n    <div>\n        <v-btn v-if=\"!token\" @click=\"createToken()\">Create Token</v-btn>\n        <div>\n            <span v-if=\"token\">Token: {{token.id}}</span>\n            <a href=\"\" @click=\"newIdentity()\">New Identity</a>\n        </div>\n        <v-btn @click=\"entrance()\" v-if=\"token\">Entrance View</v-btn>\n        <v-btn @click=\"timer()\" v-if=\"token\">Timer View</v-btn>\n        <div v-if=\"token\">\n            <h3>Presentations</h3>\n            <presentation-list host=\"true\"></presentation-list>\n            <h3>Create Presentation</h3>\n            <v-form>\n                <v-text-field v-model=\"presenterName\" placeholder=\"Presenter\" single-line></v-text-field>\n                <v-text-field v-model=\"title\" placeholder=\"Title\"></v-text-field>\n                <v-textarea v-model=\"abstract\" placeholder=\"Abstract\"></v-textarea>\n                <v-btn v-if=\"title\" @click=\"addPresentation()\">Create Presentation</v-btn>        \n            </v-form>\n        </div>\n        \n    </div>\n    </v-container>\n</v-content>\n"
});
exports.HostPage = HostPage;
},{"../model/chain.js":"model/chain.js","../model/token.js":"model/token.js","../main.js":"main.js","../model/presentation.js":"model/presentation.js"}],"lib/qrcode.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.QRCode = QRCode;

var _QRCode;

(function () {
  //---------------------------------------------------------------------
  // _QRCode for JavaScript
  //
  // Copyright (c) 2009 Kazuhiko Arase
  //
  // URL: http://www.d-project.com/
  //
  // Licensed under the MIT license:
  //   http://www.opensource.org/licenses/mit-license.php
  //
  // The word "QR Code" is registered trademark of
  // DENSO WAVE INCORPORATED
  //   http://www.denso-wave.com/qrcode/faqpatent-e.html
  //
  //---------------------------------------------------------------------
  function QR8bitByte(data) {
    this.mode = QRMode.MODE_8BIT_BYTE;
    this.data = data;
    this.parsedData = []; // Added to support UTF-8 Characters

    for (var i = 0, l = this.data.length; i < l; i++) {
      var byteArray = [];
      var code = this.data.charCodeAt(i);

      if (code > 0x10000) {
        byteArray[0] = 0xF0 | (code & 0x1C0000) >>> 18;
        byteArray[1] = 0x80 | (code & 0x3F000) >>> 12;
        byteArray[2] = 0x80 | (code & 0xFC0) >>> 6;
        byteArray[3] = 0x80 | code & 0x3F;
      } else if (code > 0x800) {
        byteArray[0] = 0xE0 | (code & 0xF000) >>> 12;
        byteArray[1] = 0x80 | (code & 0xFC0) >>> 6;
        byteArray[2] = 0x80 | code & 0x3F;
      } else if (code > 0x80) {
        byteArray[0] = 0xC0 | (code & 0x7C0) >>> 6;
        byteArray[1] = 0x80 | code & 0x3F;
      } else {
        byteArray[0] = code;
      }

      this.parsedData.push(byteArray);
    }

    this.parsedData = Array.prototype.concat.apply([], this.parsedData);

    if (this.parsedData.length != this.data.length) {
      this.parsedData.unshift(191);
      this.parsedData.unshift(187);
      this.parsedData.unshift(239);
    }
  }

  QR8bitByte.prototype = {
    getLength: function getLength(buffer) {
      return this.parsedData.length;
    },
    write: function write(buffer) {
      for (var i = 0, l = this.parsedData.length; i < l; i++) {
        buffer.put(this.parsedData[i], 8);
      }
    }
  };

  function QRCodeModel(typeNumber, errorCorrectLevel) {
    this.typeNumber = typeNumber;
    this.errorCorrectLevel = errorCorrectLevel;
    this.modules = null;
    this.moduleCount = 0;
    this.dataCache = null;
    this.dataList = [];
  }

  QRCodeModel.prototype = {
    addData: function addData(data) {
      var newData = new QR8bitByte(data);
      this.dataList.push(newData);
      this.dataCache = null;
    },
    isDark: function isDark(row, col) {
      if (row < 0 || this.moduleCount <= row || col < 0 || this.moduleCount <= col) {
        throw new Error(row + "," + col);
      }

      return this.modules[row][col];
    },
    getModuleCount: function getModuleCount() {
      return this.moduleCount;
    },
    make: function make() {
      this.makeImpl(false, this.getBestMaskPattern());
    },
    makeImpl: function makeImpl(test, maskPattern) {
      this.moduleCount = this.typeNumber * 4 + 17;
      this.modules = new Array(this.moduleCount);

      for (var row = 0; row < this.moduleCount; row++) {
        this.modules[row] = new Array(this.moduleCount);

        for (var col = 0; col < this.moduleCount; col++) {
          this.modules[row][col] = null;
        }
      }

      this.setupPositionProbePattern(0, 0);
      this.setupPositionProbePattern(this.moduleCount - 7, 0);
      this.setupPositionProbePattern(0, this.moduleCount - 7);
      this.setupPositionAdjustPattern();
      this.setupTimingPattern();
      this.setupTypeInfo(test, maskPattern);

      if (this.typeNumber >= 7) {
        this.setupTypeNumber(test);
      }

      if (this.dataCache == null) {
        this.dataCache = QRCodeModel.createData(this.typeNumber, this.errorCorrectLevel, this.dataList);
      }

      this.mapData(this.dataCache, maskPattern);
    },
    setupPositionProbePattern: function setupPositionProbePattern(row, col) {
      for (var r = -1; r <= 7; r++) {
        if (row + r <= -1 || this.moduleCount <= row + r) continue;

        for (var c = -1; c <= 7; c++) {
          if (col + c <= -1 || this.moduleCount <= col + c) continue;

          if (0 <= r && r <= 6 && (c == 0 || c == 6) || 0 <= c && c <= 6 && (r == 0 || r == 6) || 2 <= r && r <= 4 && 2 <= c && c <= 4) {
            this.modules[row + r][col + c] = true;
          } else {
            this.modules[row + r][col + c] = false;
          }
        }
      }
    },
    getBestMaskPattern: function getBestMaskPattern() {
      var minLostPoint = 0;
      var pattern = 0;

      for (var i = 0; i < 8; i++) {
        this.makeImpl(true, i);
        var lostPoint = QRUtil.getLostPoint(this);

        if (i == 0 || minLostPoint > lostPoint) {
          minLostPoint = lostPoint;
          pattern = i;
        }
      }

      return pattern;
    },
    createMovieClip: function createMovieClip(target_mc, instance_name, depth) {
      var qr_mc = target_mc.createEmptyMovieClip(instance_name, depth);
      var cs = 1;
      this.make();

      for (var row = 0; row < this.modules.length; row++) {
        var y = row * cs;

        for (var col = 0; col < this.modules[row].length; col++) {
          var x = col * cs;
          var dark = this.modules[row][col];

          if (dark) {
            qr_mc.beginFill(0, 100);
            qr_mc.moveTo(x, y);
            qr_mc.lineTo(x + cs, y);
            qr_mc.lineTo(x + cs, y + cs);
            qr_mc.lineTo(x, y + cs);
            qr_mc.endFill();
          }
        }
      }

      return qr_mc;
    },
    setupTimingPattern: function setupTimingPattern() {
      for (var r = 8; r < this.moduleCount - 8; r++) {
        if (this.modules[r][6] != null) {
          continue;
        }

        this.modules[r][6] = r % 2 == 0;
      }

      for (var c = 8; c < this.moduleCount - 8; c++) {
        if (this.modules[6][c] != null) {
          continue;
        }

        this.modules[6][c] = c % 2 == 0;
      }
    },
    setupPositionAdjustPattern: function setupPositionAdjustPattern() {
      var pos = QRUtil.getPatternPosition(this.typeNumber);

      for (var i = 0; i < pos.length; i++) {
        for (var j = 0; j < pos.length; j++) {
          var row = pos[i];
          var col = pos[j];

          if (this.modules[row][col] != null) {
            continue;
          }

          for (var r = -2; r <= 2; r++) {
            for (var c = -2; c <= 2; c++) {
              if (r == -2 || r == 2 || c == -2 || c == 2 || r == 0 && c == 0) {
                this.modules[row + r][col + c] = true;
              } else {
                this.modules[row + r][col + c] = false;
              }
            }
          }
        }
      }
    },
    setupTypeNumber: function setupTypeNumber(test) {
      var bits = QRUtil.getBCHTypeNumber(this.typeNumber);

      for (var i = 0; i < 18; i++) {
        var mod = !test && (bits >> i & 1) == 1;
        this.modules[Math.floor(i / 3)][i % 3 + this.moduleCount - 8 - 3] = mod;
      }

      for (var i = 0; i < 18; i++) {
        var mod = !test && (bits >> i & 1) == 1;
        this.modules[i % 3 + this.moduleCount - 8 - 3][Math.floor(i / 3)] = mod;
      }
    },
    setupTypeInfo: function setupTypeInfo(test, maskPattern) {
      var data = this.errorCorrectLevel << 3 | maskPattern;
      var bits = QRUtil.getBCHTypeInfo(data);

      for (var i = 0; i < 15; i++) {
        var mod = !test && (bits >> i & 1) == 1;

        if (i < 6) {
          this.modules[i][8] = mod;
        } else if (i < 8) {
          this.modules[i + 1][8] = mod;
        } else {
          this.modules[this.moduleCount - 15 + i][8] = mod;
        }
      }

      for (var i = 0; i < 15; i++) {
        var mod = !test && (bits >> i & 1) == 1;

        if (i < 8) {
          this.modules[8][this.moduleCount - i - 1] = mod;
        } else if (i < 9) {
          this.modules[8][15 - i - 1 + 1] = mod;
        } else {
          this.modules[8][15 - i - 1] = mod;
        }
      }

      this.modules[this.moduleCount - 8][8] = !test;
    },
    mapData: function mapData(data, maskPattern) {
      var inc = -1;
      var row = this.moduleCount - 1;
      var bitIndex = 7;
      var byteIndex = 0;

      for (var col = this.moduleCount - 1; col > 0; col -= 2) {
        if (col == 6) col--;

        while (true) {
          for (var c = 0; c < 2; c++) {
            if (this.modules[row][col - c] == null) {
              var dark = false;

              if (byteIndex < data.length) {
                dark = (data[byteIndex] >>> bitIndex & 1) == 1;
              }

              var mask = QRUtil.getMask(maskPattern, row, col - c);

              if (mask) {
                dark = !dark;
              }

              this.modules[row][col - c] = dark;
              bitIndex--;

              if (bitIndex == -1) {
                byteIndex++;
                bitIndex = 7;
              }
            }
          }

          row += inc;

          if (row < 0 || this.moduleCount <= row) {
            row -= inc;
            inc = -inc;
            break;
          }
        }
      }
    }
  };
  QRCodeModel.PAD0 = 0xEC;
  QRCodeModel.PAD1 = 0x11;

  QRCodeModel.createData = function (typeNumber, errorCorrectLevel, dataList) {
    var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectLevel);
    var buffer = new QRBitBuffer();

    for (var i = 0; i < dataList.length; i++) {
      var data = dataList[i];
      buffer.put(data.mode, 4);
      buffer.put(data.getLength(), QRUtil.getLengthInBits(data.mode, typeNumber));
      data.write(buffer);
    }

    var totalDataCount = 0;

    for (var i = 0; i < rsBlocks.length; i++) {
      totalDataCount += rsBlocks[i].dataCount;
    }

    if (buffer.getLengthInBits() > totalDataCount * 8) {
      throw new Error("code length overflow. (" + buffer.getLengthInBits() + ">" + totalDataCount * 8 + ")");
    }

    if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
      buffer.put(0, 4);
    }

    while (buffer.getLengthInBits() % 8 != 0) {
      buffer.putBit(false);
    }

    while (true) {
      if (buffer.getLengthInBits() >= totalDataCount * 8) {
        break;
      }

      buffer.put(QRCodeModel.PAD0, 8);

      if (buffer.getLengthInBits() >= totalDataCount * 8) {
        break;
      }

      buffer.put(QRCodeModel.PAD1, 8);
    }

    return QRCodeModel.createBytes(buffer, rsBlocks);
  };

  QRCodeModel.createBytes = function (buffer, rsBlocks) {
    var offset = 0;
    var maxDcCount = 0;
    var maxEcCount = 0;
    var dcdata = new Array(rsBlocks.length);
    var ecdata = new Array(rsBlocks.length);

    for (var r = 0; r < rsBlocks.length; r++) {
      var dcCount = rsBlocks[r].dataCount;
      var ecCount = rsBlocks[r].totalCount - dcCount;
      maxDcCount = Math.max(maxDcCount, dcCount);
      maxEcCount = Math.max(maxEcCount, ecCount);
      dcdata[r] = new Array(dcCount);

      for (var i = 0; i < dcdata[r].length; i++) {
        dcdata[r][i] = 0xff & buffer.buffer[i + offset];
      }

      offset += dcCount;
      var rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
      var rawPoly = new QRPolynomial(dcdata[r], rsPoly.getLength() - 1);
      var modPoly = rawPoly.mod(rsPoly);
      ecdata[r] = new Array(rsPoly.getLength() - 1);

      for (var i = 0; i < ecdata[r].length; i++) {
        var modIndex = i + modPoly.getLength() - ecdata[r].length;
        ecdata[r][i] = modIndex >= 0 ? modPoly.get(modIndex) : 0;
      }
    }

    var totalCodeCount = 0;

    for (var i = 0; i < rsBlocks.length; i++) {
      totalCodeCount += rsBlocks[i].totalCount;
    }

    var data = new Array(totalCodeCount);
    var index = 0;

    for (var i = 0; i < maxDcCount; i++) {
      for (var r = 0; r < rsBlocks.length; r++) {
        if (i < dcdata[r].length) {
          data[index++] = dcdata[r][i];
        }
      }
    }

    for (var i = 0; i < maxEcCount; i++) {
      for (var r = 0; r < rsBlocks.length; r++) {
        if (i < ecdata[r].length) {
          data[index++] = ecdata[r][i];
        }
      }
    }

    return data;
  };

  var QRMode = {
    MODE_NUMBER: 1 << 0,
    MODE_ALPHA_NUM: 1 << 1,
    MODE_8BIT_BYTE: 1 << 2,
    MODE_KANJI: 1 << 3
  };
  var QRErrorCorrectLevel = {
    L: 1,
    M: 0,
    Q: 3,
    H: 2
  };
  var QRMaskPattern = {
    PATTERN000: 0,
    PATTERN001: 1,
    PATTERN010: 2,
    PATTERN011: 3,
    PATTERN100: 4,
    PATTERN101: 5,
    PATTERN110: 6,
    PATTERN111: 7
  };
  var QRUtil = {
    PATTERN_POSITION_TABLE: [[], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50], [6, 30, 54], [6, 32, 58], [6, 34, 62], [6, 26, 46, 66], [6, 26, 48, 70], [6, 26, 50, 74], [6, 30, 54, 78], [6, 30, 56, 82], [6, 30, 58, 86], [6, 34, 62, 90], [6, 28, 50, 72, 94], [6, 26, 50, 74, 98], [6, 30, 54, 78, 102], [6, 28, 54, 80, 106], [6, 32, 58, 84, 110], [6, 30, 58, 86, 114], [6, 34, 62, 90, 118], [6, 26, 50, 74, 98, 122], [6, 30, 54, 78, 102, 126], [6, 26, 52, 78, 104, 130], [6, 30, 56, 82, 108, 134], [6, 34, 60, 86, 112, 138], [6, 30, 58, 86, 114, 142], [6, 34, 62, 90, 118, 146], [6, 30, 54, 78, 102, 126, 150], [6, 24, 50, 76, 102, 128, 154], [6, 28, 54, 80, 106, 132, 158], [6, 32, 58, 84, 110, 136, 162], [6, 26, 54, 82, 110, 138, 166], [6, 30, 58, 86, 114, 142, 170]],
    G15: 1 << 10 | 1 << 8 | 1 << 5 | 1 << 4 | 1 << 2 | 1 << 1 | 1 << 0,
    G18: 1 << 12 | 1 << 11 | 1 << 10 | 1 << 9 | 1 << 8 | 1 << 5 | 1 << 2 | 1 << 0,
    G15_MASK: 1 << 14 | 1 << 12 | 1 << 10 | 1 << 4 | 1 << 1,
    getBCHTypeInfo: function getBCHTypeInfo(data) {
      var d = data << 10;

      while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15) >= 0) {
        d ^= QRUtil.G15 << QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G15);
      }

      return (data << 10 | d) ^ QRUtil.G15_MASK;
    },
    getBCHTypeNumber: function getBCHTypeNumber(data) {
      var d = data << 12;

      while (QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18) >= 0) {
        d ^= QRUtil.G18 << QRUtil.getBCHDigit(d) - QRUtil.getBCHDigit(QRUtil.G18);
      }

      return data << 12 | d;
    },
    getBCHDigit: function getBCHDigit(data) {
      var digit = 0;

      while (data != 0) {
        digit++;
        data >>>= 1;
      }

      return digit;
    },
    getPatternPosition: function getPatternPosition(typeNumber) {
      return QRUtil.PATTERN_POSITION_TABLE[typeNumber - 1];
    },
    getMask: function getMask(maskPattern, i, j) {
      switch (maskPattern) {
        case QRMaskPattern.PATTERN000:
          return (i + j) % 2 == 0;

        case QRMaskPattern.PATTERN001:
          return i % 2 == 0;

        case QRMaskPattern.PATTERN010:
          return j % 3 == 0;

        case QRMaskPattern.PATTERN011:
          return (i + j) % 3 == 0;

        case QRMaskPattern.PATTERN100:
          return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 == 0;

        case QRMaskPattern.PATTERN101:
          return i * j % 2 + i * j % 3 == 0;

        case QRMaskPattern.PATTERN110:
          return (i * j % 2 + i * j % 3) % 2 == 0;

        case QRMaskPattern.PATTERN111:
          return (i * j % 3 + (i + j) % 2) % 2 == 0;

        default:
          throw new Error("bad maskPattern:" + maskPattern);
      }
    },
    getErrorCorrectPolynomial: function getErrorCorrectPolynomial(errorCorrectLength) {
      var a = new QRPolynomial([1], 0);

      for (var i = 0; i < errorCorrectLength; i++) {
        a = a.multiply(new QRPolynomial([1, QRMath.gexp(i)], 0));
      }

      return a;
    },
    getLengthInBits: function getLengthInBits(mode, type) {
      if (1 <= type && type < 10) {
        switch (mode) {
          case QRMode.MODE_NUMBER:
            return 10;

          case QRMode.MODE_ALPHA_NUM:
            return 9;

          case QRMode.MODE_8BIT_BYTE:
            return 8;

          case QRMode.MODE_KANJI:
            return 8;

          default:
            throw new Error("mode:" + mode);
        }
      } else if (type < 27) {
        switch (mode) {
          case QRMode.MODE_NUMBER:
            return 12;

          case QRMode.MODE_ALPHA_NUM:
            return 11;

          case QRMode.MODE_8BIT_BYTE:
            return 16;

          case QRMode.MODE_KANJI:
            return 10;

          default:
            throw new Error("mode:" + mode);
        }
      } else if (type < 41) {
        switch (mode) {
          case QRMode.MODE_NUMBER:
            return 14;

          case QRMode.MODE_ALPHA_NUM:
            return 13;

          case QRMode.MODE_8BIT_BYTE:
            return 16;

          case QRMode.MODE_KANJI:
            return 12;

          default:
            throw new Error("mode:" + mode);
        }
      } else {
        throw new Error("type:" + type);
      }
    },
    getLostPoint: function getLostPoint(qrCode) {
      var moduleCount = qrCode.getModuleCount();
      var lostPoint = 0;

      for (var row = 0; row < moduleCount; row++) {
        for (var col = 0; col < moduleCount; col++) {
          var sameCount = 0;
          var dark = qrCode.isDark(row, col);

          for (var r = -1; r <= 1; r++) {
            if (row + r < 0 || moduleCount <= row + r) {
              continue;
            }

            for (var c = -1; c <= 1; c++) {
              if (col + c < 0 || moduleCount <= col + c) {
                continue;
              }

              if (r == 0 && c == 0) {
                continue;
              }

              if (dark == qrCode.isDark(row + r, col + c)) {
                sameCount++;
              }
            }
          }

          if (sameCount > 5) {
            lostPoint += 3 + sameCount - 5;
          }
        }
      }

      for (var row = 0; row < moduleCount - 1; row++) {
        for (var col = 0; col < moduleCount - 1; col++) {
          var count = 0;
          if (qrCode.isDark(row, col)) count++;
          if (qrCode.isDark(row + 1, col)) count++;
          if (qrCode.isDark(row, col + 1)) count++;
          if (qrCode.isDark(row + 1, col + 1)) count++;

          if (count == 0 || count == 4) {
            lostPoint += 3;
          }
        }
      }

      for (var row = 0; row < moduleCount; row++) {
        for (var col = 0; col < moduleCount - 6; col++) {
          if (qrCode.isDark(row, col) && !qrCode.isDark(row, col + 1) && qrCode.isDark(row, col + 2) && qrCode.isDark(row, col + 3) && qrCode.isDark(row, col + 4) && !qrCode.isDark(row, col + 5) && qrCode.isDark(row, col + 6)) {
            lostPoint += 40;
          }
        }
      }

      for (var col = 0; col < moduleCount; col++) {
        for (var row = 0; row < moduleCount - 6; row++) {
          if (qrCode.isDark(row, col) && !qrCode.isDark(row + 1, col) && qrCode.isDark(row + 2, col) && qrCode.isDark(row + 3, col) && qrCode.isDark(row + 4, col) && !qrCode.isDark(row + 5, col) && qrCode.isDark(row + 6, col)) {
            lostPoint += 40;
          }
        }
      }

      var darkCount = 0;

      for (var col = 0; col < moduleCount; col++) {
        for (var row = 0; row < moduleCount; row++) {
          if (qrCode.isDark(row, col)) {
            darkCount++;
          }
        }
      }

      var ratio = Math.abs(100 * darkCount / moduleCount / moduleCount - 50) / 5;
      lostPoint += ratio * 10;
      return lostPoint;
    }
  };
  var QRMath = {
    glog: function glog(n) {
      if (n < 1) {
        throw new Error("glog(" + n + ")");
      }

      return QRMath.LOG_TABLE[n];
    },
    gexp: function gexp(n) {
      while (n < 0) {
        n += 255;
      }

      while (n >= 256) {
        n -= 255;
      }

      return QRMath.EXP_TABLE[n];
    },
    EXP_TABLE: new Array(256),
    LOG_TABLE: new Array(256)
  };

  for (var i = 0; i < 8; i++) {
    QRMath.EXP_TABLE[i] = 1 << i;
  }

  for (var i = 8; i < 256; i++) {
    QRMath.EXP_TABLE[i] = QRMath.EXP_TABLE[i - 4] ^ QRMath.EXP_TABLE[i - 5] ^ QRMath.EXP_TABLE[i - 6] ^ QRMath.EXP_TABLE[i - 8];
  }

  for (var i = 0; i < 255; i++) {
    QRMath.LOG_TABLE[QRMath.EXP_TABLE[i]] = i;
  }

  function QRPolynomial(num, shift) {
    if (num.length == undefined) {
      throw new Error(num.length + "/" + shift);
    }

    var offset = 0;

    while (offset < num.length && num[offset] == 0) {
      offset++;
    }

    this.num = new Array(num.length - offset + shift);

    for (var i = 0; i < num.length - offset; i++) {
      this.num[i] = num[i + offset];
    }
  }

  QRPolynomial.prototype = {
    get: function get(index) {
      return this.num[index];
    },
    getLength: function getLength() {
      return this.num.length;
    },
    multiply: function multiply(e) {
      var num = new Array(this.getLength() + e.getLength() - 1);

      for (var i = 0; i < this.getLength(); i++) {
        for (var j = 0; j < e.getLength(); j++) {
          num[i + j] ^= QRMath.gexp(QRMath.glog(this.get(i)) + QRMath.glog(e.get(j)));
        }
      }

      return new QRPolynomial(num, 0);
    },
    mod: function mod(e) {
      if (this.getLength() - e.getLength() < 0) {
        return this;
      }

      var ratio = QRMath.glog(this.get(0)) - QRMath.glog(e.get(0));
      var num = new Array(this.getLength());

      for (var i = 0; i < this.getLength(); i++) {
        num[i] = this.get(i);
      }

      for (var i = 0; i < e.getLength(); i++) {
        num[i] ^= QRMath.gexp(QRMath.glog(e.get(i)) + ratio);
      }

      return new QRPolynomial(num, 0).mod(e);
    }
  };

  function QRRSBlock(totalCount, dataCount) {
    this.totalCount = totalCount;
    this.dataCount = dataCount;
  }

  QRRSBlock.RS_BLOCK_TABLE = [[1, 26, 19], [1, 26, 16], [1, 26, 13], [1, 26, 9], [1, 44, 34], [1, 44, 28], [1, 44, 22], [1, 44, 16], [1, 70, 55], [1, 70, 44], [2, 35, 17], [2, 35, 13], [1, 100, 80], [2, 50, 32], [2, 50, 24], [4, 25, 9], [1, 134, 108], [2, 67, 43], [2, 33, 15, 2, 34, 16], [2, 33, 11, 2, 34, 12], [2, 86, 68], [4, 43, 27], [4, 43, 19], [4, 43, 15], [2, 98, 78], [4, 49, 31], [2, 32, 14, 4, 33, 15], [4, 39, 13, 1, 40, 14], [2, 121, 97], [2, 60, 38, 2, 61, 39], [4, 40, 18, 2, 41, 19], [4, 40, 14, 2, 41, 15], [2, 146, 116], [3, 58, 36, 2, 59, 37], [4, 36, 16, 4, 37, 17], [4, 36, 12, 4, 37, 13], [2, 86, 68, 2, 87, 69], [4, 69, 43, 1, 70, 44], [6, 43, 19, 2, 44, 20], [6, 43, 15, 2, 44, 16], [4, 101, 81], [1, 80, 50, 4, 81, 51], [4, 50, 22, 4, 51, 23], [3, 36, 12, 8, 37, 13], [2, 116, 92, 2, 117, 93], [6, 58, 36, 2, 59, 37], [4, 46, 20, 6, 47, 21], [7, 42, 14, 4, 43, 15], [4, 133, 107], [8, 59, 37, 1, 60, 38], [8, 44, 20, 4, 45, 21], [12, 33, 11, 4, 34, 12], [3, 145, 115, 1, 146, 116], [4, 64, 40, 5, 65, 41], [11, 36, 16, 5, 37, 17], [11, 36, 12, 5, 37, 13], [5, 109, 87, 1, 110, 88], [5, 65, 41, 5, 66, 42], [5, 54, 24, 7, 55, 25], [11, 36, 12], [5, 122, 98, 1, 123, 99], [7, 73, 45, 3, 74, 46], [15, 43, 19, 2, 44, 20], [3, 45, 15, 13, 46, 16], [1, 135, 107, 5, 136, 108], [10, 74, 46, 1, 75, 47], [1, 50, 22, 15, 51, 23], [2, 42, 14, 17, 43, 15], [5, 150, 120, 1, 151, 121], [9, 69, 43, 4, 70, 44], [17, 50, 22, 1, 51, 23], [2, 42, 14, 19, 43, 15], [3, 141, 113, 4, 142, 114], [3, 70, 44, 11, 71, 45], [17, 47, 21, 4, 48, 22], [9, 39, 13, 16, 40, 14], [3, 135, 107, 5, 136, 108], [3, 67, 41, 13, 68, 42], [15, 54, 24, 5, 55, 25], [15, 43, 15, 10, 44, 16], [4, 144, 116, 4, 145, 117], [17, 68, 42], [17, 50, 22, 6, 51, 23], [19, 46, 16, 6, 47, 17], [2, 139, 111, 7, 140, 112], [17, 74, 46], [7, 54, 24, 16, 55, 25], [34, 37, 13], [4, 151, 121, 5, 152, 122], [4, 75, 47, 14, 76, 48], [11, 54, 24, 14, 55, 25], [16, 45, 15, 14, 46, 16], [6, 147, 117, 4, 148, 118], [6, 73, 45, 14, 74, 46], [11, 54, 24, 16, 55, 25], [30, 46, 16, 2, 47, 17], [8, 132, 106, 4, 133, 107], [8, 75, 47, 13, 76, 48], [7, 54, 24, 22, 55, 25], [22, 45, 15, 13, 46, 16], [10, 142, 114, 2, 143, 115], [19, 74, 46, 4, 75, 47], [28, 50, 22, 6, 51, 23], [33, 46, 16, 4, 47, 17], [8, 152, 122, 4, 153, 123], [22, 73, 45, 3, 74, 46], [8, 53, 23, 26, 54, 24], [12, 45, 15, 28, 46, 16], [3, 147, 117, 10, 148, 118], [3, 73, 45, 23, 74, 46], [4, 54, 24, 31, 55, 25], [11, 45, 15, 31, 46, 16], [7, 146, 116, 7, 147, 117], [21, 73, 45, 7, 74, 46], [1, 53, 23, 37, 54, 24], [19, 45, 15, 26, 46, 16], [5, 145, 115, 10, 146, 116], [19, 75, 47, 10, 76, 48], [15, 54, 24, 25, 55, 25], [23, 45, 15, 25, 46, 16], [13, 145, 115, 3, 146, 116], [2, 74, 46, 29, 75, 47], [42, 54, 24, 1, 55, 25], [23, 45, 15, 28, 46, 16], [17, 145, 115], [10, 74, 46, 23, 75, 47], [10, 54, 24, 35, 55, 25], [19, 45, 15, 35, 46, 16], [17, 145, 115, 1, 146, 116], [14, 74, 46, 21, 75, 47], [29, 54, 24, 19, 55, 25], [11, 45, 15, 46, 46, 16], [13, 145, 115, 6, 146, 116], [14, 74, 46, 23, 75, 47], [44, 54, 24, 7, 55, 25], [59, 46, 16, 1, 47, 17], [12, 151, 121, 7, 152, 122], [12, 75, 47, 26, 76, 48], [39, 54, 24, 14, 55, 25], [22, 45, 15, 41, 46, 16], [6, 151, 121, 14, 152, 122], [6, 75, 47, 34, 76, 48], [46, 54, 24, 10, 55, 25], [2, 45, 15, 64, 46, 16], [17, 152, 122, 4, 153, 123], [29, 74, 46, 14, 75, 47], [49, 54, 24, 10, 55, 25], [24, 45, 15, 46, 46, 16], [4, 152, 122, 18, 153, 123], [13, 74, 46, 32, 75, 47], [48, 54, 24, 14, 55, 25], [42, 45, 15, 32, 46, 16], [20, 147, 117, 4, 148, 118], [40, 75, 47, 7, 76, 48], [43, 54, 24, 22, 55, 25], [10, 45, 15, 67, 46, 16], [19, 148, 118, 6, 149, 119], [18, 75, 47, 31, 76, 48], [34, 54, 24, 34, 55, 25], [20, 45, 15, 61, 46, 16]];

  QRRSBlock.getRSBlocks = function (typeNumber, errorCorrectLevel) {
    var rsBlock = QRRSBlock.getRsBlockTable(typeNumber, errorCorrectLevel);

    if (rsBlock == undefined) {
      throw new Error("bad rs block @ typeNumber:" + typeNumber + "/errorCorrectLevel:" + errorCorrectLevel);
    }

    var length = rsBlock.length / 3;
    var list = [];

    for (var i = 0; i < length; i++) {
      var count = rsBlock[i * 3 + 0];
      var totalCount = rsBlock[i * 3 + 1];
      var dataCount = rsBlock[i * 3 + 2];

      for (var j = 0; j < count; j++) {
        list.push(new QRRSBlock(totalCount, dataCount));
      }
    }

    return list;
  };

  QRRSBlock.getRsBlockTable = function (typeNumber, errorCorrectLevel) {
    switch (errorCorrectLevel) {
      case QRErrorCorrectLevel.L:
        return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 0];

      case QRErrorCorrectLevel.M:
        return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 1];

      case QRErrorCorrectLevel.Q:
        return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 2];

      case QRErrorCorrectLevel.H:
        return QRRSBlock.RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 3];

      default:
        return undefined;
    }
  };

  function QRBitBuffer() {
    this.buffer = [];
    this.length = 0;
  }

  QRBitBuffer.prototype = {
    get: function get(index) {
      var bufIndex = Math.floor(index / 8);
      return (this.buffer[bufIndex] >>> 7 - index % 8 & 1) == 1;
    },
    put: function put(num, length) {
      for (var i = 0; i < length; i++) {
        this.putBit((num >>> length - i - 1 & 1) == 1);
      }
    },
    getLengthInBits: function getLengthInBits() {
      return this.length;
    },
    putBit: function putBit(bit) {
      var bufIndex = Math.floor(this.length / 8);

      if (this.buffer.length <= bufIndex) {
        this.buffer.push(0);
      }

      if (bit) {
        this.buffer[bufIndex] |= 0x80 >>> this.length % 8;
      }

      this.length++;
    }
  };
  var QRCodeLimitLength = [[17, 14, 11, 7], [32, 26, 20, 14], [53, 42, 32, 24], [78, 62, 46, 34], [106, 84, 60, 44], [134, 106, 74, 58], [154, 122, 86, 64], [192, 152, 108, 84], [230, 180, 130, 98], [271, 213, 151, 119], [321, 251, 177, 137], [367, 287, 203, 155], [425, 331, 241, 177], [458, 362, 258, 194], [520, 412, 292, 220], [586, 450, 322, 250], [644, 504, 364, 280], [718, 560, 394, 310], [792, 624, 442, 338], [858, 666, 482, 382], [929, 711, 509, 403], [1003, 779, 565, 439], [1091, 857, 611, 461], [1171, 911, 661, 511], [1273, 997, 715, 535], [1367, 1059, 751, 593], [1465, 1125, 805, 625], [1528, 1190, 868, 658], [1628, 1264, 908, 698], [1732, 1370, 982, 742], [1840, 1452, 1030, 790], [1952, 1538, 1112, 842], [2068, 1628, 1168, 898], [2188, 1722, 1228, 958], [2303, 1809, 1283, 983], [2431, 1911, 1351, 1051], [2563, 1989, 1423, 1093], [2699, 2099, 1499, 1139], [2809, 2213, 1579, 1219], [2953, 2331, 1663, 1273]];

  function _isSupportCanvas() {
    return typeof CanvasRenderingContext2D != "undefined";
  } // android 2.x doesn't support Data-URI spec


  function _getAndroid() {
    var android = false;
    var sAgent = navigator.userAgent;

    if (/android/i.test(sAgent)) {
      // android
      android = true;
      var aMat = sAgent.toString().match(/android ([0-9]\.[0-9])/i);

      if (aMat && aMat[1]) {
        android = parseFloat(aMat[1]);
      }
    }

    return android;
  }

  var svgDrawer = function () {
    var Drawing = function Drawing(el, htOption) {
      this._el = el;
      this._htOption = htOption;
    };

    Drawing.prototype.draw = function (oQRCode) {
      var _htOption = this._htOption;
      var _el = this._el;
      var nCount = oQRCode.getModuleCount();
      var nWidth = Math.floor(_htOption.width / nCount);
      var nHeight = Math.floor(_htOption.height / nCount);
      this.clear();

      function makeSVG(tag, attrs) {
        var el = document.createElementNS('http://www.w3.org/2000/svg', tag);

        for (var k in attrs) {
          if (attrs.hasOwnProperty(k)) el.setAttribute(k, attrs[k]);
        }

        return el;
      }

      var svg = makeSVG("svg", {
        'viewBox': '0 0 ' + String(nCount) + " " + String(nCount),
        'width': '100%',
        'height': '100%',
        'fill': _htOption.colorLight
      });
      svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");

      _el.appendChild(svg);

      svg.appendChild(makeSVG("rect", {
        "fill": _htOption.colorLight,
        "width": "100%",
        "height": "100%"
      }));
      svg.appendChild(makeSVG("rect", {
        "fill": _htOption.colorDark,
        "width": "1",
        "height": "1",
        "id": "template"
      }));

      for (var row = 0; row < nCount; row++) {
        for (var col = 0; col < nCount; col++) {
          if (oQRCode.isDark(row, col)) {
            var child = makeSVG("use", {
              "x": String(col),
              "y": String(row)
            });
            child.setAttributeNS("http://www.w3.org/1999/xlink", "href", "#template");
            svg.appendChild(child);
          }
        }
      }
    };

    Drawing.prototype.clear = function () {
      while (this._el.hasChildNodes()) {
        this._el.removeChild(this._el.lastChild);
      }
    };

    return Drawing;
  }();

  var useSVG = document.documentElement.tagName.toLowerCase() === "svg"; // Drawing in DOM by using Table tag

  var Drawing = useSVG ? svgDrawer : !_isSupportCanvas() ? function () {
    var Drawing = function Drawing(el, htOption) {
      this._el = el;
      this._htOption = htOption;
    };
    /**
     * Draw the _QRCode
     *
     * @param {_QRCode} oQRCode
     */


    Drawing.prototype.draw = function (oQRCode) {
      var _htOption = this._htOption;
      var _el = this._el;
      var nCount = oQRCode.getModuleCount();
      var nWidth = Math.floor(_htOption.width / nCount);
      var nHeight = Math.floor(_htOption.height / nCount);
      var aHTML = ['<table style="border:0;border-collapse:collapse;">'];

      for (var row = 0; row < nCount; row++) {
        aHTML.push('<tr>');

        for (var col = 0; col < nCount; col++) {
          aHTML.push('<td style="border:0;border-collapse:collapse;padding:0;margin:0;width:' + nWidth + 'px;height:' + nHeight + 'px;background-color:' + (oQRCode.isDark(row, col) ? _htOption.colorDark : _htOption.colorLight) + ';"></td>');
        }

        aHTML.push('</tr>');
      }

      aHTML.push('</table>');
      _el.innerHTML = aHTML.join(''); // Fix the margin values as real size.

      var elTable = _el.childNodes[0];
      var nLeftMarginTable = (_htOption.width - elTable.offsetWidth) / 2;
      var nTopMarginTable = (_htOption.height - elTable.offsetHeight) / 2;

      if (nLeftMarginTable > 0 && nTopMarginTable > 0) {
        elTable.style.margin = nTopMarginTable + "px " + nLeftMarginTable + "px";
      }
    };
    /**
     * Clear the _QRCode
     */


    Drawing.prototype.clear = function () {
      this._el.innerHTML = '';
    };

    return Drawing;
  }() : function () {
    // Drawing in Canvas
    function _onMakeImage() {
      this._elImage.src = this._elCanvas.toDataURL("image/png");
      this._elImage.style.display = "block";
      this._elCanvas.style.display = "none";
    }
    /**
     * Check whether the user's browser supports Data URI or not
     *
     * @private
     * @param {Function} fSuccess Occurs if it supports Data URI
     * @param {Function} fFail Occurs if it doesn't support Data URI
     */


    function _safeSetDataURI(fSuccess, fFail) {
      var self = this;
      self._fFail = fFail;
      self._fSuccess = fSuccess; // Check it just once

      if (self._bSupportDataURI === null) {
        var el = document.createElement("img");

        var fOnError = function fOnError() {
          self._bSupportDataURI = false;

          if (self._fFail) {
            self._fFail.call(self);
          }
        };

        var fOnSuccess = function fOnSuccess() {
          self._bSupportDataURI = true;

          if (self._fSuccess) {
            self._fSuccess.call(self);
          }
        };

        el.onabort = fOnError;
        el.onerror = fOnError;
        el.onload = fOnSuccess;
        el.src = "data:image/gif;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=="; // the Image contains 1px data.

        return;
      } else if (self._bSupportDataURI === true && self._fSuccess) {
        self._fSuccess.call(self);
      } else if (self._bSupportDataURI === false && self._fFail) {
        self._fFail.call(self);
      }
    }

    ;
    /**
     * Drawing _QRCode by using canvas
     *
     * @constructor
     * @param {HTMLElement} el
     * @param {Object} htOption _QRCode Options
     */

    var Drawing = function Drawing(el, htOption) {
      this._bIsPainted = false;
      this._android = _getAndroid();
      this._htOption = htOption;
      this._elCanvas = document.createElement("canvas");
      this._elCanvas.width = htOption.width;
      this._elCanvas.height = htOption.height;
      el.appendChild(this._elCanvas);
      this._el = el;
      this._oContext = this._elCanvas.getContext("2d");
      this._bIsPainted = false;
      this._elImage = document.createElement("img");
      this._elImage.alt = "Scan me!";
      this._elImage.style.display = "none";

      this._el.appendChild(this._elImage);

      this._bSupportDataURI = null;
    };
    /**
     * Draw the _QRCode
     *
     * @param {_QRCode} oQRCode
     */


    Drawing.prototype.draw = function (oQRCode) {
      var _elImage = this._elImage;
      var _oContext = this._oContext;
      var _htOption = this._htOption;
      var nCount = oQRCode.getModuleCount();
      var nWidth = _htOption.width / nCount;
      var nHeight = _htOption.height / nCount;
      var nRoundedWidth = Math.round(nWidth);
      var nRoundedHeight = Math.round(nHeight);
      _elImage.style.display = "none";
      this.clear();

      for (var row = 0; row < nCount; row++) {
        for (var col = 0; col < nCount; col++) {
          var bIsDark = oQRCode.isDark(row, col);
          var nLeft = col * nWidth;
          var nTop = row * nHeight;
          _oContext.strokeStyle = bIsDark ? _htOption.colorDark : _htOption.colorLight;
          _oContext.lineWidth = 1;
          _oContext.fillStyle = bIsDark ? _htOption.colorDark : _htOption.colorLight;

          _oContext.fillRect(nLeft, nTop, nWidth, nHeight); // 안티 앨리어싱 방지 처리


          _oContext.strokeRect(Math.floor(nLeft) + 0.5, Math.floor(nTop) + 0.5, nRoundedWidth, nRoundedHeight);

          _oContext.strokeRect(Math.ceil(nLeft) - 0.5, Math.ceil(nTop) - 0.5, nRoundedWidth, nRoundedHeight);
        }
      }

      this._bIsPainted = true;
    };
    /**
     * Make the image from Canvas if the browser supports Data URI.
     */


    Drawing.prototype.makeImage = function () {
      if (this._bIsPainted) {
        _safeSetDataURI.call(this, _onMakeImage);
      }
    };
    /**
     * Return whether the _QRCode is painted or not
     *
     * @return {Boolean}
     */


    Drawing.prototype.isPainted = function () {
      return this._bIsPainted;
    };
    /**
     * Clear the _QRCode
     */


    Drawing.prototype.clear = function () {
      this._oContext.clearRect(0, 0, this._elCanvas.width, this._elCanvas.height);

      this._bIsPainted = false;
    };
    /**
     * @private
     * @param {Number} nNumber
     */


    Drawing.prototype.round = function (nNumber) {
      if (!nNumber) {
        return nNumber;
      }

      return Math.floor(nNumber * 1000) / 1000;
    };

    return Drawing;
  }();
  /**
   * Get the type by string length
   *
   * @private
   * @param {String} sText
   * @param {Number} nCorrectLevel
   * @return {Number} type
   */

  function _getTypeNumber(sText, nCorrectLevel) {
    var nType = 1;

    var length = _getUTF8Length(sText);

    for (var i = 0, len = QRCodeLimitLength.length; i <= len; i++) {
      var nLimit = 0;

      switch (nCorrectLevel) {
        case QRErrorCorrectLevel.L:
          nLimit = QRCodeLimitLength[i][0];
          break;

        case QRErrorCorrectLevel.M:
          nLimit = QRCodeLimitLength[i][1];
          break;

        case QRErrorCorrectLevel.Q:
          nLimit = QRCodeLimitLength[i][2];
          break;

        case QRErrorCorrectLevel.H:
          nLimit = QRCodeLimitLength[i][3];
          break;
      }

      if (length <= nLimit) {
        break;
      } else {
        nType++;
      }
    }

    if (nType > QRCodeLimitLength.length) {
      throw new Error("Too long data");
    }

    return nType;
  }

  function _getUTF8Length(sText) {
    var replacedText = encodeURI(sText).toString().replace(/\%[0-9a-fA-F]{2}/g, 'a');
    return replacedText.length + (replacedText.length != sText ? 3 : 0);
  }
  /**
   * @class _QRCode
   * @constructor
   * @example
   * new _QRCode(document.getElementById("test"), "http://jindo.dev.naver.com/collie");
   *
   * @example
   * var oQRCode = new _QRCode("test", {
   *    text : "http://naver.com",
   *    width : 128,
   *    height : 128
   * });
   *
   * oQRCode.clear(); // Clear the _QRCode.
   * oQRCode.makeCode("http://map.naver.com"); // Re-create the _QRCode.
   *
   * @param {HTMLElement|String} el target element or 'id' attribute of element.
   * @param {Object|String} vOption
   * @param {String} vOption.text _QRCode link data
   * @param {Number} [vOption.width=256]
   * @param {Number} [vOption.height=256]
   * @param {String} [vOption.colorDark="#000000"]
   * @param {String} [vOption.colorLight="#ffffff"]
   * @param {_QRCode.CorrectLevel} [vOption.correctLevel=_QRCode.CorrectLevel.H] [L|M|Q|H]
   */


  _QRCode = function _QRCode(el, vOption) {
    this._htOption = {
      width: 256,
      height: 256,
      typeNumber: 4,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRErrorCorrectLevel.H
    };

    if (typeof vOption === 'string') {
      vOption = {
        text: vOption
      };
    } // Overwrites options


    if (vOption) {
      for (var i in vOption) {
        this._htOption[i] = vOption[i];
      }
    }

    if (typeof el == "string") {
      el = document.getElementById(el);
    }

    if (this._htOption.useSVG) {
      Drawing = svgDrawer;
    }

    this._android = _getAndroid();
    this._el = el;
    this._oQRCode = null;
    this._oDrawing = new Drawing(this._el, this._htOption);

    if (this._htOption.text) {
      this.makeCode(this._htOption.text);
    }
  };
  /**
   * Make the _QRCode
   *
   * @param {String} sText link data
   */


  _QRCode.prototype.makeCode = function (sText) {
    this._oQRCode = new QRCodeModel(_getTypeNumber(sText, this._htOption.correctLevel), this._htOption.correctLevel);

    this._oQRCode.addData(sText);

    this._oQRCode.make();

    this._el.title = sText;

    this._oDrawing.draw(this._oQRCode);

    this.makeImage();
  };
  /**
   * Make the Image from Canvas element
   * - It occurs automatically
   * - Android below 3 doesn't support Data-URI spec.
   *
   * @private
   */


  _QRCode.prototype.makeImage = function () {
    if (typeof this._oDrawing.makeImage == "function" && (!this._android || this._android >= 3)) {
      this._oDrawing.makeImage();
    }
  };
  /**
   * Clear the _QRCode
   */


  _QRCode.prototype.clear = function () {
    this._oDrawing.clear();
  };
  /**
   * @name _QRCode.CorrectLevel
   */


  _QRCode.CorrectLevel = QRErrorCorrectLevel;
})();

function QRCode() {
  return _QRCode.apply(this, arguments);
}

QRCode.prototype = _QRCode.prototype;
QRCode.CorrectLevel = _QRCode.CorrectLevel;
},{}],"lib/reconnecting-websocket.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ReconnectingWebSocket = void 0;

// MIT License:
//
// Copyright (c) 2010-2012, Joe Walnes
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

/**
 * This behaves like a WebSocket in every way, except if it fails to connect,
 * or it gets disconnected, it will repeatedly poll until it successfully connects
 * again.
 *
 * It is API compatible, so when you have:
 *   ws = new WebSocket('ws://....');
 * you can replace with:
 *   ws = new ReconnectingWebSocket('ws://....');
 *
 * The event stream will typically look like:
 *  onconnecting
 *  onopen
 *  onmessage
 *  onmessage
 *  onclose // lost connection
 *  onconnecting
 *  onopen  // sometime later...
 *  onmessage
 *  onmessage
 *  etc...
 *
 * It is API compatible with the standard WebSocket API, apart from the following members:
 *
 * - `bufferedAmount`
 * - `extensions`
 * - `binaryType`
 *
 * Latest version: https://github.com/joewalnes/reconnecting-websocket/
 * - Joe Walnes
 *
 * Syntax
 * ======
 * var socket = new ReconnectingWebSocket(url, protocols, options);
 *
 * Parameters
 * ==========
 * url - The url you are connecting to.
 * protocols - Optional string or array of protocols.
 * options - See below
 *
 * Options
 * =======
 * Options can either be passed upon instantiation or set after instantiation:
 *
 * var socket = new ReconnectingWebSocket(url, null, { debug: true, reconnectInterval: 4000 });
 *
 * or
 *
 * var socket = new ReconnectingWebSocket(url);
 * socket.debug = true;
 * socket.reconnectInterval = 4000;
 *
 * debug
 * - Whether this instance should log debug messages. Accepts true or false. Default: false.
 *
 * automaticOpen
 * - Whether or not the websocket should attempt to connect immediately upon instantiation. The socket can be manually opened or closed at any time using ws.open() and ws.close().
 *
 * reconnectInterval
 * - The number of milliseconds to delay before attempting to reconnect. Accepts integer. Default: 1000.
 *
 * maxReconnectInterval
 * - The maximum number of milliseconds to delay a reconnection attempt. Accepts integer. Default: 30000.
 *
 * reconnectDecay
 * - The rate of increase of the reconnect delay. Allows reconnect attempts to back off when problems persist. Accepts integer or float. Default: 1.5.
 *
 * timeoutInterval
 * - The maximum time in milliseconds to wait for a connection to succeed before closing and retrying. Accepts integer. Default: 2000.
 *
 */
function factory() {
  if (!('WebSocket' in window)) {
    return;
  }

  function ReconnectingWebSocket(url, protocols, options) {
    // Default settings
    var settings = {
      /** Whether this instance should log debug messages. */
      debug: false,

      /** Whether or not the websocket should attempt to connect immediately upon instantiation. */
      automaticOpen: true,

      /** The number of milliseconds to delay before attempting to reconnect. */
      reconnectInterval: 1000,

      /** The maximum number of milliseconds to delay a reconnection attempt. */
      maxReconnectInterval: 30000,

      /** The rate of increase of the reconnect delay. Allows reconnect attempts to back off when problems persist. */
      reconnectDecay: 1.5,

      /** The maximum time in milliseconds to wait for a connection to succeed before closing and retrying. */
      timeoutInterval: 2000,

      /** The maximum number of reconnection attempts to make. Unlimited if null. */
      maxReconnectAttempts: null,

      /** The binary type, possible values 'blob' or 'arraybuffer', default 'blob'. */
      binaryType: 'blob'
    };

    if (!options) {
      options = {};
    } // Overwrite and define settings with options if they exist.


    for (var key in settings) {
      if (typeof options[key] !== 'undefined') {
        this[key] = options[key];
      } else {
        this[key] = settings[key];
      }
    } // These should be treated as read-only properties

    /** The URL as resolved by the constructor. This is always an absolute URL. Read only. */


    this.url = url;
    /** The number of attempted reconnects since starting, or the last successful connection. Read only. */

    this.reconnectAttempts = 0;
    /**
     * The current state of the connection.
     * Can be one of: WebSocket.CONNECTING, WebSocket.OPEN, WebSocket.CLOSING, WebSocket.CLOSED
     * Read only.
     */

    this.readyState = WebSocket.CONNECTING;
    /**
     * A string indicating the name of the sub-protocol the server selected; this will be one of
     * the strings specified in the protocols parameter when creating the WebSocket object.
     * Read only.
     */

    this.protocol = null; // Private state variables

    var self = this;
    var ws;
    var forcedClose = false;
    var timedOut = false;
    var eventTarget = document.createElement('div'); // Wire up "on*" properties as event handlers

    eventTarget.addEventListener('open', function (event) {
      self.onopen(event);
    });
    eventTarget.addEventListener('close', function (event) {
      self.onclose(event);
    });
    eventTarget.addEventListener('connecting', function (event) {
      self.onconnecting(event);
    });
    eventTarget.addEventListener('message', function (event) {
      self.onmessage(event);
    });
    eventTarget.addEventListener('error', function (event) {
      self.onerror(event);
    }); // Expose the API required by EventTarget

    this.addEventListener = eventTarget.addEventListener.bind(eventTarget);
    this.removeEventListener = eventTarget.removeEventListener.bind(eventTarget);
    this.dispatchEvent = eventTarget.dispatchEvent.bind(eventTarget);
    /**
     * This function generates an event that is compatible with standard
     * compliant browsers and IE9 - IE11
     *
     * This will prevent the error:
     * Object doesn't support this action
     *
     * http://stackoverflow.com/questions/19345392/why-arent-my-parameters-getting-passed-through-to-a-dispatched-event/19345563#19345563
     * @param s String The name that the event should use
     * @param args Object an optional object that the event will use
     */

    function generateEvent(s, args) {
      var evt = document.createEvent("CustomEvent");
      evt.initCustomEvent(s, false, false, args);
      return evt;
    }

    ;

    this.open = function (reconnectAttempt) {
      ws = new WebSocket(self.url, protocols || []);
      ws.binaryType = this.binaryType;

      if (reconnectAttempt) {
        if (this.maxReconnectAttempts && this.reconnectAttempts > this.maxReconnectAttempts) {
          return;
        }
      } else {
        eventTarget.dispatchEvent(generateEvent('connecting'));
        this.reconnectAttempts = 0;
      }

      if (self.debug || ReconnectingWebSocket.debugAll) {
        console.debug('ReconnectingWebSocket', 'attempt-connect', self.url);
      }

      var localWs = ws;
      var timeout = setTimeout(function () {
        if (self.debug || ReconnectingWebSocket.debugAll) {
          console.debug('ReconnectingWebSocket', 'connection-timeout', self.url);
        }

        timedOut = true;
        localWs.close();
        timedOut = false;
      }, self.timeoutInterval);

      ws.onopen = function (event) {
        clearTimeout(timeout);

        if (self.debug || ReconnectingWebSocket.debugAll) {
          console.debug('ReconnectingWebSocket', 'onopen', self.url);
        }

        self.protocol = ws.protocol;
        self.readyState = WebSocket.OPEN;
        self.reconnectAttempts = 0;
        var e = generateEvent('open');
        e.isReconnect = reconnectAttempt;
        reconnectAttempt = false;
        eventTarget.dispatchEvent(e);
      };

      ws.onclose = function (event) {
        clearTimeout(timeout);
        ws = null;

        if (forcedClose) {
          self.readyState = WebSocket.CLOSED;
          eventTarget.dispatchEvent(generateEvent('close'));
        } else {
          self.readyState = WebSocket.CONNECTING;
          var e = generateEvent('connecting');
          e.code = event.code;
          e.reason = event.reason;
          e.wasClean = event.wasClean;
          eventTarget.dispatchEvent(e);

          if (!reconnectAttempt && !timedOut) {
            if (self.debug || ReconnectingWebSocket.debugAll) {
              console.debug('ReconnectingWebSocket', 'onclose', self.url);
            }

            eventTarget.dispatchEvent(generateEvent('close'));
          }

          var timeout = self.reconnectInterval * Math.pow(self.reconnectDecay, self.reconnectAttempts);
          setTimeout(function () {
            self.reconnectAttempts++;
            self.open(true);
          }, timeout > self.maxReconnectInterval ? self.maxReconnectInterval : timeout);
        }
      };

      ws.onmessage = function (event) {
        if (self.debug || ReconnectingWebSocket.debugAll) {
          console.debug('ReconnectingWebSocket', 'onmessage', self.url, event.data);
        }

        var e = generateEvent('message');
        e.data = event.data;
        eventTarget.dispatchEvent(e);
      };

      ws.onerror = function (event) {
        if (self.debug || ReconnectingWebSocket.debugAll) {
          console.debug('ReconnectingWebSocket', 'onerror', self.url, event);
        }

        eventTarget.dispatchEvent(generateEvent('error'));
      };
    }; // Whether or not to create a websocket upon instantiation


    if (this.automaticOpen == true) {
      this.open(false);
    }
    /**
     * Transmits data to the server over the WebSocket connection.
     *
     * @param data a text string, ArrayBuffer or Blob to send to the server.
     */


    this.send = function (data) {
      if (ws) {
        if (self.debug || ReconnectingWebSocket.debugAll) {
          console.debug('ReconnectingWebSocket', 'send', self.url, data);
        }

        return ws.send(data);
      } else {
        throw 'INVALID_STATE_ERR : Pausing to reconnect websocket';
      }
    };
    /**
     * Closes the WebSocket connection or connection attempt, if any.
     * If the connection is already CLOSED, this method does nothing.
     */


    this.close = function (code, reason) {
      // Default CLOSE_NORMAL code
      if (typeof code == 'undefined') {
        code = 1000;
      }

      forcedClose = true;

      if (ws) {
        ws.close(code, reason);
      }
    };
    /**
     * Additional public API method to refresh the connection if still open (close, re-open).
     * For example, if the app suspects bad data / missed heart beats, it can try to refresh.
     */


    this.refresh = function () {
      if (ws) {
        ws.close();
      }
    };
  }
  /**
   * An event listener to be called when the WebSocket connection's readyState changes to OPEN;
   * this indicates that the connection is ready to send and receive data.
   */


  ReconnectingWebSocket.prototype.onopen = function (event) {};
  /** An event listener to be called when the WebSocket connection's readyState changes to CLOSED. */


  ReconnectingWebSocket.prototype.onclose = function (event) {};
  /** An event listener to be called when a connection begins being attempted. */


  ReconnectingWebSocket.prototype.onconnecting = function (event) {};
  /** An event listener to be called when a message is received from the server. */


  ReconnectingWebSocket.prototype.onmessage = function (event) {};
  /** An event listener to be called when an error occurs. */


  ReconnectingWebSocket.prototype.onerror = function (event) {};
  /**
   * Whether all instances of ReconnectingWebSocket should log debug messages.
   * Setting this to true is the equivalent of setting all instances of ReconnectingWebSocket.debug to true.
   */


  ReconnectingWebSocket.debugAll = false;
  ReconnectingWebSocket.CONNECTING = WebSocket.CONNECTING;
  ReconnectingWebSocket.OPEN = WebSocket.OPEN;
  ReconnectingWebSocket.CLOSING = WebSocket.CLOSING;
  ReconnectingWebSocket.CLOSED = WebSocket.CLOSED;
  return ReconnectingWebSocket;
}

;
var ReconnectingWebSocket = factory();
exports.ReconnectingWebSocket = ReconnectingWebSocket;
},{}],"model/chainevents.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.listenForTransactions = listenForTransactions;
exports.clearListener = clearListener;

var _reconnectingWebsocket = require("../lib/reconnecting-websocket.js");

var _chain = require("./chain.js");

var WS_URL = _chain.WS_BASE_URL + "streams/valid_transactions";
var listeners = new Map();
var websocket = null;

function initWebSocket() {
  websocket = new _reconnectingWebsocket.ReconnectingWebSocket(WS_URL);
  websocket.onmessage = wsMessageHandler;
}

function wsMessageHandler(message) {
  var transactionRef = JSON.parse(message.data);
  var interestedListeners = listeners.get(transactionRef.asset_id);

  if (!interestedListeners) {
    return;
  }

  (0, _chain.getTransaction)(transactionRef.transaction_id).then(function (transaction) {
    interestedListeners.forEach(function (listener) {
      listener.handler(transaction);
    });
  });
}

function addListener(listener) {
  listener.assetIds.forEach(function (assetId) {
    listeners.has(assetId) || listeners.set(assetId, []);
    listeners.get(assetId).push(listener);
  });
  return listener;
}

function listenForTransactions(assetIds, handler) {
  if (!websocket) initWebSocket();
  return addListener({
    assetIds: assetIds,
    handler: handler,
    id: String(Date.now()) + Math.random()
  });
}

function clearListener(listener) {
  listener.assetIds.forEach(function (assetId) {
    var idx = listeners.get(assetId).indexOf(listener);

    if (idx !== -1) {
      listeners.get(assetId).splice(idx, 1);
    }
  });
}
},{"../lib/reconnecting-websocket.js":"lib/reconnecting-websocket.js","./chain.js":"model/chain.js"}],"view/entrancepage.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.EntrancePage = void 0;

var _main = require("../main.js");

var _chain = require("../model/chain.js");

var _token = require("../model/token.js");

var _qrcode = require("../lib/qrcode.js");

var _chainevents = require("../model/chainevents.js");

function createVisitor() {
  var visitor = (0, _chain.createIdentity)();
  return (0, _token.giveTokens)(_token.selectedToken, visitor.publicKey, 11).then(function (res) {
    return visitor;
  });
}

function createVisitorQR(visitor) {
  var target = location.origin + location.pathname + "?keys=" + visitor.publicKey + "," + visitor.privateKey + "#keyload";
  console.log(target);
  document.getElementById("qrcode").innerHTML = '';
  var qrcode = new _qrcode.QRCode(document.getElementById("qrcode"), {
    text: target,
    width: 384,
    height: 384,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: _qrcode.QRCode.CorrectLevel.H
  });
}

var EntrancePage = Vue.component('entrance-page', {
  data: function data() {
    return {
      selectedToken: _token.selectedToken,
      txListeners: [],
      lastVisitorPubKey: null
    };
  },
  created: function created() {
    var _this = this;

    this.txListeners.push((0, _chainevents.listenForTransactions)([_token.selectedToken.id], function (tx) {
      if (tx.inputs[0].owners_before[0] == _this.lastVisitorPubKey) {
        _this.newVisitor();
      }
    }));
    this.newVisitor();
  },
  beforeDestroy: function beforeDestroy() {
    this.txListeners.forEach(_chainevents.clearListener);
  },
  methods: {
    newVisitor: function newVisitor() {
      var _this2 = this;

      createVisitor().then(function (visitor) {
        createVisitorQR(visitor);
        _this2.lastVisitorPubKey = visitor.publicKey;
      });
    },
    host: function host() {
      _main.app.route("");
    }
  },
  template: "\n  <v-content>\n    <v-container fluid>\n<div>\n    <div v-if=\"!selectedToken\">No token found</div>\n    <div id=\"qrcode\" style=\"margin: 20px\"></div>\n    <v-btn v-if=\"selectedToken\" @click=\"newVisitor()\">New Visitor</v-btn>\n    <v-btn @click=\"host()\">Back to Host View</v-btn>\n</div>\n"
});
exports.EntrancePage = EntrancePage;
},{"../main.js":"main.js","../model/chain.js":"model/chain.js","../model/token.js":"model/token.js","../lib/qrcode.js":"lib/qrcode.js","../model/chainevents.js":"model/chainevents.js"}],"view/presentationlist.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PresentationList = void 0;

var _token = require("../model/token.js");

var _presentation = require("../model/presentation.js");

var _main = require("../main.js");

var _chainevents = require("../model/chainevents.js");

var PresentationList = Vue.component('presentation-list', {
  props: {
    host: Boolean,
    voteForRunning: Function
  },
  data: function data() {
    return {
      presentations: [],
      runningPresentation: null
    };
  },
  methods: {
    update: function update() {
      var _this = this;

      if (_token.selectedToken) {
        (0, _presentation.findPresentations)().then(function (presentations) {
          _this.presentations = presentations;
        }).then(function () {
          (0, _presentation.findRunningPresentation)().then(function (running) {
            _this.runningPresentation = running;
          });
        });
      }
    },
    start: function start(presentation) {
      (0, _presentation.startPresentation)(presentation).then(function () {
        document.getElementById("bellSound").play();

        _main.app.route("timer");
      });
    },
    vote: function vote() {
      this.$emit("vote");
    }
  },
  created: function created() {
    var _this2 = this;

    this.txListeners = [];
    this.update();
    this.txListeners.push((0, _chainevents.listenForTransactions)([_token.selectedToken.id], this.update.bind(this)));
    (0, _presentation.findPresentations)().then(function (presentations) {
      _this2.txListeners.push((0, _chainevents.listenForTransactions)(presentations.map(function (p) {
        return p.id;
      }), _this2.update.bind(_this2)));
    });
  },
  beforeDestroy: function beforeDestroy() {
    this.txListeners.forEach(_chainevents.clearListener);
  },
  template: "\n<v-content>\n    <v-container fluid>\n        <div>\n            <div v-if=\"runningPresentation\">Running presentation:\n                <div><b>{{ runningPresentation.asset.data.title }} - {{ runningPresentation.asset.data.presenterName }}</b></div> \n                <div>{{ runningPresentation.asset.data.abstract }}</div>\n                 <v-btn v-if=\"voteForRunning\" @click=\"vote()\">Vote</v-btn>\n            </div>\n            --\n            <ul>\n                <li v-for=\"pres in presentations\">\n                    <div><b>{{ pres.asset.data.title }} - {{ pres.asset.data.presenterName }}</b></div> \n                    <div>{{ pres.asset.data.abstract }}</div>\n                    <v-btn v-if=\"host\" @click=\"start(pres)\">Start</v-btn>\n                </li>\n            </ul>\n    </div>\n    </v-container>\n</v-content>\n    "
});
exports.PresentationList = PresentationList;
},{"../model/token.js":"model/token.js","../model/presentation.js":"model/presentation.js","../main.js":"main.js","../model/chainevents.js":"model/chainevents.js"}],"view/visitorpage.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.VisitorPage = void 0;

var _token = require("../model/token.js");

var _chain = require("../model/chain.js");

var _presentationlist = require("./presentationlist.js");

var _presentation = require("../model/presentation.js");

var VisitorPage = Vue.component('visitor-page', {
  data: function data() {
    return {
      selectedToken: _token.selectedToken,
      me: null,
      tokens: null,
      voteInProgress: false
    };
  },
  created: function created() {
    this.update();
  },
  methods: {
    vote: function vote() {
      var _this = this;

      this.voteInProgress = true;
      (0, _presentation.voteForRunning)().finally(function () {
        return _this.voteInProgress = false;
      }).then(this.update.bind(this));
    },
    update: function update() {
      var _this2 = this;

      this.me = (0, _chain.me)();
      (0, _token.getOwnedTokens)((0, _chain.me)().publicKey).then(function (ownedTokens) {
        _this2.tokens = ownedTokens;
        return (0, _token.selectTokenById)(_this2.tokens.transactions[0].asset.id);
      });
    }
  },
  template: "\n<v-content>\n    <v-container fluid>\n        <div v-if=\"tokens\">Tokens: {{tokens.total}}</div>\n        <presentation-list v-if=\"!voteInProgress\" voteForRunning=true @vote=\"vote\" ></presentation-list>\n        <div v-if=\"voteInProgress\">Committing vote...</div>\n    </v-container>\n</v-content>\n"
});
exports.VisitorPage = VisitorPage;
},{"../model/token.js":"model/token.js","../model/chain.js":"model/chain.js","./presentationlist.js":"view/presentationlist.js","../model/presentation.js":"model/presentation.js"}],"view/timerpage.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TimerPage = void 0;

var _main = require("../main.js");

var _presentation = require("../model/presentation.js");

var _chain = require("../model/chain.js");

function twoDigit(num) {
  return num < 10 ? "0" + num : "" + num;
}

function minsecs(totalsecs) {
  var mins = Math.floor(totalsecs / 60);
  var secs = totalsecs - mins * 60;
  return twoDigit(mins) + ":" + twoDigit(secs);
}

var TimerPage = Vue.component('timer-page', {
  data: function data() {
    return {
      _interval: null,
      startTS: 0,
      grantedLength: 0,
      runningForSecs: 0,
      presentation: null
    };
  },
  computed: {
    timer: function timer() {
      return minsecs(this.startTS ? this.runningForSecs : 0);
    },
    granted: function granted() {
      return minsecs(this.startTS ? this.grantedLength : 0);
    },
    runnedOut: function runnedOut() {
      return this.grantedLength + 1 < this.runningForSecs;
    }
  },
  created: function created() {
    this._interval = setInterval(this.step.bind(this), 1000);
    this.update();
  },
  beforeDestroy: function beforeDestroy() {
    clearInterval(this._interval);
  },
  methods: {
    step: function step() {
      this.runningForSecs = (0, _chain.getChainTimeMillis)() - this.startTS;

      if (this.runningForSecs === this.grantedLength) {
        this.autoGrant();
      }
    },
    host: function host() {
      _main.app.route("");
    },
    autoGrant: function autoGrant() {
      var _this = this;

      (0, _presentation.autoGrant)(this.presentation, 5).then(function (result) {
        if (!result) {
          console.log("No more time granted");
          document.getElementById("bellSound").play();
        }

        _this.update();
      });
    },
    update: function update() {
      var _this2 = this;

      (0, _presentation.findRunningPresentation)().then(function (presentation) {
        _this2.presentation = presentation;
        _this2.grantedLength = presentation.metadata.grantedLength;
        _this2.startTS = presentation.metadata.startTS;
      });
    }
  },
  template: "\n<v-content>\n    <v-container fluid>\n        <div>\n            <div class=\"display-4\"><div v-bind:class=\"{ runnedOut: runnedOut }\">{{timer}}</div></div>\n            <div>Granted: {{granted}}</div>\n            <v-btn @click=\"host()\">Host view</v-btn>\n        </div>\n    </v-container>\n</v-content>\n"
});
exports.TimerPage = TimerPage;
},{"../main.js":"main.js","../model/presentation.js":"model/presentation.js","../model/chain.js":"model/chain.js"}],"view/keyloadpage.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.KeyLoadPage = void 0;

var _token = require("../model/token.js");

var _chain = require("../model/chain.js");

var KeyLoadPage = Vue.component('keyload-page', {
  data: function data() {
    return {
      selectedToken: _token.selectedToken,
      me: null,
      tokens: null,
      noTokensFound: false
    };
  },
  created: function created() {
    this.update();
  },
  methods: {
    update: function update() {
      var _this = this;

      this.me = (0, _chain.me)();
      (0, _token.getOwnedTokens)((0, _chain.me)().publicKey).then(function (ownedTokens) {
        _this.tokens = ownedTokens;

        if (!ownedTokens.total) {
          throw "Zero tokens!";
        }

        return (0, _token.selectTokenById)(_this.tokens.transactions[0].asset.id).then(_token.transferAllToNewIdentity).then(function () {
          document.location.href = document.location.pathname + '#visitor';
        });
      }).catch(function () {
        return _this.noTokensFound = true;
      });
    }
  },
  template: "\n<v-content>\n    <v-container fluid>\n        <div v-if=\"tokens && !noTokensFound\">Creating identity and transferrig {{tokens.total}} tokens...</div>\n        <div v-if=\"noTokensFound\">No tokens found, maybe QR code was already used</div>\n    </v-container>\n</v-content>\n"
});
exports.KeyLoadPage = KeyLoadPage;
},{"../model/token.js":"model/token.js","../model/chain.js":"model/chain.js"}],"main.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.app = void 0;

var _hostpage = require("./view/hostpage.js");

var _entrancepage = require("./view/entrancepage.js");

var _visitorpage = require("./view/visitorpage.js");

var _timerpage = require("./view/timerpage.js");

var _keyloadpage = require("./view/keyloadpage.js");

var NotFound = {
  template: '<p>Page not found</p>'
};
var routes = {
  '': _hostpage.HostPage,
  'visitor': _visitorpage.VisitorPage,
  'entrance': _entrancepage.EntrancePage,
  'timer': _timerpage.TimerPage,
  'keyload': _keyloadpage.KeyLoadPage
};
var app = new Vue({
  el: '#app',
  data: {
    currentRoute: window.location.hash.substr(1)
  },
  methods: {
    route: function route(newRoute) {
      history.pushState(null, "", '#' + newRoute);
      this.currentRoute = newRoute;
    }
  },
  computed: {
    ViewComponent: function ViewComponent() {
      return routes[this.currentRoute] || NotFound;
    }
  },
  render: function render(h) {
    return h(this.ViewComponent);
  }
});
exports.app = app;
},{"./view/hostpage.js":"view/hostpage.js","./view/entrancepage.js":"view/entrancepage.js","./view/visitorpage.js":"view/visitorpage.js","./view/timerpage.js":"view/timerpage.js","./view/keyloadpage.js":"view/keyloadpage.js"}],"../../bin/node-v10.14.1-linux-x64/lib/node_modules/parcel-bundler/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;

function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };
  module.bundle.hotData = null;
}

module.bundle.Module = Module;
var checkedAssets, assetsToAccept;
var parent = module.bundle.parent;

if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = "" || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "36455" + '/');

  ws.onmessage = function (event) {
    checkedAssets = {};
    assetsToAccept = [];
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      var handled = false;
      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          var didAccept = hmrAcceptCheck(global.parcelRequire, asset.id);

          if (didAccept) {
            handled = true;
          }
        }
      }); // Enable HMR for CSS by default.

      handled = handled || data.assets.every(function (asset) {
        return asset.type === 'css' && asset.generated.js;
      });

      if (handled) {
        console.clear();
        data.assets.forEach(function (asset) {
          hmrApply(global.parcelRequire, asset);
        });
        assetsToAccept.forEach(function (v) {
          hmrAcceptRun(v[0], v[1]);
        });
      } else {
        window.location.reload();
      }
    }

    if (data.type === 'reload') {
      ws.close();

      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
      removeErrorOverlay();
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);
      removeErrorOverlay();
      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}

function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);

  if (overlay) {
    overlay.remove();
  }
}

function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID; // html encode message and stack trace

  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;
  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';
  return overlay;
}

function getParents(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];

      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAcceptCheck(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAcceptCheck(bundle.parent, id);
  }

  if (checkedAssets[id]) {
    return;
  }

  checkedAssets[id] = true;
  var cached = bundle.cache[id];
  assetsToAccept.push([bundle, id]);

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    return true;
  }

  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAcceptCheck(global.parcelRequire, id);
  });
}

function hmrAcceptRun(bundle, id) {
  var cached = bundle.cache[id];
  bundle.hotData = {};

  if (cached) {
    cached.hot.data = bundle.hotData;
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }

  delete bundle.cache[id];
  bundle(id);
  cached = bundle.cache[id];

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });

    return true;
  }
}
},{}]},{},["../../bin/node-v10.14.1-linux-x64/lib/node_modules/parcel-bundler/src/builtins/hmr-runtime.js","main.js"], null)
//# sourceMappingURL=/main.1f19ae8e.js.map