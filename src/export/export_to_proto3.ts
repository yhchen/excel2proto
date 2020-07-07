import * as fs from "fs-extra-promise";
import * as path from "path";
import * as utils from "../utils";
import { ETypeNames, CType, EType } from "../CTypeParser";
import * as protobufjs from 'protobufjs';
import { isArray } from "lodash";

const PBTypeTranslateMap = new Map<ETypeNames, { s: string, opt: boolean }>([
	[ETypeNames.char, { s: 'sint32', opt: false }],
	[ETypeNames.uchar, { s: 'uint32', opt: false }],
	[ETypeNames.short, { s: 'sint32', opt: false }],
	[ETypeNames.ushort, { s: 'uint32', opt: false }],
	[ETypeNames.int, { s: 'sint32', opt: false }],
	[ETypeNames.uint, { s: 'uint32', opt: false }],
	[ETypeNames.int64, { s: 'sint64', opt: false }],
	[ETypeNames.uint64, { s: 'uint64', opt: false }],
	[ETypeNames.string, { s: 'string', opt: false }],
	[ETypeNames.double, { s: 'double', opt: false }],
	[ETypeNames.float, { s: 'float', opt: false }],
	[ETypeNames.bool, { s: 'bool', opt: false }],
	[ETypeNames.date, { s: 'string', opt: true }],
	[ETypeNames.tinydate, { s: 'string', opt: true }],
	[ETypeNames.timestamp, { s: 'int64', opt: true }],
	[ETypeNames.utctime, { s: 'int64', opt: true }],
]);

////////////////////////////////////////////////////////////////////////////////
class PBExport3 extends utils.IExportWrapper {
	constructor(exportCfg: utils.ExportCfg) {
		super(exportCfg);
	}

	public get DefaultExtName(): string { return '.proto'; }

	protected async ExportTo(dt: utils.SheetDataTable): Promise<boolean> {
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
	}

	protected async ExportGlobal(): Promise<boolean> {
		const outdir = this._exportCfg.OutputDir;
		// if (!this.IsFile(outdir)) {
		// 	utils.exception("proto3 format export to separate file was not support!");
		// }
		if (!this._exportCfg.OutputDataDir) {
			utils.exception("proto3 Export.OutputDataDir was not set!")
		}
		if (!this.CreateDir(path.dirname(outdir))) {
			utils.exception(`create output path "${utils.yellow_ul(path.dirname(outdir))}" failure!`);
		}
		if (!this.CreateDir(this._exportCfg.OutputDataDir)) {
			utils.exception(`create output path "${utils.yellow_ul(this._exportCfg.OutputDataDir)}" failure!`);
		}
		let FMT: string | undefined = this._exportCfg.ExportTemple;
		if (FMT == undefined) {
			utils.exception(`[Config Error] ${utils.yellow_ul("Export.ExportTemple")} not defined!`);
		}
		if (FMT.indexOf('{data}') < 0) {
			utils.exception(`[Config Error] ${utils.yellow_ul("Export.ExportTemple")} not found Keyword ${utils.yellow_ul("{data}")}!`);
		}

		let data = '';
		const array = [];
		for (let [k, v] of utils.ExportExcelDataMap) {
			array.push(v);
		}
		array.sort((a, b) => {
			return a.name.localeCompare(b.name);
		});
		let tempMessage: string[] = [];
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
		data = `syntax = "proto3";${utils.LineBreaker}${utils.LineBreaker}${PackageContent}${utils.LineBreaker}` + FMT.replace('{data}', data);
		await fs.writeFileAsync(outdir, data, { encoding: 'utf8', flag: 'w' });
		utils.debug(`${utils.green('[SUCCESS]')} Output file "${utils.yellow_ul(outdir)}". `
			+ `Total use tick:${utils.green(utils.TimeUsed.LastElapse())}`);
		// save to proto files...
		this._protoRoot = protobufjs.loadSync(outdir);
		for (let dt of array) {
			const name = dt.name;
			const outputFile = path.join(this._exportCfg.OutputDataDir, name + this._exportCfg.ExtName);
			await this.ExportData(dt, outputFile);
		}
		return true;
	}

