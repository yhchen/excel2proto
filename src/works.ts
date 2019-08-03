import * as path from 'path';
import * as fs from 'fs-extra-promise';
import * as utils from './utils';

////////////////////////////////////////////////////////////////////////////////
//#region Export Wrapper

import { gCfg, gRootDir, gGlobalIgnoreDirName } from './config'
import { HandleExcelFile } from './excel_utils'
import { CHightTypeChecker } from './CHighTypeChecker';
const gExportWrapperLst = new Array<utils.IExportWrapper>();
for (const exportCfg of gCfg.Export) {
	const Constructor = utils.ExportWrapperMap.get(exportCfg.type);
	if (Constructor == undefined) {
		utils.exception(utils.red(`Export is not currently supported for the current type "${utils.yellow_ul(exportCfg.type)}"!\n` +
			`ERROR : Export constructor not found. initialize failure!`));
		break;
	}
	const Exportor = Constructor.call(Constructor, exportCfg);
	if (Exportor) {
		if ((<any>exportCfg).ExtName == undefined) {
			(<any>exportCfg).ExtName = Exportor.DefaultExtName;
		}
		gExportWrapperLst.push(Exportor);
	}
}

//#endregion


export async function execute(): Promise<boolean> {
	if (!await HandleReadData()) {
		throw `handle read excel data failure.`;
	}
	if (!HandleHighLevelTypeCheck()) {
		throw `handle check hight level type failure.`;
	}
	if (!await HandleExportAll()) {
		throw `handle export failure.`;
	}
	return true;
}

////////////////////////////////////////////////////////////////////////////////
//#region private side
const WorkerMonitor = new utils.AsyncWorkMonitor();
async function HandleDir(dirName: string): Promise<boolean> {
	if (gGlobalIgnoreDirName.has(path.basename(dirName))) {
		utils.logger(`ignore folder ${dirName}`);
	}
	const pa = await fs.readdirAsync(dirName);
	WorkerMonitor.addWork(pa.length);
	pa.forEach(async function (fileName) {
		const filePath = path.join(dirName, fileName);
		let info = await fs.statAsync(filePath);
		if (!info.isFile()) {
			WorkerMonitor.decWork();
			return false;
		}
		if (!await HandleExcelFile(filePath)) {
			WorkerMonitor.decWork();
			return false;
		}
		WorkerMonitor.decWork();
	});
	return true;
}

async function HandleReadData(): Promise<boolean> {
	for (let fileOrPath of gCfg.IncludeFilesAndPath) {
		if (!path.isAbsolute(fileOrPath)) {
			fileOrPath = path.join(gRootDir, fileOrPath);
		}
		if (!fs.existsSync(fileOrPath)) {
			utils.exception(`file or directory "${utils.yellow_ul(fileOrPath)}" not found!`);
			break;
		}
		if (fs.statSync(fileOrPath).isDirectory()) {
			HandleDir(fileOrPath);
		} else if (fs.statSync(fileOrPath).isFile()) {
			if (!await HandleExcelFile(fileOrPath)) {
				return false;
			}
		} else {
			utils.exception(`UnHandle file or directory type : "${utils.yellow_ul(fileOrPath)}"`);
		}
	}
	await WorkerMonitor.delay(1000);
	await WorkerMonitor.WaitAllWorkDone();
	utils.logger(`${utils.green('[SUCCESS]')} READ ALL SHEET DONE. Total Use Tick : ${utils.green(utils.TimeUsed.LastElapse())}`);
	return true;
}

function HandleHighLevelTypeCheck(): boolean {
	if (!gCfg.EnableTypeCheck) {
		return true;
	}
	let foundError = false;
	for (const kv of utils.ExportExcelDataMap) {
		const database = kv[1];
		for (let colIdx = 0; colIdx < database.arrTypeHeader.length; ++colIdx) {
			let header = database.arrTypeHeader[colIdx];
			if (!header.highCheck) continue;
			try {
				header.highCheck.init();
			} catch (ex) {
				utils.exception(`Excel "${utils.yellow_ul(database.filename)}" Sheet "${utils.yellow_ul(database.name)}" High Type`
					+ ` "${utils.yellow_ul(header.name)}" format error "${utils.yellow_ul(header.highCheck.s)}"!`);
			}
			for (let rowIdx = 0; rowIdx < database.arrValues.length; ++rowIdx) {
				const row = database.arrValues[rowIdx];
				if (row.type != utils.ESheetRowType.data) continue;
				const data = row.values[colIdx];

				if (!data) continue;
				try {
					if (!header.highCheck.checkType(data)) {
						throw '';
					}
				} catch (ex) {
					foundError = true;
					// header.highCheck.checkType(data); // for debug
					utils.exceptionRecord(`Excel "${utils.yellow_ul(database.filename)}" `
						+ `Sheet Row "${utils.yellow_ul(database.name + '.' + utils.yellow_ul(header.name))}" High Type format error`
						+ `Cell "${utils.yellow_ul(utils.FMT26.NumToS26(header.cIdx) + (row.cIdx + 1).toString())}" `
						+ ` "${utils.yellow_ul(data)}"!`, ex);
				}
			}
		}
	}
	utils.logger(`${foundError ? utils.red('[FAILURE]') : utils.green('[SUCCESS]')} `
		+ `CHECK ALL HIGH TYPE DONE. Total Use Tick : ${utils.green(utils.TimeUsed.LastElapse())}`);
	return !foundError;
}

async function HandleExportAll(): Promise<boolean> {
	const monitor = new utils.AsyncWorkMonitor();
	let allOK = true;
	for (const kv of utils.ExportExcelDataMap) {
		for (const handler of gExportWrapperLst) {
			monitor.addWork();
			handler.ExportToAsync(kv[1], gCfg, (ok) => {
				allOK = allOK && ok;
				monitor.decWork();
			});
		}
	}
	for (const handler of gExportWrapperLst) {
		monitor.addWork();
		handler.ExportToGlobalAsync(gCfg, (ok) => {
			allOK = allOK && ok;
			monitor.decWork();
		});
	}
	await monitor.WaitAllWorkDone();
	return allOK;
}

//#endregion
