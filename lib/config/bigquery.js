"use strict";
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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.monitorQuery = exports.bigquery = exports.bigQueryConfig = void 0;
var bigquery_1 = require("@google-cloud/bigquery");
// Configuração centralizada do BigQuery
exports.bigQueryConfig = {
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    credentials: {
        client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
        private_key: (_a = process.env.GOOGLE_CLOUD_PRIVATE_KEY) === null || _a === void 0 ? void 0 : _a.replace(/\\n/g, '\n'),
    },
    // Configurações de performance e monitoramento
    maximumBytesBilled: process.env.BIGQUERY_MAX_BYTES_BILLED ?
        parseInt(process.env.BIGQUERY_MAX_BYTES_BILLED) : 1000000000, // 1GB default
    location: 'US',
    jobTimeoutMs: 30000, // 30 segundos
    retryOptions: {
        retryDelayMultiplier: 2,
        totalTimeout: 60000, // 1 minuto
        maxRetries: 3
    },
    query: {
        useQueryCache: true,
        useLegacySql: false
    }
};
// Instância singleton do BigQuery
exports.bigquery = new bigquery_1.BigQuery(exports.bigQueryConfig);
// Monitoramento de queries
var monitorQuery = function (query_1) {
    var args_1 = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args_1[_i - 1] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([query_1], args_1, true), void 0, function (query, options) {
        var startTime, job, rows, metadata, statistics, error_1;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    startTime = Date.now();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    return [4 /*yield*/, exports.bigquery.createQueryJob(__assign(__assign({ query: query }, options), exports.bigQueryConfig.query))];
                case 2:
                    job = (_a.sent())[0];
                    return [4 /*yield*/, job.getQueryResults()];
                case 3:
                    rows = (_a.sent())[0];
                    return [4 /*yield*/, job.getMetadata()];
                case 4:
                    metadata = _a.sent();
                    statistics = metadata[0].statistics;
                    console.log('BigQuery Query Stats:', {
                        queryId: job.id,
                        duration: Date.now() - startTime,
                        bytesProcessed: statistics.totalBytesProcessed,
                        rowsReturned: rows.length,
                        cacheHit: statistics.query.cacheHit,
                        timestamp: new Date().toISOString(),
                        environment: process.env.NODE_ENV
                    });
                    return [2 /*return*/, rows];
                case 5:
                    error_1 = _a.sent();
                    console.error('BigQuery Query Error:', {
                        error: error_1 instanceof Error ? error_1.message : 'Unknown error',
                        query: query,
                        duration: Date.now() - startTime,
                        timestamp: new Date().toISOString(),
                        environment: process.env.NODE_ENV
                    });
                    throw error_1;
                case 6: return [2 /*return*/];
            }
        });
    });
};
exports.monitorQuery = monitorQuery;
