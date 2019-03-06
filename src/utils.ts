export { isString, isNumber, isArray, isObject, isBoolean } from 'lodash';
export { isDate } from 'moment';
import { isString } from 'util';
import * as fs from 'fs-extra';

////////////////////////////////////////////////////////////////////////////////
/*************** console color ***************/
import * as chalk from 'chalk';
import { CTypeChecker } from './CTypeParser';
export const yellow_ul = chalk.default.yellow.underline;	//yellow under line
export const yellow = chalk.default.yellow;
export const red = chalk.default.redBright;
export const green = chalk.default.greenBright;
export const brightWhite = chalk.default.whiteBright.bold

////////////////////////////////////////////////////////////////////////////////
/************ logger function **************/
export let EnableDebugOutput: boolean = true;
export function SetEnableDebugOutput(b: boolean) { EnableDebugOutput = b; }
export function logger(debugMode: boolean, ...args: any[]) {
	if (!EnableDebugOutput && debugMode) {
		return;
	}
	console.log(...args);
}
function trace(...args: any[]) { logger(true, ...args); }
let ExceptionLog = '';
export function exception(txt: string, ex?:any): never {
	ExceptionLog += `${red(`+ [ERROR] `)} ${txt}\n`
	logger(false, red(`[ERROR] `) + txt);
	if (ex) { logger(false, red(ex)); }
	throw txt;
}

////////////////////////////////////////////////////////////////////////////////
/************* base function ***************/
export function NullStr(s: string) {
	if (isString(s)) {
		return s.trim().length <= 0;
	}
	return true;
}


////////////////////////////////////////////////////////////////////////////////
/************* total use tick ****************/
// timer calc
let BeforeExistHandler: ()=>void;
export function SetBeforeExistHandler(handler: ()=>void) {
	BeforeExistHandler = handler;
}
export module TimeUsed
{
	export function LastElapse(): string {
		const Now = Date.now();
		const elpase = Now - _LastAccess;
		_LastAccess = Now;
		return elpase.toString() + 'ms';
	}

	export function TotalElapse(): string {
		return ((Date.now() - _StartTime) / 1000).toString() + 's';
	}

	const _StartTime = Date.now();
	let _LastAccess = _StartTime;

	process.addListener('beforeExit', ()=>{
		if (BeforeExistHandler) {
			BeforeExistHandler();
		}
		process.removeAllListeners('beforeExit');
		const color = NullStr(ExceptionLog) ? green : yellow;
		logger(false, color("----------------------------------------"));
		logger(false, color("-            DONE WITH ALL             -"));
		logger(false, color("----------------------------------------"));
		logger(false, `Total Use Tick : "${yellow_ul(TotalElapse())}"`);

		if (!NullStr(ExceptionLog)) {
			logger(false, red("Exception Logs:"));
			logger(false, ExceptionLog);
			process.exit(-1);
		} else {
			process.exit(0);
		}
	});
}

////////////////////////////////////////////////////////////////////////////////
// Datas ...
// excel gen data table
export enum ESheetRowType {
	header = 1,
	type = 2,
	data = 3,
	comment = 4,
}
export type SheetRow = {
	type: ESheetRowType,
	values: Array<any>,
}
export type SheetHeader = {
	name: string, // name
	stype: string, // type string
	typeChecker: CTypeChecker, // type checker
	comment: boolean; // is comment line?
}
export class SheetDataTable {
	constructor(name: string) {
		this.name = name;
		this.headerLst = new Array();
		this.values = new Array();
	}
	public name: string;
	public headerLst: Array<SheetHeader>;
	public values: Array<SheetRow>;
}
// all export data here
export const ExportExcelDataMap = new Map<string, SheetDataTable>();

// line breaker
export let LineBreaker = '\n';
export function SetLineBreaker(v: string) {
	LineBreaker = v;
}

////////////////////////////////////////////////////////////////////////////////
// export config
export type GlobalCfg = {
}

export type ExportCfg = {
	type: string;
	OutputDir: string;
	UseDefaultValueIfEmpty: boolean;
	ExportTemple?: string;
	ExtName?: string;
}
// export template
export abstract class IExportWrapper {
	public constructor(exportCfg: ExportCfg) {
		this._exportCfg = exportCfg;
	}
	public abstract get DefaultExtName(): string;
	public abstract async ExportTo(dt: SheetDataTable, cfg: GlobalCfg): Promise<boolean>;
	public abstract ExportEnd(cfg: GlobalCfg): void;
	protected CreateDir(outdir: string): boolean {
		if (!fs.existsSync(outdir)) {
			fs.ensureDirSync(outdir);
			return fs.existsSync(outdir);
		}
		return true;
	}

	protected IsFile(s: string): boolean {
		const ext = this._exportCfg.ExtName||this.DefaultExtName;
		const idx = s.lastIndexOf(ext);
		if (idx < 0) return false;
		return (idx + ext.length == s.length);
	}

	protected _exportCfg: ExportCfg;
}

export type ExportWrapperFactory = (cfg: ExportCfg)=>IExportWrapper;
export const ExportWrapperMap = new Map<string, ExportWrapperFactory>([
	['csv', require('./export/export_to_csv')],
	['json', require('./export/export_to_json')],
	['js', require('./export/export_to_js')],
	['tsd', require('./export/export_to_tsd')],
	['lua', require('./export/export_to_lua')],
]);


////////////////////////////////////////////////////////////////////////////////
export module FMT26 {
	export function NumToS26(num: number): string{
		let result="";
		++num;
		while (num > 0){
			let m = num % 26;
			if (m == 0) m = 26;
			result = String.fromCharCode(m + 64) + result;
			num = (num - m) / 26;
		}
		return result;
	}

	export function S26ToNum(str: string): number {
		let result = 0;
		let ss = str.toUpperCase();
		for (let i = str.length - 1, j = 1; i >= 0; i--, j *= 26) {
			let c = ss[i];
			if (c < 'A' || c > 'Z') return 0;
			result += (c.charCodeAt(0) - 64) * j;
		}
		return --result;
	}
}
