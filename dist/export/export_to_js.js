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
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra-promise"));
const utils = __importStar(require("../utils"));
function ParseJSLine(exportWrapper, header, sheetRow, rootNode, exportCfg) {
    var _a;
    if (sheetRow.type != utils.ESheetRowType.data)
        return undefined;
    let item = {};
    for (let i = 0, cIdx = header[0].cIdx; i < header.length && cIdx < sheetRow.values.length; ++i, cIdx = (_a = header[i]) === null || _a === void 0 ? void 0 : _a.cIdx) {
        const head = header[i];
        if (!head || head.comment)
            continue;
        const name = exportWrapper.TranslateColName(head.name);
        if (sheetRow.values[cIdx] != undefined) {
            item[name] = sheetRow.values[cIdx];
        }
        else if (exportCfg.UseDefaultValueIfEmpty) {
            if (head.typeChecker.DefaultValue != undefined) {
                item[name] = head.typeChecker.DefaultValue;
            }
        }
    }
    const id = sheetRow.values[0];
    rootNode[id] = item;
    if (rootNode._ids == undefined) {
        rootNode._ids = [];
    }
    rootNode._ids.push(id);
}
function DumpToString(data) {
    if (utils.isString(data)) {
        return `'${data.replace(/\'/g, "\\'")}'`;
    }
    else if (utils.isNumber(data)) {
        return data.toString();
    }
    else if (utils.isArray(data)) {
        let s = '';
        for (let i = 0; i < data.length; ++i) {
            if (data[i] === undefined)
                continue;
            s += (s.length === 0 ? '' : ',') + DumpToString(data[i]);
        }
        return `[${s}]`;
    }
    else if (utils.isObject(data)) {
        let s = '';
        for (let name in data) {
            const v = data[name];
            if (v === undefined)
                continue;
            s += `${s.length === 0 ? '' : ','}${name}:${DumpToString(v)}`;
        }
        return `{${s}}`;
    }
    else if (utils.isBoolean(data)) {
        return data ? 'true' : 'false';
    }
    else {
        utils.exception(`Internal ERROR! type not Handle${data}!`);
    }
    return '';
}
class JSExport extends utils.IExportWrapper {
    constructor(exportCfg) {
        super(exportCfg);
        this._globalObj = {};
    }
    get DefaultExtName() { return '.js'; }
    ExportTo(dt) {
        return __awaiter(this, void 0, void 0, function* () {
            const outdir = this._exportCfg.OutputDir;
            let jsObj = {};
            const arrExportHeader = utils.ExecGroupFilter(this._exportCfg.GroupFilter, dt.arrTypeHeader);
            if (arrExportHeader.length <= 0) {
                utils.debug(`Pass Sheet ${utils.yellow_ul(dt.name)} : No Column To Export.`);
                return true;
            }
            for (let row of dt.arrValues) {
                ParseJSLine(this, arrExportHeader, row, jsObj, this._exportCfg);
            }
            if (this.IsFile(outdir)) {
                this._globalObj[dt.name] = jsObj;
            }
            else {
                if (!this.CreateDir(outdir)) {
                    utils.exception(`create output path "${utils.yellow_ul(outdir)}" failure!`);
                    return false;
                }
                let FMT = this._exportCfg.ExportTemple;
                if (FMT == undefined) {
                    utils.exception(`[Config Error] ${utils.yellow_ul("Export.ExportTemple")} not defined!`);
                    return false;
                }
                if (FMT.indexOf('{data}') < 0) {
                    utils.exception(`[Config Error] ${utils.yellow_ul("Export.ExportTemple")} not found Keyword ${utils.yellow_ul("{data}")}!`);
                    return false;
                }
                if (FMT.indexOf('{name}') < 0) {
                    utils.exception(`[Config Error] ${utils.yellow_ul("Export.ExportTemple")} not found Keyword ${utils.yellow_ul("{name}")}!`);
                    return false;
                }
                const jscontent = FMT.replace("{name}", dt.name).replace("{data}", DumpToString(jsObj) || "{}");
                const outfile = path.join(outdir, dt.name + this._exportCfg.ExtName);
                yield fs.writeFileAsync(outfile, jscontent, { encoding: 'utf8', flag: 'w+' });
                utils.debug(`${utils.green('[SUCCESS]')} Output file "${utils.yellow_ul(outfile)}". `
                    + `Total use tick:${utils.green(utils.TimeUsed.LastElapse())}`);
            }
            return true;
        });
    }
    ExportGlobal() {
        return __awaiter(this, void 0, void 0, function* () {
            const outdir = this._exportCfg.OutputDir;
            if (!this.IsFile(outdir))
                return true;
            if (!this.CreateDir(path.dirname(outdir))) {
                utils.exception(`create output path "${utils.yellow_ul(path.dirname(outdir))}" failure!`);
                return false;
            }
            let FMT = this._exportCfg.ExportTemple;
            if (FMT == undefined) {
                utils.exception(`[Config Error] ${utils.yellow_ul("Export.ExportTemple")} not defined!`);
                return false;
            }
            if (FMT.indexOf('{data}') < 0) {
                utils.exception(`[Config Error] ${utils.yellow_ul("Export.ExportTemple")} not found Keyword ${utils.yellow_ul("{data}")}!`);
                return false;
            }
            const jscontent = FMT.replace("{data}", DumpToString(this._globalObj));
            yield fs.writeFileAsync(outdir, jscontent, { encoding: 'utf8', flag: 'w+' });
            utils.debug(`${utils.green('[SUCCESS]')} Output file "${utils.yellow_ul(outdir)}". `
                + `Total use tick:${utils.green(utils.TimeUsed.LastElapse())}`);
            return true;
        });
    }
}
module.exports = function (exportCfg) { return new JSExport(exportCfg); };
//# sourceMappingURL=export_to_js.js.map