import * as utils from "../utils";
import * as fs from "fs-extra-promise";
import * as path from 'path';
import * as json_to_lua from 'json_to_lua';

function ParseJsonObject(header: Array<utils.SheetHeader>, sheetRow: utils.SheetRow, rootNode: any, exportCfg: utils.ExportCfg) {
	if (sheetRow.type != utils.ESheetRowType.data)
		return;
	let item: any = {};
	for (let i = 0; i < header.length && i < sheetRow.values.length; ++i) {
		const hdr = header[i];
		if (!hdr || hdr.comment) continue;
		const val = sheetRow.values[i];
		if (val != null) {
			item[hdr.name] = val;
		} else if (exportCfg.UseDefaultValueIfEmpty) {
			if (hdr.typeChecker.DefaultValue != undefined) {
				item[hdr.name] = hdr.typeChecker.DefaultValue;
			}
		}
		if (i == 0) {
			rootNode["ids"].push(item[header[0].name])
		}
	}
	rootNode[sheetRow.values[0]] = item;
}

type IExportToSingleLuaData = {
	head: string;
	data: string;
}

// export to single lua file
function exportToSingleLuaContent(sheetName: string, header: Array<utils.SheetHeader>, jsObj: any, shortName: boolean = false): IExportToSingleLuaData {
	if (!shortName) {
		return { head: '', data: json_to_lua.jsObjectToLuaPretty(jsObj, 2) };
	}
	const headLst = new Array<string>();
	const NameMapToShort = new Map<string, string>();
	for (let i = 0; i < header.length; ++i) {
		const head = header[i];
		headLst.push(`local ${head.shortName} = "${head.name}"`);
		NameMapToShort.set(head.name, head.shortName);
	}
	const headContent = headLst.join('\n');
	const tableLst = new Array<string>();
	for (let id of jsObj["ids"]) {
		const objLst = new Array<string>();
		const jsObjSingle = jsObj[id];
		for (const hdr of header) {
			if (!jsObjSingle[hdr.name]) continue;
			objLst.push(`\t\t[${hdr.shortName}] = ${json_to_lua.jsObjectToLua(jsObjSingle[hdr.name])},`);
		}
		tableLst.push(`\t${json_to_lua.makeLuaKey(id)} = {\n${objLst.join('\n')}\n\t},`);
	}
	return { head: headContent, data: `{\n${tableLst.join('\n')}\n}` };
}

class LuaExport extends utils.IExportWrapper {
	constructor(exportCfg: utils.ExportCfg) { super(exportCfg); }

	public get DefaultExtName(): string { return '.lua'; }
	protected async ExportTo(dt: utils.SheetDataTable): Promise<boolean> {
		const outdir = this._exportCfg.OutputDir;
		let jsonObj = { ids: [] };
		const arrExportHeader = utils.ExecGroupFilter(this._exportCfg.GroupFilter, dt.arrTypeHeader)
		if (arrExportHeader.length <= 0) {
			utils.debug(`Pass Sheet ${utils.yellow_ul(dt.name)} : No Column To Export.`);
			return true;
		}
		for (let row of dt.arrValues) {
			ParseJsonObject(arrExportHeader, row, jsonObj, this._exportCfg);
		}
		if (this.IsFile(outdir)) {
			this._globalObj[dt.name] = jsonObj;
		} else {
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
			if (FMT.indexOf('{name}') < 0) {
				utils.exception(`[Config Error] ${utils.yellow_ul("Export.ExportTemple")} not found Keyword ${utils.yellow_ul("{name}")}!`);
				return false;
			}
			try {
				const dataCtx = exportToSingleLuaContent(dt.name, arrExportHeader, jsonObj, this._exportCfg.UseShortName);
				const NameRex = new RegExp('{name}', 'g');
				let luacontent = FMT.replace(NameRex, dt.name).replace('{data}', dataCtx.data);
				if (utils.StrNotEmpty(dataCtx.head)) {
					luacontent = `${dataCtx.head}\n${luacontent}`;
				}
				const outfile = path.join(outdir, dt.name + this._exportCfg.ExtName);
				await fs.writeFileAsync(outfile, luacontent, { encoding: 'utf8', flag: 'w+' });
				utils.debug(`${utils.green('[SUCCESS]')} Output file "${utils.yellow_ul(outfile)}". `
					+ `Total use tick:${utils.green(utils.TimeUsed.LastElapse())}`);
			} catch (ex) {
				utils.exception(ex);
			}
		}
		return true;
	}

	protected async ExportGlobal(): Promise<boolean> {
		const outdir = this._exportCfg.OutputDir;
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
		const luacontent = FMT.replace("{data}", json_to_lua.jsObjectToLuaPretty(this._globalObj, 3));
		await fs.writeFileAsync(outdir, luacontent, { encoding: 'utf8', flag: 'w+' });
		utils.debug(`${utils.green('[SUCCESS]')} Output file "${utils.yellow_ul(outdir)}". `
			+ `Total use tick:${utils.green(utils.TimeUsed.LastElapse())}`);
		return true;
	}

	private _globalObj: any = {};
}

module.exports = function (exportCfg: utils.ExportCfg): utils.IExportWrapper { return new LuaExport(exportCfg); };
