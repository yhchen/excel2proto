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
import { isArray, isObject, isNumber, isString, isDate } from 'lodash';
import * as moment from 'moment';

function NullStr(s: string) {
	if (isString(s)) {
		return s.trim().length <= 0;
	}
	return true;
}

function VaildNumber(s: string): boolean {
	return (+s).toString() === s;
}

const WORDSCHAR = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_';
const NUMCHAR = '0123456789';
function FindWord(s: string, idx?: number): {start:number, end:number, len:number}|undefined {
	let first = true;
	let start = 0, end = s.length-1;
	for (let i = idx?idx:0; i < s.length; ++i) {
		if (first) {
			if (s[i] == ' ' || s[i] == '	') continue;
			if (WORDSCHAR.indexOf(s[i]) < 0) return undefined;
			first = false;
			start = i;
			continue;
		}
		if (WORDSCHAR.indexOf(s[i]) < 0) {
			end = i-1;
			break;
		}
	}
	return (end>=start)&&!first?{start,end,len:end-start+1}:undefined;
}

function FindNum(s: string, idx?: number): {start:number, end:number, len:number}|undefined {
	let first = true;
	let start = 0, end = s.length-1;
	for (let i = idx?idx:0; i < s.length; ++i) {
		if (first) {
			if (s[i] == ' ' || s[i] == '	') continue;
			if (NUMCHAR.indexOf(s[i]) < 0) return undefined;
			first = false;
			start = i;
			continue;
		}
		if (NUMCHAR.indexOf(s[i]) < 0) {
			end = i-1;
			break;
		}
	}
	return (end>=start)&&!first?{start,end,len:end-start+1}:undefined;
}

let DateFmt: string = moment.HTML5_FMT.DATETIME_LOCAL_SECONDS;
console.log(`[TypeCheck] : Default Date format is "${DateFmt}"`);

let TinyDateFMT: string = 'YYYY/MM/DD';
console.log(`[TypeCheck] : Default Tiny Date format is "${TinyDateFMT}"`);

const TimeZoneOffset = new Date().getTimezoneOffset() * 60;
console.log(`[TypeCheck] : Time zone offset is "${TimeZoneOffset}"`);

// float precision count
let FractionDigitsFMT = 6;
console.log(`[TypeCheck] : Default Float PrecisionFMT count is "${FractionDigitsFMT}"`);

// number type range
const NumberRangeMap = new Map<string, {min:number, max:number}>([
		['char',	{ min:-127,			max:127 }],
		['uchar',	{ min:0,			max:255 }],
		['short',	{ min:-32768,		max:32767 }],
		['ushort',	{ min:0,			max:65535 }],
		['int',		{ min:-2147483648,	max:2147483647 }],
		['uint',	{ min:0,			max:4294967295 }],
	]);

const BooleanKeyMap = new Map<string, boolean>([ ['true', true], ['false', false], ['0', false ], ['1', true], ]);

function CheckNumberInRange(n: number, type: CType): boolean {
	if (type.typename == undefined) return true;
	const range = NumberRangeMap.get(type.typename);
	if (range == undefined) return true;
	return n >= range.min && n <= range.max;
}

// type name enum
export enum ETypeNames {
	char		=	'char',			uchar		=	'uchar',
	short		=	'short',		ushort		=	'ushort',
	int			=	'int',			uint		=	'uint',
	int64		=	'int64',		uint64		=	'uint64',
	string		=	'string',
	double		=	'double',		float		=	'float',
	bool		=	'bool',
	vector2		=	'vector2',		vector3		=	'vector3',
	date		=	'date',			tinydate	=	'tinydate',
	timestamp	=	'timestamp',	utctime		=	'utctime',
};

const TypeDefaultValue = new Map<ETypeNames|undefined, {w:string, v:any}>([
	[ ETypeNames.char, {w:'0',v:0} ],				[ ETypeNames.uchar, {w:'0',v:0} ],
	[ ETypeNames.short, {w:'0',v:0} ],				[ ETypeNames.ushort, {w:'0',v:0} ],
	[ ETypeNames.int, {w:'0',v:0} ],				[ ETypeNames.uint, {w:'0',v:0} ],
	[ ETypeNames.int64, {w:'0',v:0} ],				[ ETypeNames.uint64, {w:'0',v:0} ],
	[ ETypeNames.string, {w:'',v:''} ],
	[ ETypeNames.double, {w:'0',v:0} ],				[ ETypeNames.float, {w:'0',v:0} ],
	[ ETypeNames.bool, {w:'false',v:false} ],
	[ ETypeNames.date, {w:'',v:''} ],				[ ETypeNames.tinydate, {w:'',v:''} ],
	[ ETypeNames.timestamp, {w:'0',v:0} ],			[ ETypeNames.utctime, {w:'0',v:0} ],
]);

// number type
const BaseNumberTypeSet = new Set<string>([ ETypeNames.char, ETypeNames.uchar, ETypeNames.short, ETypeNames.ushort, ETypeNames.int,
											ETypeNames.uint, ETypeNames.int64, ETypeNames.uint64, ETypeNames.double, ETypeNames.float, ]);
