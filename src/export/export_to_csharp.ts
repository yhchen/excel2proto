import * as fs from "fs-extra-promise";
import * as path from "path";
import * as utils from "../utils";
import { ETypeNames, CType, EType, CTypeParser } from "../CTypeParser";

const CSTypeTranslateMap = new Map<ETypeNames, { s: string, opt: boolean, }>([
	[ETypeNames.char, { s: 'char', opt: false }],
	[ETypeNames.uchar, { s: 'byte', opt: false }],
	[ETypeNames.short, { s: 'short', opt: false }],
	[ETypeNames.ushort, { s: 'ushort', opt: false }],
	[ETypeNames.int, { s: 'int', opt: false }],
	[ETypeNames.uint, { s: 'uint', opt: false }],
	[ETypeNames.int64, { s: 'long', opt: false }],
	[ETypeNames.uint64, { s: 'ulong', opt: false }],
	[ETypeNames.string, { s: 'string', opt: false }],
	[ETypeNames.double, { s: 'double', opt: false }],
	[ETypeNames.float, { s: 'float', opt: false }],
	[ETypeNames.bool, { s: 'bool', opt: false }],
	[ETypeNames.date, { s: 'string', opt: true }],
	[ETypeNames.tinydate, { s: 'string', opt: true }],
	[ETypeNames.timestamp, { s: 'long', opt: true }],
	[ETypeNames.utctime, { s: 'long', opt: true }],
]);

////////////////////////////////////////////////////////////////////////////////
class CSDExport extends utils.IExportWrapper {
	constructor(exportCfg: utils.ExportCfg) {
		super(exportCfg);
	}

	public get DefaultExtName(): string { return '.cs'; }

	protected async ExportTo(dt: utils.SheetDataTable): Promise<boolean> {
		let outdir = this._exportCfg.OutputDir;
		const LineB = utils.LineBreaker;

		if (this.IsFile(outdir)) {
			return true;
		}

		if (!this.CreateDir(outdir)) {
			utils.exception(`create output path "${utils.yellow_ul(outdir)}" failure!`);
			return false;
		}
		let FMT: string | undefined = this._exportCfg.ExportTemple;
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
			if (dt.customData && CTypeParser.CustomDataNode) {
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
		await fs.writeFileAsync(outfile, interfaceContent, { encoding: 'utf8', flag: 'w' });
		utils.debug(`${utils.green('[SUCCESS]')} Output file "${utils.yellow_ul(outfile)}". `
			+ `Total use tick:${utils.green(utils.TimeUsed.LastElapse())}`);
		return true;
	}

	protected async ExportGlobal(): Promise<boolean> {
		const outdir = this._exportCfg.OutputDir;
		const LineB = utils.LineBreaker;
		if (!this.IsFile(outdir))
			return true;
		if (!this.CreateDir(path.dirname(outdir))) {
			utils.exception(`create output path "${utils.yellow_ul(path.dirname(outdir))}" failure!`);
			return false;
		}
		let FMT: string | undefined = this._exportCfg.ExportTemple;
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
				if (db.customData && CTypeParser.CustomDataNode) {
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
		await fs.writeFileAsync(outdir, interfaceContent, { encoding: 'utf8', flag: 'w' });
		utils.debug(`${utils.green('[SUCCESS]')} Output file "${utils.yellow_ul(outdir)}". `
			+ `Total use tick:${utils.green(utils.TimeUsed.LastElapse())}`);
		return true;
	}

	private GenSheetType(sheetName: string, arrHeader: utils.SheetHeader[]): string | undefined {
		const arrExportHeader = utils.ExecGroupFilter(this._exportCfg.GroupFilter, arrHeader);
		if (arrExportHeader.length <= 0) {
			utils.debug(`Pass Sheet ${utils.yellow_ul(sheetName)} : No Column To Export.`);
			return;
		}

		let data = `{${utils.LineBreaker}`;
		let idx = 0;
		for (let header of arrExportHeader) {
			if (header.comment) continue;
			if (this._exportCfg.IDUseGeterAndSeter && idx == 0) {
				data += `\tpublic ${this.GenTypeName(header.typeChecker.type, false)} ${this.TranslateColName(header.name)} { get; set; }${utils.LineBreaker}`;
			} else {
				data += `\tpublic ${this.GenTypeName(header.typeChecker.type, false)} ${this.TranslateColName(header.name)};${utils.LineBreaker}`;
			}
			++idx;
		}
		data += `}${utils.LineBreaker}`;
		return data;
	}

	private GenTypeName(type: CType | undefined, opt: boolean = false): string {
		const defaultval = `object`;
		if (type == undefined) {
			return defaultval;
		}
		switch (type.type) {
			case EType.base:
			case EType.date:
				if (type.typename) {
					let tdesc = CSTypeTranslateMap.get(type.typename);
					if (tdesc) {
						return `${tdesc.s}`;
					}
				} else {
					return defaultval;
				}
				break;
			case EType.array:
				{
					let tname = `[]`;
					type = type.next;
					for (; type != undefined; type = type.next) {
						if (type.type == EType.array) {
							tname += `[]`;
						} else {
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

module.exports = function (exportCfg: utils.ExportCfg): utils.IExportWrapper { return new CSDExport(exportCfg); };
