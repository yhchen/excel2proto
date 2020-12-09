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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CHightTypeChecker = void 0;
const util_1 = require("util");
const utils = __importStar(require("./utils"));
let type_enums = undefined;
let type_checker = undefined;
let type_defines = undefined;
let setHeaderNameMap;
let setRowData;
function InitEnv() {
    try {
        const checker = require(CHightTypeChecker.TypeCheckerJSFilePath);
        type_enums = checker.enums;
        type_checker = checker.checker;
        type_defines = checker.defines;
        setHeaderNameMap = checker.setHeaderNameMap;
        setRowData = checker.setRowData;
        const checkColContainsValueMap = new Map();
        for (const [SheetName, ExcelData] of utils.ExportExcelDataMap) {
            const Binder = {};
            for (const header of ExcelData.arrTypeHeader) {
                const handler = ExcelData.checkColumnContainsValue.bind(ExcelData, header.name);
                Binder[header.name] = handler;
            }
            checkColContainsValueMap.set(SheetName, Binder);
        }
        checker.initialize(checkColContainsValueMap);
    }
    catch (ex) {
        utils.exceptionRecord(`type_extens_checker: ${CHightTypeChecker.TypeCheckerJSFilePath} format error ${ex}`);
        process.exit(-1001 /* INIT_EXTENDS */);
    }
    // convert enum (key -> value) to (value -> key)
    for (let key in type_enums) {
        const node = type_enums[key];
        if (util_1.isFunction(node))
            continue; // skip function
        let newNode = {};
        for (let k in node) {
            newNode[node[k]] = k;
            newNode[k] = node[k];
        }
        type_enums[key] = newNode;
    }
}
function defaultFunc(value) {
    return true;
}
const KeySet = new Set([',', '[', ']']);
function findBaseType(s, idx = 0) {
    for (let i = idx; i < s.length; ++i) {
        if (KeySet.has(s[i])) {
            return s.substr(idx, i - idx);
        }
    }
    return s.substr(idx);
}
class CTypeGenerator {
    constructor() {
        this._lst = [];
        this._func = defaultFunc;
        this._lstMode = false;
    }
    addFunc(func) {
        if (this._lstMode) {
            this._lst.push(func);
        }
        this._func = func;
    }
    addArray() {
        if (this._lstMode) {
            this.setLstMode(false);
        }
        const func = this._func;
        this._func = (value) => {
            if (!value)
                return true;
            for (const v of value) {
                if (!func(v)) {
                    return false;
                }
            }
            return true;
        };
    }
    setLstMode(v) {
        if (this._lstMode == v)
            return;
        this._lstMode = v;
        if (!this._lstMode) {
            const lst = this._lst;
            this._lst = [];
            this._func = (value) => {
                for (let i = 0; i < lst.length; ++i) {
                    if (!lst[i](value[i]))
                        return false;
                }
                return true;
            };
        }
    }
    generate() {
        this.setLstMode(false);
        return this._func;
    }
}
class CHightTypeChecker {
    constructor(s) {
        this._checkFunc = defaultFunc;
        this._type = s;
    }
    init() {
        if (!type_checker) {
            InitEnv();
        }
        const generator = new CTypeGenerator();
        this.initInner(generator, this._type, 0);
        this._checkFunc = generator.generate();
    }
    static setHeaderNameMap(headerNameMap) {
        setHeaderNameMap(headerNameMap);
    }
    static setRowData(rowData) {
        setRowData(rowData);
    }
    get s() { return this._type; }
    checkType(obj) {
        return this._checkFunc(obj);
    }
    initInner(generator, s, idx) {
        for (let i = idx; i < s.length; ++i) {
            const c = s[i];
            if (c == '[') {
                if (i + 1 < s.length && s[i + 1] == ']') {
                    ++i;
                    generator.addArray();
                }
                else {
                    generator.setLstMode(true);
                }
            }
            else if (c == ']') {
                generator.setLstMode(false);
            }
            else {
                if (c == ',') {
                    ++i;
                }
                const baseName = findBaseType(s, i);
                if (baseName == '') {
                    throw `inner error!`;
                }
                generator.addFunc(this.initBaseType(baseName));
                i += baseName.length - 1;
            }
        }
    }
    initBaseType(s) {
        if (s.indexOf('.') >= 0) {
            // handle sheet column check
            const sp = s.split('.');
            if (sp.length != 2) {
                throw `Sheet Index Type Format Error.(Example: [SheetName].[ColumnName])`;
            }
            const sheetName = sp[0];
            const columnName = sp[1];
            const dataTable = utils.ExportExcelDataMap.get(sheetName);
            if (dataTable == undefined) {
                throw `Sheet High Type Format Error. SheetName ${utils.yellow_ul(sheetName)} not found.`;
            }
            if (!dataTable.containsColumName(columnName)) {
                throw `Sheet High Type Format Error. Column Name ${utils.yellow_ul(sheetName + '.' + columnName)} not found.`;
            }
            return (value) => {
                return dataTable.checkColumnContainsValue(columnName, value);
            };
        }
        else if (s.indexOf('()') >= 0) {
            // handle function check
            const funcName = s.replace('()', '');
            const checkerFunc = type_checker[funcName];
            if (!checkerFunc || !util_1.isFunction(checkerFunc)) {
                throw `Sheet High Type Format Error. checker_func ${utils.yellow_ul(funcName)} not found.`;
            }
            return checkerFunc;
        }
        const enumeration = type_enums[s];
        if (!enumeration || util_1.isFunction(enumeration)) {
            throw `Sheet High Type Format Error. checker_func ${utils.yellow_ul(s)} not found.`;
        }
        return (value) => { return enumeration[value] != undefined; };
    }
}
exports.CHightTypeChecker = CHightTypeChecker;
CHightTypeChecker.TypeCheckerJSFilePath = './type_extens_checker';
//# sourceMappingURL=CHighTypeChecker.js.map