	private GenSheetType(sheetName: string, arrHeader: utils.SheetHeader[], tempMessage: string[]): { pbtype: string } | undefined {
		const arrExportHeader = utils.ExecGroupFilter(this._exportCfg.GroupFilter, arrHeader)
		if (arrExportHeader.length <= 0) {
			utils.debug(`Pass Sheet ${utils.yellow_ul(sheetName)} : No Column To Export.`);
			return;
		}

		let type = `message ${sheetName}${utils.LineBreaker}{${utils.LineBreaker}`;
		for (let header of arrExportHeader) {
			if (header.comment) continue;
			type += `    ${this.GenTypeName(header.typeChecker.type, tempMessage)} ${this.TranslateColName(header.name)} = ${header.cIdx + 1};${utils.LineBreaker}`;
		}
		type += `}${utils.LineBreaker}`;
		type += `message Arr${sheetName}${utils.LineBreaker}{${utils.LineBreaker}repeated ${sheetName} Rows = 1;${utils.LineBreaker}}${utils.LineBreaker}`
		return { pbtype: type, };
	}

	private GenTypeName(type: CType | undefined, tempMessage: string[]): string {
		const defaultval = `string`;
		if (type == undefined) {
			return defaultval;
		}
		switch (type.type) {
			case EType.base:
			case EType.date:
				if (type.typename) {
					let tdesc = PBTypeTranslateMap.get(type.typename);
					if (tdesc) {
						return tdesc.s;
					}
				} else {
					return defaultval;
				}
				break;
			case EType.array:
				{
					let typeName = '';
					let tname = '';
					type = type.next;
					let dimensionTotal = 1;
					for (; type != undefined; type = type.next) {
						if (type.type == EType.array) {
							++dimensionTotal;
						} else {
							typeName = this.GenTypeName(type, tempMessage);
						}
					}
					if (dimensionTotal <= 1) {
						tname = `repeated ${typeName}`;
					} else {
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

	private _protoRoot: protobufjs.Root | undefined;

	private TranslateValue(value: any): any {
		if (isArray(value)) {
			if (value.length <= 0 || !isArray(value[0])) {
				return { a: value };
			}
			const ret: { a: any[] } = { a: [] };
			for (const subvalue of value) {
				ret.a.push(this.TranslateValue(subvalue));
			}
			return ret;
		}
		return value;
	}

	private async ExportData(dt: utils.SheetDataTable, outputFile: string) {
		if (this._protoRoot == null) return;
		const protoEncoder = this._protoRoot.lookupType(`${this._exportCfg.Namespace ? this._exportCfg.Namespace + '.' : ''}Arr${dt.name}`);
		const arrExportHeader = utils.ExecGroupFilter(this._exportCfg.GroupFilter, dt.arrTypeHeader)
		if (arrExportHeader.length <= 0) {
			return;
		}

		const exportData: { Rows: any[] } = { Rows: [] };
		for (let row = 0; row < dt.arrValues.length; ++row) {
			if (dt.arrValues[row].type != utils.ESheetRowType.data) continue;
			const data = dt.arrValues[row].values;
			const newData: any = {};
			for (const hdr of arrExportHeader) {
				if (hdr.comment) continue;
				newData[this.TranslateColName(hdr.name)] = this.TranslateValue(data[hdr.cIdx]);
				exportData.Rows.push(newData);
			}
		};

		const exportProto = protoEncoder.encode(exportData).finish();
		await fs.writeFileAsync(outputFile, exportProto);
	}
}

module.exports = function (exportCfg: utils.ExportCfg): utils.IExportWrapper { return new PBExport3(exportCfg); };
