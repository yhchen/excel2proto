import * as path from 'path';
import * as fs from "fs-extra-promise";
import * as utils from "../utils";

class JSONExport extends utils.IExportWrapper {
	constructor(exportCfg: utils.ExportCfg) { super(exportCfg); }

	public get DefaultExtName(): string { return '.json'; }
	protected async ExportTo(dt: utils.SheetDataTable): Promise<boolean> {
		const outdir = this._exportCfg.OutputDir;
		let jsonObj = {};
		const arrExportHeader = utils.ExecGroupFilter(this._exportCfg.GroupFilter, dt.arrTypeHeader);
		if (arrExportHeader.length <= 0) {
			utils.debug(`Pass Sheet ${utils.yellow_ul(dt.name)} : No Column To Export.`);
			return true;
		}
		for (let row of dt.arrValues) {
			this.ParseJsonLine(arrExportHeader, row, jsonObj, this._exportCfg);
		}
		if (this.IsFile(outdir)) {
			this._globalObj[dt.name] = jsonObj;
		} else {
			if (!this.CreateDir(outdir)) {
				utils.exception(`create output path "${utils.yellow_ul(outdir)}" failure!`);
				return false;
			}
			const jsoncontent = JSON.stringify(jsonObj || "{}");
			const outfile = path.join(outdir, dt.name + this._exportCfg.ExtName);
			await fs.writeFileAsync(outfile, jsoncontent, { encoding: 'utf8', flag: 'w+' });
			utils.debug(`${utils.green('[SUCCESS]')} Output file "${utils.yellow_ul(outfile)}". `
				+ `Total use tick:${utils.green(utils.TimeUsed.LastElapse())}`);
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
		const jsoncontent = JSON.stringify(this._globalObj || "{}");
		await fs.writeFileAsync(outdir, jsoncontent, { encoding: 'utf8', flag: 'w+' });
		utils.debug(`${utils.green('[SUCCESS]')} Output file "${utils.yellow_ul(outdir)}". `
			+ `Total use tick:${utils.green(utils.TimeUsed.LastElapse())}`);
		return true;
	}

	private ParseJsonLine(header: Array<utils.SheetHeader>, sheetRow: utils.SheetRow, rootNode: any, exportCfg: utils.ExportCfg) {
		if (sheetRow.type != utils.ESheetRowType.data)
			return;
		if (header.length <= 0) return;
		let item: any = {};
		for (let i = 0, cIdx = header[0].cIdx; i < header.length && cIdx < sheetRow.values.length; ++i, cIdx = header[i]?.cIdx) {
			const head = header[i];
			if (!head || head.comment) continue;
			const name = this.TranslateColName(head.name);
			if (sheetRow.values[cIdx] != null) {
				item[name] = sheetRow.values[cIdx];
			} else if (exportCfg.UseDefaultValueIfEmpty) {
				if (head.typeChecker.DefaultValue != undefined) {
					item[name] = head.typeChecker.DefaultValue;
				}
			}
		}
		rootNode[sheetRow.values[0]] = item;
		if (rootNode._ids == undefined) {
			rootNode._ids = [];
		}
		rootNode._ids.push(sheetRow.values[0]);
	}


	private _globalObj: any = {};
}

module.exports = function (exportCfg: utils.ExportCfg): utils.IExportWrapper { return new JSONExport(exportCfg); };
