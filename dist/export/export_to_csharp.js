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
const fs = __importStar(require("fs-extra-promise"));
const path = __importStar(require("path"));
const utils = __importStar(require("../utils"));
const CTypeParser_1 = require("../CTypeParser");
const CSTypeTranslateMap = new Map([
    [CTypeParser_1.ETypeNames.char, { s: 'char', opt: false }],
    [CTypeParser_1.ETypeNames.uchar, { s: 'byte', opt: false }],
    [CTypeParser_1.ETypeNames.short, { s: 'short', opt: false }],
    [CTypeParser_1.ETypeNames.ushort, { s: 'ushort', opt: false }],
    [CTypeParser_1.ETypeNames.int, { s: 'int', opt: false }],
    [CTypeParser_1.ETypeNames.uint, { s: 'uint', opt: false }],
    [CTypeParser_1.ETypeNames.int64, { s: 'long', opt: false }],
    [CTypeParser_1.ETypeNames.uint64, { s: 'ulong', opt: false }],
    [CTypeParser_1.ETypeNames.string, { s: 'string', opt: false }],
    [CTypeParser_1.ETypeNames.double, { s: 'double', opt: false }],
    [CTypeParser_1.ETypeNames.float, { s: 'float', opt: false }],
    [CTypeParser_1.ETypeNames.bool, { s: 'bool', opt: false }],
    [CTypeParser_1.ETypeNames.date, { s: 'string', opt: true }],
    [CTypeParser_1.ETypeNames.tinydate, { s: 'string', opt: true }],
    [CTypeParser_1.ETypeNames.timestamp, { s: 'long', opt: true }],
    [CTypeParser_1.ETypeNames.utctime, { s: 'long', opt: true }],
]);
////////////////////////////////////////////////////////////////////////////////
class CSDExport extends utils.IExportWrapper {
    constructor(exportCfg) {
        super(exportCfg);
    }
    get DefaultExtName() { return '.cs'; }
    ExportTo(dt) {
        return __awaiter(this, void 0, void 0, function* () {
            let outdir = this._exportCfg.OutputDir;
            const LineB = utils.LineBreaker;
            if (this.IsFile(outdir)) {
                return true;
            }
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
            let data = this.GenSheetType(dt.name, dt.arrTypeHeader);
            if (!data)
                return true;
            const nameReg = new RegExp('{name}', 'gm');
            let interfaceContent = FMT.replace('{data}', data).replace(nameReg, dt.name);
            if (this._exportCfg.Namespace) {
                interfaceContent = interfaceContent.split(LineB).join(`${LineB}\t`);
                if (dt.customData && CTypeParser_1.CTypeParser.CustomDataNode) {
                    interfaceContent = interfaceContent.replace('{customData}', dt.customData);
                }
                interfaceContent = `namespace ${this._exportCfg.Namespace}${LineB}{${LineB}\t${interfaceContent}${LineB}}${LineB}`;
            }
            if (this._exportCfg.UseNamespace) {
                let allUseNameSpace = '';
                for (let nameSpace of this._exportCfg.UseNamespace) {
                    allUseNameSpace += `using ${nameSpace};${LineB}`;
                }
                interfaceContent = `${allUseNameSpace}${LineB}${interfaceContent}`;
            }
            const outfile = path.join(outdir, dt.name + this._exportCfg.ExtName);
            yield fs.writeFileAsync(outfile, interfaceContent, { encoding: 'utf8', flag: 'w' });
            utils.debug(`${utils.green('[SUCCESS]')} Output file "${utils.yellow_ul(outfile)}". `
                + `Total use tick:${utils.green(utils.TimeUsed.LastElapse())}`);
            return true;
        });
    }
    ExportGlobal() {
        return __awaiter(this, void 0, void 0, function* () {
            const outdir = this._exportCfg.OutputDir;
            const LineB = utils.LineBreaker;
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
            let interfaceContent = '';
            const array = [];
            for (let [k, v] of utils.ExportExcelDataMap) {
                array.push(v);
            }
            array.sort((a, b) => {
                return a.name.localeCompare(b.name);
            });
            for (let db of array) {
                const name = db.name;
                let data = this.GenSheetType(name, db.arrTypeHeader);
                if (data) {
                    const nameReg = new RegExp('{name}', 'gm');
                    let ctx = FMT.replace('{data}', data).replace(nameReg, name);
                    if (db.customData && CTypeParser_1.CTypeParser.CustomDataNode) {
                        ctx = ctx.replace('{customData}', db.customData);
                    }
                    interfaceContent += ctx;
                }
            }
            if (this._exportCfg.Namespace) {
                interfaceContent = interfaceContent.split(LineB).join(`${LineB}\t`);
                interfaceContent = `namespace ${this._exportCfg.Namespace}${LineB}{${LineB}\t${interfaceContent}${LineB}}${LineB}`;
            }
            if (this._exportCfg.UseNamespace) {
                let allUseNameSpace = '';
                for (let nameSpace of this._exportCfg.UseNamespace) {
                    allUseNameSpace += `using ${nameSpace};${LineB}`;
                }
                interfaceContent = `${allUseNameSpace}${LineB}${interfaceContent}`;
            }
            yield fs.writeFileAsync(outdir, interfaceContent, { encoding: 'utf8', flag: 'w' });
            utils.debug(`${utils.green('[SUCCESS]')} Output file "${utils.yellow_ul(outdir)}". `
                + `Total use tick:${utils.green(utils.TimeUsed.LastElapse())}`);
            return true;
        });
    }
    GenSheetType(sheetName, arrHeader) {
        const arrExportHeader = utils.ExecGroupFilter(this._exportCfg.GroupFilter, arrHeader);
        if (arrExportHeader.length <= 0) {
            utils.debug(`Pass Sheet ${utils.yellow_ul(sheetName)} : No Column To Export.`);
            return;
        }
        let data = `{${utils.LineBreaker}`;
        let idx = 0;
        for (let header of arrExportHeader) {
            if (header.comment)
                continue;
            if (this._exportCfg.IDUseGeterAndSeter && idx == 0) {
                data += `\tpublic ${this.GenTypeName(header.typeChecker.type, false)} ${this.TranslateColName(header.name)} { get; set; }${utils.LineBreaker}`;
            }
            else {
                data += `\tpublic ${this.GenTypeName(header.typeChecker.type, false)} ${this.TranslateColName(header.name)};${utils.LineBreaker}`;
            }
            ++idx;
        }
        data += `}${utils.LineBreaker}`;
        return data;
    }
    GenTypeName(type, opt = false) {
        const defaultval = `object`;
        if (type == undefined) {
            return defaultval;
        }
        switch (type.type) {
            case 1 /* base */:
            case 2 /* date */:
                if (type.typename) {
                    let tdesc = CSTypeTranslateMap.get(type.typename);
                    if (tdesc) {
                        return `${tdesc.s}`;
                    }
                }
                else {
                    return defaultval;
                }
                break;
            case 0 /* array */:
                {
                    let tname = `[]`;
                    type = type.next;
                    for (; type != undefined; type = type.next) {
                        if (type.type == 0 /* array */) {
                            tname += `[]`;
                        }
                        else {
                            tname = this.GenTypeName(type, true) + tname;
                        }
                    }
                    return tname;
                }
                break;
            default:
                utils.exception(`call "${utils.yellow_ul('GenTypeName')}" failure`);
                return defaultval;
        }
        return defaultval;
    }
}
module.exports = function (exportCfg) { return new CSDExport(exportCfg); };
//# sourceMappingURL=export_to_csharp.js.map