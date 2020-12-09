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
const TSTypeTranslateMap = new Map([
    [CTypeParser_1.ETypeNames.char, { s: 'number', opt: false }],
    [CTypeParser_1.ETypeNames.uchar, { s: 'number', opt: false }],
    [CTypeParser_1.ETypeNames.short, { s: 'number', opt: false }],
    [CTypeParser_1.ETypeNames.ushort, { s: 'number', opt: false }],
    [CTypeParser_1.ETypeNames.int, { s: 'number', opt: false }],
    [CTypeParser_1.ETypeNames.uint, { s: 'number', opt: false }],
    [CTypeParser_1.ETypeNames.int64, { s: 'number', opt: false }],
    [CTypeParser_1.ETypeNames.uint64, { s: 'number', opt: false }],
    [CTypeParser_1.ETypeNames.string, { s: 'string', opt: false }],
    [CTypeParser_1.ETypeNames.double, { s: 'number', opt: false }],
    [CTypeParser_1.ETypeNames.float, { s: 'number', opt: false }],
    [CTypeParser_1.ETypeNames.bool, { s: 'boolean', opt: false }],
    [CTypeParser_1.ETypeNames.date, { s: 'string', opt: true }],
    [CTypeParser_1.ETypeNames.tinydate, { s: 'string', opt: true }],
    [CTypeParser_1.ETypeNames.timestamp, { s: 'number', opt: true }],
    [CTypeParser_1.ETypeNames.utctime, { s: 'number', opt: true }],
]);
////////////////////////////////////////////////////////////////////////////////
class TSDExport extends utils.IExportWrapper {
    constructor(exportCfg) {
        super(exportCfg);
    }
    get DefaultExtName() { return '.d.ts'; }
    ExportTo(dt) {
        return __awaiter(this, void 0, void 0, function* () {
            let outdir = this._exportCfg.OutputDir;
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
            if (FMT.indexOf('{type}') < 0) {
                utils.exception(`[Config Error] ${utils.yellow_ul("Export.ExportTemple")} not found Keyword ${utils.yellow_ul("{type}")}!`);
                return false;
            }
            let ctx = this.GenSheetType(dt.name, dt.arrTypeHeader);
            if (!ctx)
                return true;
            let interfaceContent = FMT.replace('{data}', ctx.type).replace('{type}', ctx.tbtype);
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
            if (FMT.indexOf('{type}') < 0) {
                utils.exception(`[Config Error] ${utils.yellow_ul("Export.ExportTemple")} not found Keyword ${utils.yellow_ul("{type}")}!`);
                return false;
            }
            let data = '';
            let type = '{\n';
            const exportexp = FMT.indexOf('export') >= 0 ? 'export ' : '';
            const array = [];
            for (let [k, v] of utils.ExportExcelDataMap) {
                array.push(v);
            }
            array.sort((a, b) => {
                return a.name.localeCompare(b.name);
            });
            for (let db of array) {
                const name = db.name;
                let ctx = this.GenSheetType(name, db.arrTypeHeader);
                if (ctx) {
                    data += `${exportexp}${ctx.type}${exportexp}${ctx.tbtype}\n\n`;
                    type += `    ${name}: T${name};\n`;
                }
            }
            type += `}\n`;
            FMT.indexOf('{data}');
            data = FMT.replace('{data}', data).replace('{type}', type);
            yield fs.writeFileAsync(outdir, data, { encoding: 'utf8', flag: 'w' });
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
        let type = `type ${sheetName} = {\n`;
        for (let header of arrExportHeader) {
            if (header.comment)
                continue;
            type += `    ${this.TranslateColName(header.name)}${this.GenTypeName(header.typeChecker.type, false)};\n`;
        }
        type += '}\n';
        let tbtype = `type T${sheetName} = {[Key in number|string]?: ${sheetName}};\n`;
        return { type, tbtype };
    }
    GenTypeName(type, opt = false) {
        const defaultval = `?: any`;
        if (type == undefined) {
            return defaultval;
        }
        switch (type.type) {
            case 1 /* base */:
            case 2 /* date */:
                if (type.typename) {
                    let tdesc = TSTypeTranslateMap.get(type.typename);
                    if (tdesc) {
                        return `${opt || tdesc.opt || !this._exportCfg.UseDefaultValueIfEmpty ? '?' : ''}: ${tdesc.s}`;
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
module.exports = function (exportCfg) { return new TSDExport(exportCfg); };
//# sourceMappingURL=export_to_tsd.js.map