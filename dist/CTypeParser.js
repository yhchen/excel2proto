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
exports.TestTypeParser = exports.CTypeParser = exports.ETypeNames = void 0;
/**
 * Support Format Check:
 *      Using typescript type define link grammar.
 *      Extends number type for digital size limit check.
 *      Add common types of game development(like vector2 vector3...);
 *
 * Base Type:
 *      -----------------------------------------------------------------------------
 *      |        type       |                        desc                           |
 *      -----------------------------------------------------------------------------
 *      |      char         | min:-127                  max:127                     |
 *      |      uchar        | min:0                     max:255                     |
 *      |      short        | min:-32768                max:32767                   |
 *      |      ushort       | min:0                     max:65535                   |
 *      |      int          | min:-2147483648           max:2147483647              |
 *      |      uint         | min:0                     max:4294967295              |
 *      |      int64        | min:-9223372036854775808  max:9223372036854775807     |
 *      |      uint64       | min:0                     max:18446744073709551615    |
 *      |      string       | auto change 'line break' to '\n'                      |
 *      |      double       | ...                                                   |
 *      |      float        | ...                                                   |
 *      |      bool         | true: 'true' or '1'       false: 'false' empty or '0' |
 *      |      date         | YYYY/MM/DD HH:mm:ss                                   |
 *      |      tinydate     | YYYY/MM/DD                                            |
 *      |      timestamp    | Linux time stamp                                      |
 *      |      utctime      | UTC time stamp                                        |
 *      -----------------------------------------------------------------------------
 *
 *
 * Combination Type:
 *      -----------------------------------------------------------------------------
 *      | <type>[<N>|null]  | <type> is one of "Base Type" or "Combination Type".   |
 *      |                   | <N> is empty(variable-length) or number.              |
 *      -----------------------------------------------------------------------------
 *      | vector2           | float[2]                                              |
 *      -----------------------------------------------------------------------------
 *      | vector3           | float[3]                                              |
 *      -----------------------------------------------------------------------------
 */
const lodash_1 = require("lodash");
const moment = __importStar(require("moment"));
function NullStr(s) {
    if (lodash_1.isString(s)) {
        return s.trim().length <= 0;
    }
    return true;
}
function VaildNumber(s) {
    return (+s).toString() === s;
}
const WORDSCHAR = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_';
const NUMCHAR = '0123456789';
function FindWord(s, idx) {
    let first = true;
    let start = 0, end = s.length - 1;
    for (let i = idx ? idx : 0; i < s.length; ++i) {
        if (first) {
            if (s[i] == ' ' || s[i] == '	')
                continue;
            if (WORDSCHAR.indexOf(s[i]) < 0)
                return undefined;
            first = false;
            start = i;
            continue;
        }
        if (WORDSCHAR.indexOf(s[i]) < 0) {
            end = i - 1;
            break;
        }
    }
    return (end >= start) && !first ? { start, end, len: end - start + 1 } : undefined;
}
function FindNum(s, idx) {
    let first = true;
    let start = 0, end = s.length - 1;
    for (let i = idx ? idx : 0; i < s.length; ++i) {
        if (first) {
            if (s[i] == ' ' || s[i] == '	')
                continue;
            if (NUMCHAR.indexOf(s[i]) < 0)
                return undefined;
            first = false;
            start = i;
            continue;
        }
        if (NUMCHAR.indexOf(s[i]) < 0) {
            end = i - 1;
            break;
        }
    }
    return (end >= start) && !first ? { start, end, len: end - start + 1 } : undefined;
}
let DateFmt = moment.HTML5_FMT.DATETIME_LOCAL_SECONDS;
console.log(`[TypeParser] : Default Date format is "${DateFmt}"`);
let TinyDateFMT = 'YYYY/MM/DD';
console.log(`[TypeParser] : Default Tiny Date format is "${TinyDateFMT}"`);
let TimeStampUseMS = false;
console.log(`[TypeParser] : Default Timestamp use "${TimeStampUseMS ? "ms" : "second"}"`);
const TimeZoneOffset = new Date().getTimezoneOffset() * 60;
console.log(`[TypeParser] : Time zone offset is "${TimeZoneOffset}"`);
let CustomDataNode;
console.log(`[TypeParser] : Default CustomDataNode "<undefined>"`);
// float precision count
let FractionDigitsFMT = 6;
console.log(`[TypeParser] : Default Float PrecisionFMT count is "${FractionDigitsFMT}"`);
// number type range
const NumberRangeMap = new Map([
    ['char', { min: -127, max: 127 }],
    ['uchar', { min: 0, max: 255 }],
    ['short', { min: -32768, max: 32767 }],
    ['ushort', { min: 0, max: 65535 }],
    ['int', { min: -2147483648, max: 2147483647 }],
    ['uint', { min: 0, max: 4294967295 }],
]);
const BooleanKeyMap = new Map([['true', true], ['false', false], ['0', false], ['1', true],]);
function CheckNumberInRange(n, type) {
    if (type.typename == undefined)
        return true;
    const range = NumberRangeMap.get(type.typename);
    if (range == undefined)
        return true;
    return n >= range.min && n <= range.max;
}
// type name enum
var ETypeNames;
(function (ETypeNames) {
    ETypeNames["char"] = "char";
    ETypeNames["uchar"] = "uchar";
    ETypeNames["short"] = "short";
    ETypeNames["ushort"] = "ushort";
    ETypeNames["int"] = "int";
    ETypeNames["uint"] = "uint";
    ETypeNames["int64"] = "int64";
    ETypeNames["uint64"] = "uint64";
    ETypeNames["string"] = "string";
    ETypeNames["double"] = "double";
    ETypeNames["float"] = "float";
    ETypeNames["bool"] = "bool";
    ETypeNames["vector2"] = "vector2";
    ETypeNames["vector3"] = "vector3";
    ETypeNames["date"] = "date";
    ETypeNames["tinydate"] = "tinydate";
    ETypeNames["timestamp"] = "timestamp";
    ETypeNames["utctime"] = "utctime";
})(ETypeNames = exports.ETypeNames || (exports.ETypeNames = {}));
;
const TypeDefaultValue = new Map([
    [ETypeNames.char, { w: '0', v: 0 }], [ETypeNames.uchar, { w: '0', v: 0 }],
    [ETypeNames.short, { w: '0', v: 0 }], [ETypeNames.ushort, { w: '0', v: 0 }],
    [ETypeNames.int, { w: '0', v: 0 }], [ETypeNames.uint, { w: '0', v: 0 }],
    [ETypeNames.int64, { w: '0', v: 0 }], [ETypeNames.uint64, { w: '0', v: 0 }],
    [ETypeNames.string, { w: '', v: '' }],
    [ETypeNames.double, { w: '0', v: 0 }], [ETypeNames.float, { w: '0', v: 0 }],
    [ETypeNames.bool, { w: 'false', v: false }],
    [ETypeNames.date, { w: '', v: '' }], [ETypeNames.tinydate, { w: '', v: '' }],
    [ETypeNames.timestamp, { w: '0', v: 0 }], [ETypeNames.utctime, { w: '0', v: 0 }],
]);
// number type
const BaseNumberTypeSet = new Set([ETypeNames.char, ETypeNames.uchar, ETypeNames.short, ETypeNames.ushort, ETypeNames.int,
    ETypeNames.uint, ETypeNames.int64, ETypeNames.uint64, ETypeNames.double, ETypeNames.float,]);
