import { isFunction } from 'util';
import * as utils from './utils';

let type_enums: any = undefined;
let type_checker: any = undefined;
let type_defines: any = undefined;
let setHeaderNameMap: (headerNameMap: Map<string, number>) => void;
let setRowData: (setRowData: Array<any>) => void;

function InitEnv() {
	try {
		const checker = require(CHightTypeChecker.TypeCheckerJSFilePath);
		type_enums = checker.enums;
		type_checker = checker.checker;
		type_defines = checker.defines;
		setHeaderNameMap = checker.setHeaderNameMap;
		setRowData = checker.setRowData;
		const checkColContainsValueMap = new Map<string, { [key: string]: (value: any) => boolean; }>();
		for (const [SheetName, ExcelData] of utils.ExportExcelDataMap) {
			const Binder: { [key: string]: (value: any) => boolean; } = {};
			for (const header of ExcelData.arrTypeHeader) {
				const handler = ExcelData.checkColumnContainsValue.bind(ExcelData, header.name);
				Binder[header.name] = handler;
			}
			checkColContainsValueMap.set(SheetName, Binder);
		}
		checker.initialize(checkColContainsValueMap);
	} catch (ex) {
		utils.exceptionRecord(`type_extens_checker: ${CHightTypeChecker.TypeCheckerJSFilePath} format error ${ex}`);
		process.exit(utils.E_ERROR_LEVEL.INIT_EXTENDS);
	}
	// convert enum (key -> value) to (value -> key)
	for (let key in type_enums) {
		const node = type_enums[key];
		if (isFunction(node)) continue; // skip function
		let newNode: any = {};
		for (let k in node) {
			newNode[node[k]] = k;
			newNode[k] = node[k];
		}
		type_enums[key] = newNode;
	}
}

type CheckFuncType = (value: any) => boolean;
function defaultFunc(value: any): boolean {
	return true;
}
const KeySet = new Set([',', '[', ']']);
function findBaseType(s: string, idx: number = 0): string {
	for (let i = idx; i < s.length; ++i) {
		if (KeySet.has(s[i])) {
			return s.substr(idx, i - idx);
		}
	}
	return s.substr(idx);
}

class CTypeGenerator {
	public addFunc(func: CheckFuncType) {
		if (this._lstMode) {
			this._lst.push(func);
		}
		this._func = func;
	}
	public addArray() {
		if (this._lstMode) {
			this.setLstMode(false);
		}
		const func = this._func;
		this._func = (value: any): boolean => {
			if (!value) return true;
			for (const v of value) {
				if (!func(v)) {
					return false;
				}
			}
			return true;
		};
	}
	public setLstMode(v: boolean) {
		if (this._lstMode == v)
			return;
		this._lstMode = v;
		if (!this._lstMode) {
			const lst = this._lst;
			this._lst = [];
			this._func = (value: any): boolean => {
				for (let i = 0; i < lst.length; ++i) {
					if (!lst[i](value[i]))
						return false;
				}
				return true;
			};
		}
	}
	public generate(): CheckFuncType {
		this.setLstMode(false);
		return this._func;
	}
	private _lst: CheckFuncType[] = [];
	private _func = defaultFunc;
	private _lstMode = false;
}

export class CHightTypeChecker {
	public constructor(s: string) { this._type = s; }

	public static TypeCheckerJSFilePath = './type_extens_checker';

	public init() {
		if (!type_checker) {
			InitEnv();
		}
		const generator = new CTypeGenerator();
		this.initInner(generator, this._type, 0);
		this._checkFunc = generator.generate();
	}

	public static setHeaderNameMap(headerNameMap: Map<string, number>): void {
		setHeaderNameMap(headerNameMap);
	}

	public static setRowData(rowData: Array<any>): void {
		setRowData(rowData);
	}

	public get s() { return this._type; }

	public checkType(obj: any): boolean {
		return this._checkFunc(obj);
	}

	private initInner(generator: CTypeGenerator, s: string, idx: number) {
		for (let i = idx; i < s.length; ++i) {
			const c = s[i];
			if (c == '[') {
				if (i + 1 < s.length && s[i + 1] == ']') {
					++i;
					generator.addArray();
				} else {
					generator.setLstMode(true);
				}
			} else if (c == ']') {
				generator.setLstMode(false);
			} else {
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

	private initBaseType(s: string): CheckFuncType {
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
			return (value: any) => {
				return dataTable.checkColumnContainsValue(columnName, value);
			};
		} else if (s.indexOf('()') >= 0) {
			// handle function check
			const funcName = s.replace('()', '');
			const checkerFunc = type_checker[funcName];
			if (!checkerFunc || !isFunction(checkerFunc)) {
				throw `Sheet High Type Format Error. checker_func ${utils.yellow_ul(funcName)} not found.`;
			}
			return checkerFunc;
		}
		const enumeration = type_enums[s];
		if (!enumeration || isFunction(enumeration)) {
			throw `Sheet High Type Format Error. checker_func ${utils.yellow_ul(s)} not found.`;
		}
		return (value: any) => { return enumeration[value] != undefined; };
	}

	private _type: string;
	private _checkFunc: CheckFuncType = defaultFunc;
}