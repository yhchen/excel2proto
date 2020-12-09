"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FMT26 = exports.ExportWrapperMap = exports.ExecGroupFilter = exports.IExportWrapper = exports.SetLineBreaker = exports.LineBreaker = exports.ExportExcelDataMap = exports.SheetDataTable = exports.ESheetRowType = exports.AsyncWorkMonitor = exports.TimeUsed = exports.SetBeforeExistHandler = exports.StrNotEmpty = exports.exceptionRecord = exports.exception = exports.warn = exports.debug = exports.logger = exports.brightWhite = exports.green = exports.red = exports.yellow = exports.orange_ul = exports.yellow_ul = void 0;
const fs = __importStar(require("fs-extra"));
var lodash_1 = require("lodash");
Object.defineProperty(exports, "isString", { enumerable: true, get: function () { return lodash_1.isString; } });
Object.defineProperty(exports, "isNumber", { enumerable: true, get: function () { return lodash_1.isNumber; } });
Object.defineProperty(exports, "isArray", { enumerable: true, get: function () { return lodash_1.isArray; } });
Object.defineProperty(exports, "isObject", { enumerable: true, get: function () { return lodash_1.isObject; } });
Object.defineProperty(exports, "isBoolean", { enumerable: true, get: function () { return lodash_1.isBoolean; } });
var moment_1 = require("moment");
Object.defineProperty(exports, "isDate", { enumerable: true, get: function () { return moment_1.isDate; } });
const util_1 = require("util");
const config_1 = require("./config");
////////////////////////////////////////////////////////////////////////////////
//#region console color
const chalk_1 = __importDefault(require("chalk"));
exports.yellow_ul = chalk_1.default.yellow.underline; //yellow under line
exports.orange_ul = chalk_1.default.magentaBright.underline.bold; //orange under line
exports.yellow = chalk_1.default.yellow;
exports.red = chalk_1.default.redBright;
exports.green = chalk_1.default.greenBright;
exports.brightWhite = chalk_1.default.whiteBright.bold;
function logger(...args) {
    console.log(...args);
}
exports.logger = logger;
function debug(...args) {
    if (!config_1.gCfg.EnableDebugOutput)
        return;
    logger(...args);
}
exports.debug = debug;
function warn(txt) {
    const LOG_CTX = `${exports.orange_ul(`+ [WARN] `)} ${txt}\n`;
    ExceptionLogLst.push(LOG_CTX);
    logger(LOG_CTX);
}
exports.warn = warn;
let ExceptionLogLst = new Array();
function exception(txt, ex) {
    exceptionRecord(txt, ex);
    throw txt;
}
exports.exception = exception;
// record exception not throw.
function exceptionRecord(txt, ex) {
    const LOG_CTX = `${exports.red(`+ [ERROR] `)} ${txt}\n${exports.red(ex ? ex : '')}\n`;
    ExceptionLogLst.push(LOG_CTX);
    logger(LOG_CTX);
}
exports.exceptionRecord = exceptionRecord;
//#endregion
////////////////////////////////////////////////////////////////////////////////
//#region base function
function StrNotEmpty(s) {
    if (util_1.isString(s)) {
        return s.trim().length > 0;
    }
    return false;
}
exports.StrNotEmpty = StrNotEmpty;
//#endregion
////////////////////////////////////////////////////////////////////////////////
//#region Time Profile
/************* total use tick ****************/
let BeforeExistHandler;
function SetBeforeExistHandler(handler) {
    BeforeExistHandler = handler;
}
exports.SetBeforeExistHandler = SetBeforeExistHandler;
var TimeUsed;
(function (TimeUsed) {
    function LastElapse() {
        const Now = Date.now();
        const elpase = Now - _LastAccess;
        _LastAccess = Now;
        return elpase.toString() + 'ms';
    }
    TimeUsed.LastElapse = LastElapse;
    function TotalElapse() {
        return ((Date.now() - _StartTime) / 1000).toString() + 's';
    }
    TimeUsed.TotalElapse = TotalElapse;
    const _StartTime = Date.now();
    let _LastAccess = _StartTime;
    process.addListener('beforeExit', () => {
        process.removeAllListeners('beforeExit');
        const HasException = ExceptionLogLst.length > 0;
        if (BeforeExistHandler && !HasException) {
            BeforeExistHandler();
        }
        const color = HasException ? exports.red : exports.green;
        logger(color(`----------------------------------------`));
        logger(color(`-          ${HasException ? 'Got Exception !!!' : '    Well Done    '}           -`));
        logger(color(`----------------------------------------`));
        logger(`Total Use Tick : "${exports.yellow_ul(TotalElapse())}"`);
        if (HasException) {
            logger(exports.red("Exception Logs:"));
            logger(ExceptionLogLst.join('\n'));
            process.exit(-1);
        }
        else {
            process.exit(0);
        }
    });
})(TimeUsed = exports.TimeUsed || (exports.TimeUsed = {}));
//#endregion
////////////////////////////////////////////////////////////////////////////////
//#region async Worker Monitor
class AsyncWorkMonitor {
    constructor() {
        this._leftCnt = 0;
    }
    addWork(cnt = 1) {
        this._leftCnt += cnt;
    }
    decWork(cnt = 1) {
        this._leftCnt -= cnt;
    }
    WaitAllWorkDone() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._leftCnt <= 0)
                return true;
            while (true) {
                if (this._leftCnt <= 0) {
                    return true;
                }
                yield this.delay();
            }
        });
    }
    delay(ms = 0) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => setTimeout(resolve, ms));
        });
    }
}
exports.AsyncWorkMonitor = AsyncWorkMonitor;
//#endregion
////////////////////////////////////////////////////////////////////////////////
//#region Datas
// excel gen data table
var ESheetRowType;
(function (ESheetRowType) {
    ESheetRowType[ESheetRowType["header"] = 1] = "header";
    ESheetRowType[ESheetRowType["type"] = 2] = "type";
    ESheetRowType[ESheetRowType["data"] = 3] = "data";
    ESheetRowType[ESheetRowType["comment"] = 4] = "comment";
})(ESheetRowType = exports.ESheetRowType || (exports.ESheetRowType = {}));
class SheetDataTable {
    constructor(name, filename) {
        this.arrTypeHeader = new Array();
        this.arrHeaderNameMap = new Map();
        this.arrValues = new Array();
        this.columnKeysMap = new Map();
        this.name = name;
        this.filename = filename;
    }
    // check sheet column contains key
    checkColumnContainsValue(columnName, value) {
        if (!this.columnKeysMap.has(columnName)) {
            if (!this.makeColumnKeyMap(columnName)) {
                exception(`CALL [checkColumnContainsValue] failure: sheet column name ${exports.yellow_ul(this.name + '.' + columnName)}`);
                return false;
            }
        }
        let s = this.columnKeysMap.get(columnName);
        return s != undefined && s.has(value);
    }
    containsColumName(name) {
        for (const header of this.arrTypeHeader) {
            if (header.name == name)
                return true;
        }
        return false;
    }
    makeColumnKeyMap(columnName) {
        for (let i = 0; i < this.arrTypeHeader.length; ++i) {
            if (this.arrTypeHeader[i].name == columnName) {
                const s = new Set();
                for (const row of this.arrValues) {
                    if (row.type != ESheetRowType.data)
                        continue;
                    s.add(row.values[i]);
                }
                this.columnKeysMap.set(columnName, s);
                return true;
            }
        }
        return false;
    }
}
exports.SheetDataTable = SheetDataTable;
// all export data here
exports.ExportExcelDataMap = new Map();
// line breaker
exports.LineBreaker = '\n';
function SetLineBreaker(v) {
    exports.LineBreaker = v;
}
exports.SetLineBreaker = SetLineBreaker;
// export template
class IExportWrapper {
    constructor(exportCfg) {
        this._exportCfg = exportCfg;
    }
    // translate col name to target name
    TranslateColName(name) {
        if (!this._exportCfg.NameTranslate) {
            return name;
        }
        const newName = this._exportCfg.NameTranslate[name];
        return newName !== null && newName !== void 0 ? newName : name;
    }
    ExportToAsync(dt, endCallBack) {
        return __awaiter(this, void 0, void 0, function* () {
            let ok = false;
            try {
                ok = yield this.ExportTo(dt);
            }
            catch (ex) {
                // do nothing...
            }
            if (endCallBack) {
                endCallBack(ok);
            }
            return ok;
        });
    }
    ExportToGlobalAsync(endCallBack) {
        return __awaiter(this, void 0, void 0, function* () {
            let ok = false;
            try {
                ok = yield this.ExportGlobal();
            }
            catch (ex) {
                // do nothing...
            }
            if (endCallBack) {
                endCallBack(ok);
            }
            return ok;
        });
    }
    CreateDir(outdir) {
        if (!fs.existsSync(outdir)) {
            fs.ensureDirSync(outdir);
            return fs.existsSync(outdir);
        }
        return true;
    }
    IsFile(s) {
        const ext = this._exportCfg.ExtName || this.DefaultExtName;
        const idx = s.lastIndexOf(ext);
        if (idx < 0)
            return false;
        return (idx + ext.length == s.length);
    }
}
exports.IExportWrapper = IExportWrapper;
function ExecGroupFilter(arrGrpFilters, arrHeader) {
    let result = new Array();
    if (arrGrpFilters.length <= 0)
        return result;
    // translate
    const RealFilter = new Array();
    for (const ele of arrGrpFilters) {
        let found = false;
        for (const name in config_1.gCfg.ColorToGroupMap) {
            if (config_1.gCfg.ColorToGroupMap[name] == ele) {
                RealFilter.push(name);
                found = true;
                break;
            }
        }
        if (!found) {
            logger(`Filter Name ${exports.yellow_ul(ele)} Not foud In ${exports.yellow_ul('ColorToGroupMap')}. Ignore It!`);
        }
    }
    // filter
    if (RealFilter.includes('*')) {
        return arrHeader;
    }
    for (const header of arrHeader) {
        if (RealFilter.includes(header.color)) {
            result.push(header);
        }
    }
    return result;
}
exports.ExecGroupFilter = ExecGroupFilter;
exports.ExportWrapperMap = new Map([
    ['csv', require('./export/export_to_csv')],
    ['csharp', require('./export/export_to_csharp')],
    ['json', require('./export/export_to_json')],
    ['js', require('./export/export_to_js')],
    ['tsd', require('./export/export_to_tsd')],
    ['lua', require('./export/export_to_lua')],
    ['jsonline', require('./export/export_to_json_line')],
    ['proto3', require('./export/export_to_proto3')],
]);
//#endregion
////////////////////////////////////////////////////////////////////////////////
//#region Format Converter
var FMT26;
(function (FMT26) {
    const WORDS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    function NumToS26(num) {
        let result = "";
        ++num;
        while (num > 0) {
            let m = num % 26;
            if (m == 0)
                m = 26;
            result = String.fromCharCode(m + 64) + result;
            num = (num - m) / 26;
        }
        return result;
    }
    FMT26.NumToS26 = NumToS26;
    function S26ToNum(str) {
        let result = 0;
        let ss = str.toUpperCase();
        for (let i = str.length - 1, j = 1; i >= 0; i--, j *= 26) {
            let c = ss[i];
            if (c < 'A' || c > 'Z')
                return 0;
            result += (c.charCodeAt(0) - 64) * j;
        }
        return result;
    }
    FMT26.S26ToNum = S26ToNum;
    function StringToColRow(str) {
        let ret = { row: 0, col: 0 };
        for (let i = 0; i < str.length; ++i) {
            if (WORDS.indexOf(str[i]) < 0) {
                ret.row = parseInt(str.substr(i));
                ret.col = S26ToNum(str.substr(0, i));
                break;
            }
        }
        return ret;
    }
    FMT26.StringToColRow = StringToColRow;
})(FMT26 = exports.FMT26 || (exports.FMT26 = {}));
//#endregion
//# sourceMappingURL=utils.js.map