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
exports.HandleExcelFile = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra-promise"));
const xlsx = __importStar(require("xlsx"));
const utils = __importStar(require("./utils"));
const CTypeParser_1 = require("./CTypeParser");
const config_1 = require("./config");
const CHighTypeChecker_1 = require("./CHighTypeChecker");
function HandleExcelFile(fileName) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const extname = path.extname(fileName);
            if (extname != '.xls' && extname != '.xlsx') {
                return true;
            }
            if (path.basename(fileName)[0] == '!') {
                utils.debug(`- Pass File "${fileName}"`);
                return true;
            }
            if (path.basename(fileName).indexOf(`~$`) == 0) {
                utils.debug(`- Pass File "${fileName}"`);
                return true;
            }
            let opt = {
                type: "buffer",
                // codepage: 0,//If specified, use code page when appropriate **
                cellFormula: false,
                cellHTML: false,
                cellText: true,
                cellDates: true,
                cellStyles: true,
                /**
                * If specified, use the string for date code 14 **
                 * https://github.com/SheetJS/js-xlsx#parsing-options
                 *		Format 14 (m/d/yy) is localized by Excel: even though the file specifies that number format,
                 *		it will be drawn differently based on system settings. It makes sense when the producer and
                 *		consumer of files are in the same locale, but that is not always the case over the Internet.
                 *		To get around this ambiguity, parse functions accept the dateNF option to override the interpretation of that specific format string.
                 */
                dateNF: 'yyyy/mm/dd',
                WTF: true,
            };
            const filebuffer = yield fs.readFileAsync(fileName);
            const excel = xlsx.read(filebuffer, opt);
            if (excel == null) {
                utils.exception(`excel ${utils.yellow_ul(fileName)} open failure.`);
            }
            if (excel.Sheets == null) {
                return true;
            }
            for (let sheetName of excel.SheetNames) {
                utils.debug(`- Handle excel "${utils.brightWhite(fileName)}" Sheet "${utils.yellow_ul(sheetName)}"`);
                const worksheet = excel.Sheets[sheetName];
                const datatable = HandleWorkSheet(fileName, sheetName, worksheet);
                if (datatable) {
                    const oldDataTable = utils.ExportExcelDataMap.get(datatable.name);
                    if (oldDataTable) {
                        utils.exception(`found duplicate file name : ${utils.yellow_ul(datatable.name)} \n`
                            + `at excel ${utils.yellow_ul(fileName)} \n`
                            + `and excel ${utils.yellow_ul(oldDataTable.filename)}`);
                    }
                    utils.ExportExcelDataMap.set(datatable.name, datatable);
                }
            }
        }
        catch (ex) {
            return false;
        }
        return true;
    });
}
exports.HandleExcelFile = HandleExcelFile;
////////////////////////////////////////////////////////////////////////////////
//#region private side
function GetCellData(worksheet, c, r) {
    const cell = xlsx.utils.encode_cell({ c, r });
    return worksheet[cell];
}
// get cell front groud color
function GetCellFrontGroudColor(cell) {
    if (!cell.s || !cell.s.fgColor || !cell.s.fgColor.rgb)
        return '000000'; // default return white
    return cell.s.fgColor.rgb;
}
function HandleWorkSheetTypeColumn(worksheet, rIdx, RowMax, ColumnMax, fileName, sheetName, DataTable, arrHeaderName) {
    rIdx = HandleWorkSheetHighTypeColumn(worksheet, rIdx, RowMax, ColumnMax, fileName, sheetName, DataTable, arrHeaderName);
    for (; rIdx <= RowMax; ++rIdx) {
        const firstCell = GetCellData(worksheet, arrHeaderName[0].cIdx, rIdx);
        if (firstCell == undefined || !utils.StrNotEmpty(firstCell.w)) {
            continue;
        }
        if (firstCell.w[0] == '#') {
            continue;
        }
        if (firstCell.w[0] != '*') {
            utils.exception(`Excel "${utils.yellow_ul(fileName)}" Sheet "${utils.yellow_ul(sheetName)}" Sheet Type Row not found!`);
        }
        firstCell.w = firstCell.w.substr(1); // skip '*'
        const tmpArry = [];
        const typeHeader = new Array();
        const headerNameMap = new Map();
        for (const col of arrHeaderName) {
            const cell = GetCellData(worksheet, col.cIdx, rIdx);
            if (cell == undefined || cell.w == undefined) {
                utils.exception(`Excel "${utils.yellow_ul(fileName)}" ` +
                    `Sheet "${utils.yellow_ul(sheetName)}"  Type Row "${utils.yellow_ul(col.name)}" not found!`);
                return -1;
            }
            try {
                col.parser = new CTypeParser_1.CTypeParser(cell.w);
                tmpArry.push(cell.w);
                typeHeader.push({
                    name: col.name,
                    shortName: utils.FMT26.NumToS26(typeHeader.length),
                    cIdx: col.cIdx,
                    typeChecker: col.parser,
                    stype: cell.w,
                    comment: false,
                    color: col.color
                });
                headerNameMap.set(col.name, col.cIdx);
            }
            catch (ex) {
                // new CTypeParser(cell.w); // for debug used
                utils.exception(`Excel "${utils.yellow_ul(fileName)}" Sheet "${utils.yellow_ul(sheetName)}" Sheet Type Row`
                    + ` "${utils.yellow_ul(col.name)}" format error "${utils.yellow_ul(cell.w)}"!`, ex);
            }
        }
        DataTable.arrTypeHeader = typeHeader;
        DataTable.arrHeaderNameMap = headerNameMap;
        DataTable.arrValues.push({ type: utils.ESheetRowType.type, values: tmpArry, rIdx });
        ++rIdx;
        break;
    }
    rIdx = HandleWorkSheetHighTypeColumn(worksheet, rIdx, RowMax, ColumnMax, fileName, sheetName, DataTable, arrHeaderName);
    return rIdx;
}
function HandleWorkSheetHighTypeColumn(worksheet, rIdx, RowMax, ColumnMax, fileName, sheetName, DataTable, arrHeaderName) {
    for (; rIdx <= RowMax; ++rIdx) {
        const firstCell = GetCellData(worksheet, arrHeaderName[0].cIdx, rIdx);
        if (firstCell == undefined || !utils.StrNotEmpty(firstCell.w)) {
            continue;
        }
        if (firstCell.w[0] == '#') {
            continue;
        }
        // found '*' or not not '@'. return rIdx for continue
        if (firstCell.w[0] == '*' || firstCell.w[0] != '@') {
            return rIdx;
        }
        firstCell.w = firstCell.w.substr(1); // skip '@'
        for (let i = 0; i < arrHeaderName.length; ++i) {
            const cell = GetCellData(worksheet, arrHeaderName[i].cIdx, rIdx);
            if (cell != undefined && cell.w != undefined && cell.w != '') {
                const header = DataTable.arrTypeHeader[i];
                header.highCheck = new CHighTypeChecker_1.CHightTypeChecker(cell.w);
            }
        }
        ++rIdx;
        break;
    }
    return rIdx;
}
function HandleWorkSheetNameColumn(worksheet, rIdx, RowMax, ColumnMax, fileName, sheetName, DataTable, arrHeaderName) {
    // find column name
    for (; rIdx <= RowMax; ++rIdx) {
        const firstCell = GetCellData(worksheet, 0, rIdx);
        if (firstCell == undefined || !utils.StrNotEmpty(firstCell.w)) {
            continue;
        }
        if (firstCell.w[0] == '#') {
            continue;
        }
        const tmpArry = [];
        for (let cIdx = 0; cIdx <= ColumnMax; ++cIdx) {
            const cell = GetCellData(worksheet, cIdx, rIdx);
            if (cell == undefined || !utils.StrNotEmpty(cell.w) || cell.w[0] == '#') {
                continue;
            }
            const colGrp = GetCellFrontGroudColor(cell);
            const NamedGrp = config_1.gCfg.ColorToGroupMap[colGrp];
            if (NamedGrp == undefined) {
                utils.exception(`Excel "${utils.yellow_ul(fileName)}" Sheet "${utils.yellow_ul(sheetName)}" `
                    + `Cell "${utils.yellow_ul(utils.FMT26.NumToS26(cIdx) + (rIdx).toString())}" `
                    + `Name Group ${utils.yellow_ul(colGrp)} Invalid"!`);
            }
            arrHeaderName.push({ cIdx, name: cell.w, parser: new CTypeParser_1.CTypeParser(CTypeParser_1.ETypeNames.string), color: colGrp });
            tmpArry.push(cell.w);
        }
        DataTable.arrValues.push({ type: utils.ESheetRowType.header, values: tmpArry, rIdx });
        ++rIdx;
        break;
    }
    return rIdx;
}
function HandleWorkSheetDataColumn(worksheet, rIdx, RowMax, ColumnMax, fileName, sheetName, DataTable, arrHeaderName) {
    for (; rIdx <= RowMax; ++rIdx) {
        let firstCol = true;
        const tmpArry = [];
        for (let col of arrHeaderName) {
            const cell = GetCellData(worksheet, col.cIdx, rIdx);
            if (firstCol) {
                if (cell == undefined || !utils.StrNotEmpty(cell.w)) {
                    break;
                }
                else if (cell.w[0] == '#') {
                    break;
                }
                firstCol = false;
            }
            const value = cell && cell.w ? cell.w : '';
            let colObj;
            try {
                colObj = col.parser.ParseContent(cell);
                tmpArry[col.cIdx] = colObj;
            }
            catch (ex) {
                // col.checker.ParseDataStr(cell);
                utils.exceptionRecord(`Excel "${utils.yellow_ul(fileName)}" Sheet "${utils.yellow_ul(sheetName)}" `
                    + `Cell "${utils.yellow_ul(utils.FMT26.NumToS26(col.cIdx) + (rIdx + 1).toString())}" `
                    + `Parse Data "${utils.yellow_ul(value)}" With ${utils.yellow_ul(col.parser.s)} `
                    + `Cause utils.exception "${utils.red(ex)}"!`);
                return -1;
            }
            if (config_1.gCfg.EnableTypeCheck) {
                if (!col.parser.CheckContentVaild(colObj)) {
                    col.parser.CheckContentVaild(colObj); // for debug used
                    utils.exceptionRecord(`Excel "${utils.yellow_ul(fileName)}" Sheet "${utils.yellow_ul(sheetName)}" `
                        + `Cell "${utils.yellow_ul(utils.FMT26.NumToS26(col.cIdx) + (rIdx + 1).toString())}" `
                        + `format not match "${utils.yellow_ul(value)}" with ${utils.yellow_ul(col.parser.s)}!`);
                    return -1;
                }
            }
        }
        if (!firstCol) {
            DataTable.arrValues.push({ type: utils.ESheetRowType.data, values: tmpArry, rIdx });
        }
    }
    return rIdx;
}
function HandleWorkSheet(fileName, sheetName, worksheet) {
    if (worksheet['!ref'] == undefined) {
        utils.debug(`- Pass Sheet "${sheetName}" : Sheet is empty`);
        return;
    }
    if (!utils.StrNotEmpty(sheetName) || sheetName[0] == "!") {
        utils.debug(`- Pass Sheet "${sheetName}" : Sheet Name start with "!"`);
        return;
    }
    const Range = xlsx.utils.decode_range(worksheet['!ref']);
    const ColumnMax = Range.e.c;
    const RowMax = Range.e.r;
    const arrHeaderName = new Array();
    // find max column and rows
    let rIdx = 0;
    const DataTable = new utils.SheetDataTable(sheetName, fileName);
    // handle custom data
    if (CTypeParser_1.CTypeParser.CustomDataNode) {
        let ret = utils.FMT26.StringToColRow(CTypeParser_1.CTypeParser.CustomDataNode);
        let data = GetCellData(worksheet, ret.col - 1, ret.row - 1);
        if (data) {
            DataTable.customData = data === null || data === void 0 ? void 0 : data.w;
            rIdx = ret.row;
        }
    }
    // find column name
    rIdx = HandleWorkSheetNameColumn(worksheet, rIdx, RowMax, ColumnMax, fileName, sheetName, DataTable, arrHeaderName);
    if (rIdx < 0)
        return;
    // find type
    rIdx = HandleWorkSheetTypeColumn(worksheet, rIdx, RowMax, ColumnMax, fileName, sheetName, DataTable, arrHeaderName);
    if (rIdx < 0)
        return;
    // handle datas
    rIdx = HandleWorkSheetDataColumn(worksheet, rIdx, RowMax, ColumnMax, fileName, sheetName, DataTable, arrHeaderName);
    if (rIdx < 0)
        return;
    return DataTable;
}
//#endregion
//# sourceMappingURL=excel_utils.js.map