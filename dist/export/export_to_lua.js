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
const utils = __importStar(require("../utils"));
const fs = __importStar(require("fs-extra-promise"));
const path = __importStar(require("path"));
const json_to_lua = __importStar(require("json_to_lua"));
function ParseJsonObject(exportWrapper, header, sheetRow, rootNode, exportCfg) {
    var _a;
    if (sheetRow.type != utils.ESheetRowType.data)
        return;
    let item = {};
    for (let i = 0, cIdx = header[0].cIdx; i < header.length && cIdx < sheetRow.values.length; ++i, cIdx = (_a = header[i]) === null || _a === void 0 ? void 0 : _a.cIdx) {
        const hdr = header[i];
        if (!hdr || hdr.comment)
            continue;
        const name = exportWrapper.TranslateColName(hdr.name);
        const val = sheetRow.values[cIdx];
        if (val != null) {
            item[name] = val;
        }
        else if (exportCfg.UseDefaultValueIfEmpty) {
            if (hdr.typeChecker.DefaultValue != undefined) {
                item[name] = hdr.typeChecker.DefaultValue;
            }
        }
        if (i == 0) {
            rootNode["ids"].push(item[name]);
        }
    }
    rootNode[sheetRow.values[0]] = item;
}
// export to single lua file
function exportToSingleLuaContent(exportWrapper, sheetName, header, jsObj, shortName = false) {
    if (!shortName) {
        return { head: '', data: json_to_lua.jsObjectToLuaPretty(jsObj, 2) };
    }
    const headLst = new Array();
    const NameMapToShort = new Map();
    for (let i = 0; i < header.length; ++i) {
        const head = header[i];
        const name = exportWrapper.TranslateColName(head.name);
        headLst.push(`local ${head.shortName} = "${name}"`);
        NameMapToShort.set(name, head.shortName);
    }
    const headContent = headLst.join('\n');
    const tableLst = new Array();
    for (let id of jsObj["ids"]) {
        const objLst = new Array();
        const jsObjSingle = jsObj[id];
        for (const hdr of header) {
            const name = exportWrapper.TranslateColName(hdr.name);
            if (jsObjSingle[name] == undefined)
                continue;
            objLst.push(`\t\t[${hdr.shortName}] = ${json_to_lua.jsObjectToLua(jsObjSingle[name])},`);
        }
        tableLst.push(`\t${json_to_lua.makeLuaKey(id)} = {\n${objLst.join('\n')}\n\t},`);
    }
    return { head: headContent, data: `{\n${tableLst.join('\n')}\n}` };
}
class LuaExport extends utils.IExportWrapper {
    constructor(exportCfg) {
        super(exportCfg);
        this._globalObj = {};
    }
    get DefaultExtName() { return '.lua'; }
    ExportTo(dt) {
        return __awaiter(this, void 0, void 0, function* () {
            const outdir = this._exportCfg.OutputDir;
            let jsonObj = { ids: [] };
            const arrExportHeader = utils.ExecGroupFilter(this._exportCfg.GroupFilter, dt.arrTypeHeader);
            if (arrExportHeader.length <= 0) {
                utils.debug(`Pass Sheet ${utils.yellow_ul(dt.name)} : No Column To Export.`);
                return true;
            }
            for (let row of dt.arrValues) {
                ParseJsonObject(this, arrExportHeader, row, jsonObj, this._exportCfg);
            }
            if (this.IsFile(outdir)) {
                this._globalObj[dt.name] = jsonObj;
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
                try {
                    const dataCtx = exportToSingleLuaContent(this, dt.name, arrExportHeader, jsonObj, this._exportCfg.UseShortName);
                    const NameRex = new RegExp('{name}', 'g');
                    let luacontent = FMT.replace(NameRex, dt.name).replace('{data}', dataCtx.data);
                    if (utils.StrNotEmpty(dataCtx.head)) {
                        luacontent = `${dataCtx.head}\n${luacontent}`;
                    }
                    const outfile = path.join(outdir, dt.name + this._exportCfg.ExtName);
                    yield fs.writeFileAsync(outfile, luacontent, { encoding: 'utf8', flag: 'w+' });
                    utils.debug(`${utils.green('[SUCCESS]')} Output file "${utils.yellow_ul(outfile)}". `
                        + `Total use tick:${utils.green(utils.TimeUsed.LastElapse())}`);
                }
                catch (ex) {
                    utils.exception(ex);
                }
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
            const luacontent = FMT.replace("{data}", json_to_lua.jsObjectToLuaPretty(this._globalObj, 3));
            yield fs.writeFileAsync(outdir, luacontent, { encoding: 'utf8', flag: 'w+' });
            utils.debug(`${utils.green('[SUCCESS]')} Output file "${utils.yellow_ul(outdir)}". `
                + `Total use tick:${utils.green(utils.TimeUsed.LastElapse())}`);
            return true;
        });
    }
}
module.exports = function (exportCfg) { return new LuaExport(exportCfg); };
//# sourceMappingURL=export_to_lua.js.map