// date type
const BaseDateTypeSet = new Set<string>([ ETypeNames.date, ETypeNames.tinydate, ETypeNames.timestamp, ETypeNames.utctime, ]);

export const enum EType {
	array,
	base,
	date,
}

export interface CType
{
	type: EType;
	is_number: boolean;
	typename?: ETypeNames;
	num?: number;
	next?: CType;
	obj?: {[name:string]: CType};
}

export class CTypeChecker
{
	public constructor(typeString: string) {
		this.__s = typeString;
		let s = typeString.replace(/ /g, '').replace(/\t/g, '').replace(/\n/g, '').replace(/\r/g, '').toLowerCase();
		if (NullStr(s)) {
			this._type = {type:EType.base, typename:ETypeNames.string, is_number:false};
			return;
		}
		let tt = _ParseType({s, idx:0});
		if (tt == undefined) throw `gen type check error: no data`;
		this._type = tt;
	}

	public get s(): string { return this.__s; }
	public get type(): CType { return this._type; }
	public get isArray(): boolean { return this._type.type == EType.array; }
	public get DefaultValue(): any {
		let r = TypeDefaultValue.get(this._type.typename);
		return (r !== undefined) ? r.v : undefined;
	}
	public get SDefaultValue(): string {
		let r = TypeDefaultValue.get(this._type.typename);
		return (r !== undefined) ? r.w : '';
	}
	// get and set Date Format
	public static set DateFmt(s: string) { DateFmt = s; console.log(`[TypeCheck] : Change Date format to "${DateFmt}"`) }
	public static get DateFmt(): string { return DateFmt; }
	// get and set Tiny Date Format
	public static set TinyDateFmt(s: string) { TinyDateFMT = s; console.log(`[TypeCheck] : Change Tiny Date format to "${TinyDateFMT}"`); }
	public static get TinyDateFmt(): string { return TinyDateFMT; }
	// get and set Float Precision Format
	public static set FractionDigitsFMT(v: number) { FractionDigitsFMT = v; console.log(`[TypeCheck] : Change Float precision to "${FractionDigitsFMT}"`); }
	public static get FractionDigitsFMT(): number { return FractionDigitsFMT; }

	public CheckContentVaild(tmpObj: any): boolean {
		if (tmpObj == undefined || NullStr(tmpObj)) {
			return true;
		}
		return this.CheckObjectType(tmpObj, this._type);
	}

	/**
	 * @description parse content by type
	 */
	public ParseContent(value: {w?:string, v?:string|number|boolean|Date}|undefined): any {
		if (value == undefined || value.w == undefined || NullStr(value.w)) return undefined;
		switch (this._type.type) {
			case EType.array:
				const tmpObj = JSON.parse(value.w);
				if (!isArray(tmpObj)) throw `${value} is not a valid json type`;
				if (this._type.next == undefined) throw `type array next is undefined`;
				for (let i = 0; i < tmpObj.length; ++i) {
					tmpObj[i] = _Parse(tmpObj[i], this._type.next);
				}
				return tmpObj;
			case EType.base:
				if (this._type.is_number) {
					return _ParseNumber(<any>value.v||value.w||'', this._type);
				} else if (this._type.typename == ETypeNames.bool) {
					return BooleanKeyMap.get(value.w.toLowerCase());
				} else {
					return value.w
				}
			case EType.date:
				return _ParseDate(value.v, this._type);
			default:
				throw `unknown type = ${this._type.type}`
		}
	}

	private CheckObjectType(tmpObj:any, type: CType|undefined) : boolean {
		if (tmpObj == undefined || type == undefined)	return true;
		switch (type.type) {
		case EType.array:
			if (!isArray(tmpObj)) return false;
			if (type.num !== undefined && type.num != tmpObj.length) return false;
			for (let i = 0; i < tmpObj.length; ++i) {
				if (type.next == undefined || !this.CheckObjectType(tmpObj[i], type.next)) {
					return false;
				}
			}
			break;
		case EType.base:
			if (type.is_number) {
				if (isNumber(tmpObj)) {
					return CheckNumberInRange(tmpObj, type);
				}
				else if (isString(tmpObj) && VaildNumber(tmpObj)) {
					return CheckNumberInRange(+tmpObj, type);
				}
				return false;
			} else if (type.typename == ETypeNames.bool) {
				return BooleanKeyMap.has(tmpObj.toLowerCase());
			}
			return isString(tmpObj);
		case EType.date:
			return moment.default(tmpObj, DateFmt).isValid();
		}
		return true;
	}

	private _type:CType;
	private __s: string;
}

