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
Object.defineProperty(exports, "__esModule", { value: true });
exports.execute = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra-promise"));
const utils = __importStar(require("./utils"));
const config_1 = require("./config");
const excel_utils_1 = require("./excel_utils");
const CHighTypeChecker_1 = require("./CHighTypeChecker");
const export_to_proto3 = __importStar(require("./export/export_to_proto3"));
const gExportWrapperLst = new Array();
function InitEnv() {
    for (const exportCfg of config_1.gCfg.Export) {
        const Exportor = export_to_proto3.ExportFactory(exportCfg);
        if (Exportor) {
            if (exportCfg.ExtName == undefined) {
                exportCfg.ExtName = Exportor.DefaultExtName;
            }
            gExportWrapperLst.push(Exportor);
        }
    }
    return true;
}
function execute() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!InitEnv()) {
            throw `InitEnv failure!`;
        }
        if (!(yield HandleReadData())) {
            throw `handle read excel data failure.`;
        }
        if (!HandleHighLevelTypeCheck()) {
            throw `handle check hight level type failure.`;
        }
        if (!(yield HandleExportAll())) {
            throw `handle export failure.`;
        }
        return true;
    });
}
exports.execute = execute;
////////////////////////////////////////////////////////////////////////////////
//#region private side
const WorkerMonitor = new utils.AsyncWorkMonitor();
function HandleExcelFileWork(fileName, cb) {
    return __awaiter(this, void 0, void 0, function* () {
        WorkerMonitor.addWork();
        cb(yield excel_utils_1.HandleExcelFile(fileName));
        WorkerMonitor.decWork();
    });
}
function HandleDir(dirName, cb) {
    return __awaiter(this, void 0, void 0, function* () {
        if (config_1.gGlobalIgnoreDirName.has(path.basename(dirName))) {
            utils.logger(`ignore folder ${dirName}`);
            return;
        }
        WorkerMonitor.addWork();
        const pa = yield fs.readdirAsync(dirName);
        pa.forEach(function (fileName) {
            const filePath = path.join(dirName, fileName);
            let info = fs.statSync(filePath);
            if (!info.isFile()) {
                return;
            }
            HandleExcelFileWork(filePath, cb);
        });
        WorkerMonitor.decWork();
    });
}
function HandleReadData() {
    return __awaiter(this, void 0, void 0, function* () {
        let ret = true;
        const cb = (v) => {
            ret = ret && v;
        };
        for (let fileOrPath of config_1.gCfg.IncludeFilesAndPath) {
            if (!path.isAbsolute(fileOrPath)) {
                fileOrPath = path.join(config_1.gRootDir, fileOrPath);
            }
            if (!fs.existsSync(fileOrPath)) {
                utils.exception(`file or directory "${utils.yellow_ul(fileOrPath)}" not found!`);
                break;
            }
            if (fs.statSync(fileOrPath).isDirectory()) {
                HandleDir(fileOrPath, cb);
            }
            else if (fs.statSync(fileOrPath).isFile()) {
                HandleExcelFileWork(fileOrPath, cb);
            }
            else {
                utils.exception(`UnHandle file or directory type : "${utils.yellow_ul(fileOrPath)}"`);
            }
        }
        yield WorkerMonitor.delay(50);
        yield WorkerMonitor.WaitAllWorkDone();
        utils.logger(`${utils.green('[SUCCESS]')} READ ALL SHEET DONE. Total Use Tick : ${utils.green(utils.TimeUsed.LastElapse())}`);
        return ret;
    });
}
function HandleHighLevelTypeCheck() {
    if (!config_1.gCfg.EnableTypeCheck) {
        return true;
    }
    let foundError = false;
    for (const kv of utils.ExportExcelDataMap) {
        const database = kv[1];
        for (let colIdx = 0; colIdx < database.arrTypeHeader.length; ++colIdx) {
            let header = database.arrTypeHeader[colIdx];
            const cIdx = header.cIdx;
            if (!header.highCheck)
                continue;
            try {
                header.highCheck.init();
            }
            catch (ex) {
                utils.exception(`Excel "${utils.yellow_ul(database.filename)}" Sheet "${utils.yellow_ul(database.name)}" High Type`
                    + ` "${utils.yellow_ul(header.name)}" format error "${utils.yellow_ul(header.highCheck.s)}"!`);
            }
            CHighTypeChecker_1.CHightTypeChecker.setHeaderNameMap(database.arrHeaderNameMap);
            for (let rowIdx = 0; rowIdx < database.arrValues.length; ++rowIdx) {
                const row = database.arrValues[rowIdx];
                if (row.type != utils.ESheetRowType.data)
                    continue;
                const data = row.values[cIdx];
                // if (!data) continue;
                CHighTypeChecker_1.CHightTypeChecker.setRowData(row.values);
                try {
                    if (!header.highCheck.checkType(data)) {
                        // header.highCheck.checkType(data); // for debug
                        throw '';
                    }
                }
                catch (ex) {
                    foundError = true;
                    utils.exceptionRecord(`Excel "${utils.yellow_ul(database.filename)}" `
                        + `Sheet Row "${utils.yellow_ul(database.name + '.' + utils.yellow_ul(header.name))}" High Type format error `
                        + `Cell "${utils.yellow_ul(utils.FMT26.NumToS26(header.cIdx) + (row.rIdx + 1).toString())}" `
                        + ` "${utils.yellow_ul(data)}"!`, ex);
                }
            }
        }
    }
    utils.logger(`${foundError ? utils.red('[FAILURE]') : utils.green('[SUCCESS]')} `
        + `CHECK ALL HIGH TYPE DONE. Total Use Tick : ${utils.green(utils.TimeUsed.LastElapse())}`);
    return !foundError;
}
function HandleExportAll() {
    return __awaiter(this, void 0, void 0, function* () {
        const monitor = new utils.AsyncWorkMonitor();
        let allOK = true;
        for (const kv of utils.ExportExcelDataMap) {
            for (const handler of gExportWrapperLst) {
                monitor.addWork();
                handler.ExportToAsync(kv[1], (ok) => {
                    allOK = allOK && ok;
                    monitor.decWork();
                });
            }
        }
        for (const handler of gExportWrapperLst) {
            monitor.addWork();
            handler.ExportToGlobalAsync((ok) => {
                allOK = allOK && ok;
                monitor.decWork();
            });
        }
        yield monitor.WaitAllWorkDone();
        return allOK;
    });
}
//#endregion
//# sourceMappingURL=works.js.map