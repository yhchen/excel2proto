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
exports.ExportFactory = void 0;
const fs = __importStar(require("fs-extra-promise"));
const path = __importStar(require("path"));
const utils = __importStar(require("../utils"));
const CTypeParser_1 = require("../CTypeParser");
const protobufjs = __importStar(require("protobufjs"));
const lodash_1 = require("lodash");
const PBTypeTranslateMap = new Map([
    [CTypeParser_1.ETypeNames.char, { s: 'sint32', opt: false }],
    [CTypeParser_1.ETypeNames.uchar, { s: 'uint32', opt: false }],
    [CTypeParser_1.ETypeNames.short, { s: 'sint32', opt: false }],
    [CTypeParser_1.ETypeNames.ushort, { s: 'uint32', opt: false }],
    [CTypeParser_1.ETypeNames.int, { s: 'sint32', opt: false }],
    [CTypeParser_1.ETypeNames.uint, { s: 'uint32', opt: false }],
    [CTypeParser_1.ETypeNames.int64, { s: 'sint64', opt: false }],
    [CTypeParser_1.ETypeNames.uint64, { s: 'uint64', opt: false }],
    [CTypeParser_1.ETypeNames.string, { s: 'string', opt: false }],
    [CTypeParser_1.ETypeNames.double, { s: 'double', opt: false }],
    [CTypeParser_1.ETypeNames.float, { s: 'float', opt: false }],
    [CTypeParser_1.ETypeNames.bool, { s: 'bool', opt: false }],
    [CTypeParser_1.ETypeNames.date, { s: 'string', opt: true }],
    [CTypeParser_1.ETypeNames.tinydate, { s: 'string', opt: true }],
    [CTypeParser_1.ETypeNames.timestamp, { s: 'int64', opt: true }],
    [CTypeParser_1.ETypeNames.utctime, { s: 'int64', opt: true }],
]);
////////////////////////////////////////////////////////////////////////////////
class PBExport3 extends utils.IExportWrapper {
    constructor(exportCfg) {
        super(exportCfg);
    }
    get DefaultExtName() { return '.proto'; }
    ExportTo(dt) {
        return __awaiter(this, void 0, void 0, function* () {
            return true;
            // let outdir = this._exportCfg.OutputDir;
            // if (this.IsFile(outdir)) {
            // 	return true;
            // }
            // if (!this.CreateDir(outdir)) {
            // 	utils.exception(`create output path "${utils.yellow_ul(outdir)}" failure!`);
            // 	return false;
            // }
            // let FMT: string | undefined = this._exportCfg.ExportTemple;
            // if (FMT == undefined) {
            // 	utils.exception(`[Config Error] ${utils.yellow_ul("Export.ExportTemple")} not defined!`);
            // 	return false;
            // }
            // if (FMT.indexOf('{data}') < 0) {
            // 	utils.exception(`[Config Error] ${utils.yellow_ul("Export.ExportTemple")} not found Keyword ${utils.yellow_ul("{data}")}!`);
            // 	return false;
            // }
            // let tempMessage: string[] = [];
            // let ctx = this.GenSheetType(dt.name, dt.arrTypeHeader, tempMessage);
            // if (!ctx)
            // 	return true;
            // tempMessage.sort((a, b) => a < b ? -1 : 1);
            // const PackageContent = this._exportCfg.Namespace ? `package ${this._exportCfg.Namespace};${utils.LineBreaker}` : "";
            // const dataContent = `${tempMessage.join(utils.LineBreaker)}${ctx.pbtype}`;
            // let interfaceContent = `syntax = "proto3";${utils.LineBreaker}${utils.LineBreaker}${PackageContent}${utils.LineBreaker}` + FMT.replace('{data}', dataContent);
            // const outfile = path.join(outdir, dt.name + this._exportCfg.ExtName);
            // await fs.writeFileAsync(outfile, interfaceContent, { encoding: 'utf8', flag: 'w' });
            // utils.debug(`${utils.green('[SUCCESS]')} Output file "${utils.yellow_ul(outfile)}". `
            // 	+ `Total use tick:${utils.green(utils.TimeUsed.LastElapse())}`);
            // return true;
        });
    }
    ExportGlobal() {
        return __awaiter(this, void 0, void 0, function* () {
            const outdir = this._exportCfg.OutputDir;
            // if (!this.IsFile(outdir)) {
            // 	utils.exception("proto3 format export to separate file was not support!");
            // }
            if (!this._exportCfg.OutputDataDir) {
                utils.exception("proto3 Export.OutputDataDir was not set!");
            }
            if (!this.CreateDir(path.dirname(outdir))) {
                utils.exception(`create output path "${utils.yellow_ul(path.dirname(outdir))}" failure!`);
            }
            if (!this.CreateDir(this._exportCfg.OutputDataDir)) {
                utils.exception(`create output path "${utils.yellow_ul(this._exportCfg.OutputDataDir)}" failure!`);
            }
            let data = '';
            const array = [];
            for (let [k, v] of utils.ExportExcelDataMap) {
                array.push(v);
            }
            array.sort((a, b) => {
                return a.name.localeCompare(b.name);
            });
            let tempMessage = [];
            for (let dt of array) {
                const name = dt.name;
                let ctx = this.GenSheetType(name, dt.arrTypeHeader, tempMessage);
                if (ctx) {
                    data += `${ctx.pbtype}${utils.LineBreaker}${utils.LineBreaker}`;
                }
            }
            tempMessage.sort((a, b) => a < b ? -1 : 1);
            const PackageContent = this._exportCfg.Namespace ? `package ${this._exportCfg.Namespace};${utils.LineBreaker}` : "";
            data = `${tempMessage.join(utils.LineBreaker)}${data}`;
            data = `syntax = "proto3";${utils.LineBreaker}${utils.LineBreaker}${PackageContent}${utils.LineBreaker}` + data;
            yield fs.writeFileAsync(outdir, data, { encoding: 'utf8', flag: 'w' });
            utils.debug(`${utils.green('[SUCCESS]')} Output file "${utils.yellow_ul(outdir)}". `
                + `Total use tick:${utils.green(utils.TimeUsed.LastElapse())}`);
            // save to proto files...
            this._protoRoot = protobufjs.loadSync(outdir);
            for (let dt of array) {
                const name = dt.name;
                const outputFile = path.join(this._exportCfg.OutputDataDir, name + this._exportCfg.ExtName);
                yield this.ExportData(dt, outputFile);
            }
            return true;
        });
    }
    GenSheetType(sheetName, arrHeader, tempMessage) {
        const arrExportHeader = utils.ExecGroupFilter(this._exportCfg.GroupFilter, arrHeader);
        if (arrExportHeader.length <= 0) {
            utils.debug(`Pass Sheet ${utils.yellow_ul(sheetName)} : No Column To Export.`);
            return;
        }
        let type = `message ${sheetName}${utils.LineBreaker}{${utils.LineBreaker}`;
        for (let header of arrExportHeader) {
            if (header.comment)
                continue;
            type += `    ${this.GenTypeName(header.typeChecker.type, tempMessage)} ${this.TranslateColName(header.name)} = ${header.cIdx + 1};${utils.LineBreaker}`;
        }
        type += `}${utils.LineBreaker}`;
        type += `message Arr${sheetName}${utils.LineBreaker}{${utils.LineBreaker}    repeated ${sheetName} Rows = 1;${utils.LineBreaker}}${utils.LineBreaker}`;
        return { pbtype: type, };
    }
    GenTypeName(type, tempMessage) {
        const defaultval = `string`;
        if (type == undefined) {
            return defaultval;
        }
        switch (type.type) {
            case 1 /* base */:
            case 2 /* date */:
                if (type.typename) {
                    let tdesc = PBTypeTranslateMap.get(type.typename);
                    if (tdesc) {
                        return tdesc.s;
                    }
                }
                else {
                    return defaultval;
                }
                break;
            case 0 /* array */:
                {
                    let typeName = '';
                    let tname = '';
                    type = type.next;
                    let dimensionTotal = 1;
                    for (; type != undefined; type = type.next) {
                        if (type.type == 0 /* array */) {
                            ++dimensionTotal;
                        }
                        else {
                            typeName = this.GenTypeName(type, tempMessage);
                        }
                    }
                    if (dimensionTotal <= 1) {
                        tname = `repeated ${typeName}`;
                    }
                    else {
                        const PERFIX = "Arr";
                        tname = `repeated ${typeName}${PERFIX}${dimensionTotal - 1}`;
                        for (let dimension = 1; dimension < dimensionTotal; ++dimension) {
                            const name = `${typeName}${PERFIX}${dimension}`;
                            const namePre = dimension == 1 ? `${typeName}` : `${typeName}${PERFIX}${dimension - 1}`;
                            const message = `message ${name}${utils.LineBreaker}{${utils.LineBreaker}    repeated ${dimension == 0 ? typeName : namePre} a = 1;${utils.LineBreaker}}${utils.LineBreaker}`;
                            if (tempMessage.indexOf(message) < 0) {
                                tempMessage.push(message);
                            }
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
    TranslateValue(value) {
        if (lodash_1.isArray(value)) {
            if (value.length <= 0 || !lodash_1.isArray(value[0])) {
                return { a: value };
            }
            const ret = { a: [] };
            for (const subvalue of value) {
                ret.a.push(this.TranslateValue(subvalue));
            }
            return ret;
        }
        return value;
    }
    ExportData(dt, outputFile) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._protoRoot == null)
                return;
            const protoEncoder = this._protoRoot.lookupType(`${this._exportCfg.Namespace ? this._exportCfg.Namespace + '.' : ''}Arr${dt.name}`);
            const arrExportHeader = utils.ExecGroupFilter(this._exportCfg.GroupFilter, dt.arrTypeHeader);
            if (arrExportHeader.length <= 0) {
                return;
            }
            const exportData = { Rows: [] };
            for (let row = 0; row < dt.arrValues.length; ++row) {
                if (dt.arrValues[row].type != utils.ESheetRowType.data)
                    continue;
                const data = dt.arrValues[row].values;
                const newData = {};
                for (const hdr of arrExportHeader) {
                    if (hdr.comment)
                        continue;
                    newData[this.TranslateColName(hdr.name)] = this.TranslateValue(data[hdr.cIdx]);
                    exportData.Rows.push(newData);
                }
            }
            ;
            const exportProto = protoEncoder.encode(exportData).finish();
            yield fs.writeFileAsync(outputFile, exportProto);
        });
    }
}
function ExportFactory(exportCfg) { return new PBExport3(exportCfg); }
exports.ExportFactory = ExportFactory;
;
//# sourceMappingURL=export_to_proto3.js.map