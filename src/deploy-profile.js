"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = void 0;
var dcl_catalyst_client_1 = require("dcl-catalyst-client");
var fetch_component_1 = require("@well-known-components/fetch-component");
var fs = require("fs");
var env_config_provider_1 = require("@well-known-components/env-config-provider");
var crypto_1 = require("@dcl/crypto");
var schemas_1 = require("@dcl/schemas");
var utils_js_1 = require("./utils.js");
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var config, _a, signingKey, peerUrl, identity, fetcher, contentClient, entityJson, entityFiles, _b, entityId, files, signature, authChain, result, _c, _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0: return [4 /*yield*/, (0, env_config_provider_1.createDotEnvConfigComponent)({
                        path: ['.env.default', '.env']
                    })];
                case 1:
                    config = _f.sent();
                    return [4 /*yield*/, Promise.all([
                            config.requireString('DCL_PRIVATE_KEY'),
                            config.requireString('CONTENT_SERVER_URL')
                        ])];
                case 2:
                    _a = _f.sent(), signingKey = _a[0], peerUrl = _a[1];
                    return [4 /*yield*/, (0, utils_js_1.getIdentity)(signingKey)];
                case 3:
                    identity = _f.sent();
                    console.log("Signing address: ".concat(identity.address));
                    fetcher = (0, fetch_component_1.createFetchComponent)();
                    contentClient = (0, dcl_catalyst_client_1.createContentClient)({ url: peerUrl, fetcher: fetcher });
                    entityJson = JSON.parse(fs.readFileSync('etc/profiles/profile.json').toString());
                    entityFiles = new Map();
                    entityFiles.set('body.png', fs.readFileSync('etc/profiles/body.png'));
                    entityFiles.set('face256.png', fs.readFileSync('etc/profiles/face256.png'));
                    return [4 /*yield*/, dcl_catalyst_client_1.DeploymentBuilder.buildEntity({
                            type: schemas_1.EntityType.PROFILE,
                            files: entityFiles,
                            pointers: [identity.address],
                            metadata: entityJson,
                            timestamp: Date.now()
                        })];
                case 4:
                    _b = _f.sent(), entityId = _b.entityId, files = _b.files;
                    console.log("Entity ID: ".concat(entityId));
                    signature = crypto_1.Authenticator.createSignature(identity, entityId);
                    authChain = crypto_1.Authenticator.createSimpleAuthChain(entityId, identity.address, signature);
                    return [4 /*yield*/, contentClient.deploy({
                            files: files,
                            entityId: entityId,
                            authChain: authChain
                        })];
                case 5:
                    result = (_f.sent());
                    _d = (_c = console).log;
                    _e = [result.status];
                    return [4 /*yield*/, result.json()];
                case 6:
                    _d.apply(_c, _e.concat([_f.sent()]));
                    return [2 /*return*/];
            }
        });
    });
}
exports.main = main;
main().catch(console.error);