// private function
function _ParseType(p:{s:string, idx:number}): CType|undefined {
	let thisNode:CType|undefined = undefined;
	// skip write space
	if (p.idx >= p.s.length) undefined;
	if (p.s[p.idx] == '[') {
		++p.idx;
		let num:number|undefined = undefined;
		if (p.idx >= p.s.length)	throw `gen type check error: '}' not found!`;
		if (p.s[p.idx] != ']') {
			let numscope = FindNum(p.s, p.idx);
			if (numscope == undefined) throw `gen type check error: array [<NUM>] format error!`;
			p.idx = numscope.end+1;
			num = parseInt(p.s.substr(numscope.start, numscope.len));
		}
		if (p.idx >= p.s.length)	throw `gen type check error: ']' not found!`;
		if (p.s[p.idx] != ']') {
			throw `gen type check error: array [<NUM>] ']' not found!`;
		}
		++p.idx;
		let arrNode:CType = {type:EType.array, num, is_number:false};
		if (p.idx < p.s.length && p.s[p.idx] == '[') {
			let nextArrNode = _ParseType(p);
			if (!nextArrNode) throw `gen type check error: multi array error!`;
			arrNode.next = nextArrNode;
		}
		return arrNode;
	} else {
		const typescope = FindWord(p.s, p.idx);
		if (!typescope) {
			throw `gen type check error: base type not found!`;
		}
		const typename = p.s.substr(typescope.start, typescope.len);
		if (!ETypeNames[<any>typename]) throw `gen type check error: base type = ${typename} not exist!`;
		if (typename == ETypeNames.vector2 || typename == ETypeNames.vector3) {
			thisNode = {type:EType.base, typename:ETypeNames.float, is_number:true};
			const prevNode: CType = { type:EType.array, num:((typename==ETypeNames.vector2)?2:3), is_number:false };
			prevNode.next = thisNode;
			thisNode = prevNode;
		} else {
			thisNode = {type: BaseDateTypeSet.has(typename)?EType.date:EType.base, typename:<ETypeNames>typename, is_number:BaseNumberTypeSet.has(typename)};
		}
		p.idx = typescope.end+1;
	}

	if (p.s[p.idx] == '[') {
		let tt = _ParseType(p);
		if (tt == undefined) throw `gen type check error: [] type error`;
		const typeNode = thisNode;
		thisNode = tt;
		while (tt.next != undefined) {
			tt = tt.next;
		}
		tt.next = typeNode;
	}
	return thisNode;
}

function _ParseDate(date: any, type: CType): string|number {
	if (type.type != EType.date) throw `value is not a date type`;
	if (isDate(date)) {
		switch (type.typename) {
			case ETypeNames.utctime:
				return (Math.round(date.getTime() / 1000 + TimeZoneOffset));
			case ETypeNames.timestamp:
				return (Math.round(date.getTime() / 1000));
			case ETypeNames.date:
				return moment.default(date).format(DateFmt);
			case ETypeNames.tinydate:
				return moment.default(date).format(TinyDateFMT);
		}
	} else if (isString(date)) {
		const oDate = moment.default(date, DateFmt);
		if (!oDate.isValid()) throw `[TypeChecker] Date Type "${date}" Invalid!`;
		return _ParseDate(oDate.toDate(), type);
	}
	return date||'';
}

function _ParseNumber(n: number|string, type: CType): number {
	if (!type.is_number) throw `value is not a number`;
	if (isNumber(n)) {
		let num = 0;
		if (type.typename == ETypeNames.double || type.typename == ETypeNames.float) {
			num = +n.toFixed(FractionDigitsFMT);
		} else {
			num = Math.floor(n);
		}
		// if (num < 1) {
		// 	return num.toString().replace(/0\./g, '.');
		// }
		return num;
	}
	if (type.typename == ETypeNames.double || type.typename == ETypeNames.float) {
		return _ParseNumber(parseFloat(n), type);
	}
	return _ParseNumber(parseInt(n), type);
}

function _Parse(value: any, type: CType|undefined): any {
	if (type == undefined) return value;
	switch (type.type) {
		case EType.array:
			{
				if (!isArray(value)) throw `${value} is not a valid json type`;
				if (type.next == undefined) throw `type array next is undefined`;
				for (let i = 0; i < value.length; ++i) {
					value[i] = _Parse(value[i], type.next);
				}
			}
			return value;
		case EType.base:
			if (type.is_number) {
				return _ParseNumber(value, type);
			} else if (type.typename == ETypeNames.bool) {
				return BooleanKeyMap.get(value.w.toLowerCase());
			}
			return value||'';
		case EType.date:
			return _ParseDate(value, type);
	}
	return value||'';
}


export function TestTypeChecker() {
	console.log(new CTypeChecker('int'));
	console.log(new CTypeChecker('string'));
	console.log(new CTypeChecker('int[]'));
	console.log(new CTypeChecker('int[2]'));
	console.log(new CTypeChecker('int[][2]'));
	console.log(new CTypeChecker('int[][]'));
	console.log(new CTypeChecker('{t:string}'));
	console.log(new CTypeChecker('{t:string, t1:string}'));
	console.log(new CTypeChecker('{t:string, t1:string}[]'));
	console.log(new CTypeChecker('{t:string, t1:{ut1:string}}[]'));
	console.log(new CTypeChecker('{t:string, t1:{ut1:string}[]}[]'));
}