// date type
const BaseDateTypeSet = new Set([ETypeNames.date, ETypeNames.tinydate, ETypeNames.timestamp, ETypeNames.utctime,]);
class CTypeParser {
    constructor(typeString) {
        this.__s = typeString;
        let s = typeString.replace(/ /g, '').replace(/\t/g, '').replace(/\n/g, '').replace(/\r/g, '').toLowerCase();
        if (NullStr(s)) {
            this._type = { type: 1 /* base */, typename: ETypeNames.string, is_number: false };
            return;
        }
        let tt = _ParseType({ s, idx: 0 });
        if (tt == undefined)
            throw `gen type check error: no data`;
        this._type = tt;
    }
    get s() { return this.__s; }
    get type() { return this._type; }
    get isArray() { return this._type.type == 0 /* array */; }
    get DefaultValue() {
        let r = TypeDefaultValue.get(this._type.typename);
        return (r !== undefined) ? r.v : (this._type.type == 0 /* array */ ? [] : undefined);
    }
    get SDefaultValue() {
        let r = TypeDefaultValue.get(this._type.typename);
        return (r !== undefined) ? r.w : '';
    }
    // get and set Date Format
    static set DateFmt(s) { DateFmt = s; console.log(`[TypeParser] : Change Date format to "${DateFmt}"`); }
    static get DateFmt() { return DateFmt; }
    // get and set Tiny Date Format
    static set TinyDateFmt(s) { TinyDateFMT = s; console.log(`[TypeParser] : Change Tiny Date format to "${TinyDateFMT}"`); }
    static get TinyDateFmt() { return TinyDateFMT; }
    // get and set timestamp use second or ms
    static set TimeStampUseMS(s) { TimeStampUseMS = s; console.log(`[TypeParser] : Change Tiny Date format to "${TimeStampUseMS}"`); }
    static get TimeStampUseMS() { return TimeStampUseMS; }
    // get and set Float Precision Format
    static set FractionDigitsFMT(v) { FractionDigitsFMT = v; console.log(`[TypeParser] : Change Float precision to "${FractionDigitsFMT}"`); }
    static get FractionDigitsFMT() { return FractionDigitsFMT; }
    // get and set custom data node
    static set CustomDataNode(s) { CustomDataNode = s; console.log(`[TypeParser] : Custom Data Node "${CustomDataNode}"`); }
    static get CustomDataNode() { return CustomDataNode; }
    CheckContentVaild(tmpObj) {
        if (tmpObj == undefined || NullStr(tmpObj)) {
            return true;
        }
        return this.CheckObjectType(tmpObj, this._type);
    }
    /**
     * @description parse content by type
     */
    ParseContent(value) {
        if (value == undefined || value.w == undefined || NullStr(value.w))
            return undefined;
        switch (this._type.type) {
            case 0 /* array */:
                return _Parse(value.w, this._type);
            // const tmpObj = JSON.parse(value.w);
            // if (!isArray(tmpObj))
            // 	throw `${value} is not a valid json type`;
            // if (this._type.next == undefined)
            // 	throw `type array next is undefined`;
            // for (let i = 0; i < tmpObj.length; ++i) {
            // 	tmpObj[i] = _Parse(tmpObj[i], this._type.next, 0);
            // }
            // return tmpObj;
            case 1 /* base */:
                if (this._type.is_number) {
                    return _ParseNumber(value.v || value.w || '', this._type);
                }
                else if (this._type.typename == ETypeNames.bool) {
                    return BooleanKeyMap.get(value.w.toLowerCase());
                }
                else {
                    return value.w;
                }
            case 2 /* date */:
                return _ParseDate(value.v, this._type);
            default:
                throw `unknown type = ${this._type.type}`;
        }
    }
    CheckObjectType(tmpObj, type) {
        if (tmpObj == undefined || type == undefined)
            return true;
        switch (type.type) {
            case 0 /* array */:
                if (!lodash_1.isArray(tmpObj))
                    return false;
                if (type.num !== undefined && type.num != tmpObj.length)
                    return false;
                for (let i = 0; i < tmpObj.length; ++i) {
                    if (type.next == undefined || !this.CheckObjectType(tmpObj[i], type.next)) {
                        return false;
                    }
                }
                break;
            case 1 /* base */:
                if (type.is_number) {
                    if (lodash_1.isNumber(tmpObj)) {
                        return CheckNumberInRange(tmpObj, type);
                    }
                    else if (lodash_1.isString(tmpObj) && VaildNumber(tmpObj)) {
                        return CheckNumberInRange(+tmpObj, type);
                    }
                    return false;
                }
                else if (type.typename == ETypeNames.bool) {
                    return BooleanKeyMap.has(tmpObj.toLowerCase());
                }
                return lodash_1.isString(tmpObj);
            case 2 /* date */:
                return moment.default(tmpObj, DateFmt).isValid();
        }
        return true;
    }
}
exports.CTypeParser = CTypeParser;
// private function
function _FixArrayLevel(type) {
    if (type.next && type.next.type == 0 /* array */) {
        const lv = _FixArrayLevel(type.next) + 1;
        type.arr_level = lv;
        return lv;
    }
    type.arr_level = 0;
    return 0;
}
function _ParseType(p) {
    let thisNode = undefined;
    // skip write space
    if (p.idx >= p.s.length)
        undefined;
    if (p.s[p.idx] == '[') {
        ++p.idx;
        let num = undefined;
        if (p.idx >= p.s.length)
            throw `gen type check error: '}' not found!`;
        if (p.s[p.idx] != ']') {
            let numscope = FindNum(p.s, p.idx);
            if (numscope == undefined)
                throw `gen type check error: array [<NUM>] format error!`;
            p.idx = numscope.end + 1;
            num = parseInt(p.s.substr(numscope.start, numscope.len));
        }
        if (p.idx >= p.s.length)
            throw `gen type check error: ']' not found!`;
        if (p.s[p.idx] != ']') {
            throw `gen type check error: array [<NUM>] ']' not found!`;
        }
        ++p.idx;
        let arrNode = { type: 0 /* array */, num, is_number: false };
        if (p.idx < p.s.length && p.s[p.idx] == '[') {
            let nextArrNode = _ParseType(p);
            if (!nextArrNode)
                throw `gen type check error: multi array error!`;
            arrNode.next = nextArrNode;
        }
        return arrNode;
    }
    else {
        const typescope = FindWord(p.s, p.idx);
        if (!typescope) {
            throw `gen type check error: base type not found!`;
        }
        const typename = p.s.substr(typescope.start, typescope.len);
        if (!ETypeNames[typename])
            throw `gen type check error: base type = ${typename} not exist!`;
        if (typename == ETypeNames.vector2 || typename == ETypeNames.vector3) {
            thisNode = { type: 1 /* base */, typename: ETypeNames.float, is_number: true };
            const prevNode = { type: 0 /* array */, num: ((typename == ETypeNames.vector2) ? 2 : 3), is_number: false, arr_level: 0 };
            prevNode.next = thisNode;
            thisNode = prevNode;
        }
        else {
            thisNode = { type: BaseDateTypeSet.has(typename) ? 2 /* date */ : 1 /* base */, typename: typename, is_number: BaseNumberTypeSet.has(typename) };
        }
        p.idx = typescope.end + 1;
    }
    if (p.s[p.idx] == '[') {
        let tt = _ParseType(p);
        if (tt == undefined)
            throw `gen type check error: [] type error`;
        const typeNode = thisNode;
        thisNode = tt;
        while (tt.next != undefined) {
            tt = tt.next;
        }
        tt.next = typeNode;
        let arrDepth = _FixArrayLevel(thisNode);
        if (arrDepth >= 3) {
            throw `Type "${p.s}" Array Level More Than 3 Is Not Allowed.`;
        }
    }
    return thisNode;
}
function _ParseDate(date, type) {
    if (type.type != 2 /* date */)
        throw `value is not a date type`;
    if (lodash_1.isDate(date)) {
        switch (type.typename) {
            case ETypeNames.utctime:
                return (Math.round(date.getTime() / 1000 + TimeZoneOffset));
            case ETypeNames.timestamp:
                if (TimeStampUseMS) {
                    return (Math.round(date.getTime() / 1000));
                }
                else {
                    return (Math.round(date.getTime()));
                }
            case ETypeNames.date:
                return moment.default(date).format(DateFmt);
            case ETypeNames.tinydate:
                return moment.default(date).format(TinyDateFMT);
        }
    }
    else if (lodash_1.isString(date)) {
        const oDate = moment.default(date, DateFmt);
        if (!oDate.isValid())
            throw `[TypeParserer] Date Type "${date}" Invalid!`;
        return _ParseDate(oDate.toDate(), type);
    }
    return date || '';
}
function _ParseNumber(n, type) {
    if (!type.is_number)
        throw `value is not a number`;
    if (lodash_1.isNumber(n)) {
        let num = 0;
        if (type.typename == ETypeNames.double || type.typename == ETypeNames.float) {
            num = +n.toFixed(FractionDigitsFMT);
        }
        else {
            num = Math.floor(n);
        }
        // if (num < 1) {
        // 	return num.toString().replace(/0\./g, '.');
        // }
        if (isNaN(num)) {
            throw `number type error!`;
        }
        return num;
    }
    if (type.typename == ETypeNames.double || type.typename == ETypeNames.float) {
        return _ParseNumber(parseFloat(n), type);
    }
    return _ParseNumber(parseInt(n), type);
}
const ArrayLevelSpilter = [',', ';', '\n', '\0'];
function _Parse(value, type) {
    if (type == undefined)
        return value;
    switch (type.type) {
        case 0 /* array */:
            {
                const Spliter = ArrayLevelSpilter[type.arr_level || 0];
                const arrStr = value.split(Spliter);
                const arrResult = new Array();
                // if (!isArray(value))
                // 	throw `${value} is not a valid json type`;
                if (type.next == undefined)
                    throw `type array next is undefined`;
                if (type.num != undefined && type.num != arrStr.length) {
                    throw `type array length = "${type.num}" Actual = "${arrStr.length}". Error At : "${value}"`;
                }
                for (let i = 0; i < arrStr.length; ++i) {
                    if (arrStr[i] == '')
                        continue; // skip empty element
                    arrResult.push(_Parse(arrStr[i], type.next));
                }
                return arrResult;
            }
        case 1 /* base */:
            if (type.is_number) {
                return _ParseNumber(value, type);
            }
            else if (type.typename == ETypeNames.bool) {
                return BooleanKeyMap.get(value.w.toLowerCase());
            }
            return value || '';
        case 2 /* date */:
            return _ParseDate(value, type);
    }
    return value || '';
}
function TestTypeParser() {
    console.log(new CTypeParser('int'));
    console.log(new CTypeParser('string'));
    console.log(new CTypeParser('int[]'));
    console.log(new CTypeParser('int[2]'));
    console.log(new CTypeParser('int[][2]'));
    console.log(new CTypeParser('int[][]'));
    console.log(new CTypeParser('{t:string}'));
    console.log(new CTypeParser('{t:string, t1:string}'));
    console.log(new CTypeParser('{t:string, t1:string}[]'));
    console.log(new CTypeParser('{t:string, t1:{ut1:string}}[]'));
    console.log(new CTypeParser('{t:string, t1:{ut1:string}[]}[]'));
}
exports.TestTypeParser = TestTypeParser;
//# sourceMappingURL=CTypeParser.js.map