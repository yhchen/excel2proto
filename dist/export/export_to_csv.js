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
const utils_1 = require("../utils");
function ParseCSVLine(header, sheetRow, exportCfg) {
    let tmpArry = new Array();
    for (let i = 0; i < header.length; ++i) {
        let value = '';
        if (sheetRow.type == utils_1.ESheetRowType.header) {
            value = sheetRow.values[i];
        }
        else if (sheetRow.type == utils_1.ESheetRowType.data) {
            let cIdx = header[i].cIdx;
            if (cIdx >= sheetRow.values.length) {
                break;
            }
            value = sheetRow.values[cIdx];
        }
        let tmpValue = '';
        if (value == null) {
            if (exportCfg.UseDefaultValueIfEmpty) {
                tmpValue = header[i].typeChecker.SDefaultValue;
                if (tmpValue === undefined) {
                    tmpValue = '';
                }
            }
        }
        else {
            if (utils.isString(value)) {
                tmpValue = value;
            }
            else if (utils.isObject(value) || utils.isArray(value)) {
                tmpValue = JSON.stringify(value);
            }
            else if (utils.isNumber(value)) {
                if (value < 1 && value > 0) {
                    tmpValue = value.toString().replace(/0\./g, '.');
                }
                else {
                    tmpValue = value.toString();
                }
            }
            else if (utils.isBoolean(value)) {
                tmpValue = value ? 'true' : 'false';
            }
            else {
                utils.exception(`export INNER ERROR`);
            }
            if (tmpValue.indexOf(',') < 0 && tmpValue.indexOf('"') < 0) {
                tmpValue = tmpValue.replace(/"/g, `""`);
            }
            else {
                tmpValue = `"${tmpValue.replace(/"/g, `""`)}"`;
            }
        }
        tmpArry.push(tmpValue);
    }
    return tmpArry.join(',').replace(/\n/g, '\\n').replace(/\r/g, '');
}
class CSVExport extends utils.IExportWrapper {
    constructor(exportCfg) { super(exportCfg); }
    get DefaultExtName() { return '.csv'; }
    ExportTo(dt) {
        return __awaiter(this, void 0, void 0, function* () {
            const outdir = this._exportCfg.OutputDir;
            if (!this.CreateDir(outdir)) {
                utils.exception(`output path "${utils.yellow_ul(outdir)}" not exists!`);
                return false;
            }
            let arrTmp = new Array();
            const arrExportHeader = utils.ExecGroupFilter(this._exportCfg.GroupFilter, dt.arrTypeHeader);
            if (arrExportHeader.length <= 0) {
                utils.debug(`Pass Sheet ${utils.yellow_ul(dt.name)} : No Column To Export.`);
                return true;
            }
            for (let row of dt.arrValues) {
                if (row.type != utils.ESheetRowType.data && row.type != utils.ESheetRowType.header)
                    continue;
                arrTmp.push(ParseCSVLine(arrExportHeader, row, this._exportCfg));
            }
            const csvcontent = arrTmp.join(utils.LineBreaker) + utils.LineBreaker;
            yield fs.writeFileAsync(path.join(outdir, dt.name + this._exportCfg.ExtName), csvcontent, { encoding: 'utf8', flag: 'w+' });
            utils.debug(`${utils.green('[SUCCESS]')} Output file "${utils.yellow_ul(path.join(outdir, dt.name + this._exportCfg.ExtName))}". `
                + `Total use tick:${utils.green(utils.TimeUsed.LastElapse())}`);
            return true;
        });
    }
    ExportGlobal() {
        return __awaiter(this, void 0, void 0, function* () { return true; });
    }
}
module.exports = function (exportCfg) { return new CSVExport(exportCfg); };
//# sourceMappingURL=export_to_csv.js.map