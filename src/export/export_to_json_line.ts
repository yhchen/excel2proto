import * as path from 'path';
import * as fs from "fs-extra-promise";
import * as utils from "../utils";

class JSONExport extends utils.IExportWrapper {
	constructor(exportCfg: utils.ExportCfg) { super(exportCfg); }

	public get DefaultExtName(): string { return '.txt'; }
	protected async ExportTo(dt: utils.SheetDataTable): Promise<boolean> {
		const outdir = this._exportCfg.OutputDir;
		let tabIds:number[] = [];
		const arrExportHeader = utils.ExecGroupFilter(this._exportCfg.GroupFilter, dt.arrTypeHeader)
		if (arrExportHeader.length <= 0) {
			utils.debug(`Pass Sheet ${utils.yellow_ul(dt.name)} : No Column To Export.`);
			return true;
		}
		let conentText = ""
		for (let row of dt.arrValues) {
			let item = this.ParseJsonLine(arrExportHeader, row, tabIds, this._exportCfg);
			if (item) {
				conentText += JSON.stringify(item || "{}") + '\n';
			} 
		}
		let IdsContent = JSON.stringify(tabIds || "{}") + '\n';
		conentText += "\"Ids\":" + IdsContent;
		if (this.IsFile(outdir)) {
			
		} else {
			if (!this.CreateDir(outdir)) {
				utils.exception(`create output path "${utils.yellow_ul(outdir)}" failure!`);
				return false;
			}
			const outfile = path.join(outdir, dt.name + this._exportCfg.ExtName);
			await fs.writeFileAsync(outfile, conentText, { encoding: 'utf8', flag: 'w+' });
			utils.debug(`${utils.green('[SUCCESS]')} Output file "${utils.yellow_ul(outfile)}". `
				+ `Total use tick:${utils.green(utils.TimeUsed.LastElapse())}`);
		}
		return true;
	}

	protected async ExportGlobal(): Promise<boolean> {
		const outdir = this._exportCfg.OutputDir;
		if (!this.IsFile(outdir))
			return true;
		utils.exception(`json line can not Export to Global files  "${utils.yellow_ul(outdir)}" `);
	}

	private ParseJsonLine(header: Array<utils.SheetHeader>, sheetRow: utils.SheetRow, tabIds: number[], exportCfg: utils.ExportCfg) {
		if (sheetRow.type != utils.ESheetRowType.data)
			return;
		let item: any = {};
		for (let i = 0; i < header.length && i < sheetRow.values.length; ++i) {
			if (!header[i] || header[i].comment) continue;
			if (sheetRow.values[i] != null) {
				item[this.TranslateColName(header[i].name)] = sheetRow.values[i];
			} else if (exportCfg.UseDefaultValueIfEmpty) {
				if (header[i].typeChecker.DefaultValue != undefined) {
					item[this.TranslateColName(header[i].name)] = header[i].typeChecker.DefaultValue;
				}
			}
		}
		tabIds.push(sheetRow.values[0]);
		return item;
	}
	

	private _globalObj: any = {};
}

module.exports = function (exportCfg: utils.ExportCfg): utils.IExportWrapper { return new JSONExport(exportCfg); };
