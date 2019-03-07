import * as xlsx from 'xlsx';
import * as fs from 'fs-extra-promise';
import * as path from 'path';

import * as utils from './utils'
import ConfTpl from "./config_tpl.json";
let gCfg: typeof ConfTpl = ConfTpl; // default config
if (process.argv.length >= 3 && fs.existsSync(process.argv[2])) {
	gCfg = JSON.parse(<string>fs.readFileSync(process.argv[2], { encoding: 'utf8' }));
	function check(cfg: any, tpl: any):void{
		for (let key in tpl) {
			if (tpl[key] != null && typeof cfg[key] !== typeof tpl[key]) {
				throw utils.red(`configure format error. key "${utils.yellow(key)}" not found!`);
			}
			if (utils.isObject(typeof tpl[key])) {
				check(cfg[key], tpl[key]);
			}
		}
	};
	check(gCfg, ConfTpl);
}
import {CTypeChecker as CTypeParser,ETypeNames} from './CTypeParser';

utils.SetEnableDebugOutput(gCfg.EnableDebugOutput);
utils.SetLineBreaker(gCfg.LineBreak);

const gExportWrapperLst = new Array<utils.IExportWrapper>();
for (const exportCfg of gCfg.Export) {
	const Constructor = utils.ExportWrapperMap.get(exportCfg.type);
	if (Constructor == undefined) {
		utils.exception(utils.red(`Export is not currently supported for the current type "${utils.yellow_ul(exportCfg.type)}"!`));
		throw `ERROR : Export constructor not found. initialize failure!`;
	}
	const Exportor = Constructor.call(Constructor, exportCfg);
	if (Exportor) {
		if ((<any>exportCfg).ExtName == undefined) {
			(<any>exportCfg).ExtName = Exportor.DefaultExtName;
		}
		gExportWrapperLst.push(Exportor);
	}
}

const gRootDir = process.cwd();
CTypeParser.DateFmt = gCfg.DateFmt;
CTypeParser.TinyDateFmt = gCfg.TinyDateFmt;
CTypeParser.FractionDigitsFMT = gCfg.FractionDigitsFMT;

async function HandleDir(dirName: string): Promise<void> {
	let pa = await fs.readdirAsync(dirName);
	pa.forEach(async function(fileName, index){
		const filePath = path.join(dirName, fileName);
		let info = await fs.statAsync(filePath);
		if(!info.isFile()) {
			return;
		}
		await HandleExcelFile(filePath);
	});
}

function GetCellData(worksheet: xlsx.WorkSheet, c: number, r: number): xlsx.CellObject|undefined {
	const cell = xlsx.utils.encode_cell({c, r});
	return worksheet[cell];
}

function HandleWorkSheet(fileName: string, sheetName: string, worksheet: xlsx.WorkSheet): utils.SheetDataTable|undefined {
	if (utils.NullStr(sheetName) || sheetName[0] == "!" || gCfg.ExcludeSheetNames.indexOf(sheetName) >= 0) {
		utils.logger(true, `- Pass Sheet "${sheetName}"`);
		return;
	}

	const Range = xlsx.utils.decode_range(<string>worksheet['!ref']);
	const ColumnMax = Range.e.c;
	const RowMax = Range.e.r;
	const ColumnArry = new Array<{cIdx:number, name:string, parser:CTypeParser}>();
	// find max column and rows
	let rIdx = 0;
	const DataTable = new utils.SheetDataTable(sheetName);
	// find column name
	for (; rIdx <= RowMax; ++rIdx) {
		const firstCell = GetCellData(worksheet, 0, rIdx);
		if (firstCell == undefined || firstCell.w == undefined || utils.NullStr(firstCell.w)) {
			continue;
		}
		if (firstCell.w[0] == '#') {
			continue;
		}
		const tmpArry = [];
		for (let cIdx = 0; cIdx <= ColumnMax; ++cIdx) {
			const cell = GetCellData(worksheet, cIdx, rIdx);
			if (cell == undefined || cell.w == undefined || utils.NullStr(cell.w) || cell.w[0] == '#') {
				continue;
			}
			ColumnArry.push({cIdx, name:cell.w, parser:new CTypeParser(ETypeNames.string)});
			tmpArry.push(cell.w);
		}
		DataTable.values.push({type:utils.ESheetRowType.header, values: tmpArry});
		++rIdx;
		break;
	}
	// find type
	for (; rIdx <= RowMax; ++rIdx) {
		const firstCell = GetCellData(worksheet, ColumnArry[0].cIdx, rIdx);
		if (firstCell == undefined || firstCell.w == undefined || utils.NullStr(firstCell.w)) {
			continue;
		}
		if (firstCell.w[0] == '#') {
			continue;
		}

		if (firstCell.w[0] != '*') {
			utils.exception(`excel file "${utils.yellow_ul(fileName)}" sheet "${utils.yellow_ul(sheetName)}" Sheet Type Column not found!`);
		}
		firstCell.w = firstCell.w.substr(1); // skip '*'
		const tmpArry = [];
		let typeHeader = new Array<utils.SheetHeader>();
		for (const col of ColumnArry) {
			const cell = GetCellData(worksheet, col.cIdx, rIdx);
			if (cell == undefined || cell.w == undefined) {
				utils.exception(`excel file "${utils.yellow_ul(fileName)}" sheet "${utils.yellow_ul(sheetName)}" Sheet Type Column "${utils.yellow_ul(col.name)}" not found!`);
				return;
			}
			try {
				col.parser = new CTypeParser(cell.w);
				tmpArry.push(cell.w);
				typeHeader.push({name:col.name, typeChecker:col.parser, stype:cell.w, comment:false});
			} catch (ex) {
				// new CTypeChecker(cell.w); // for debug used
				utils.exception(`excel file "${utils.yellow_ul(fileName)}" sheet "${utils.yellow_ul(sheetName)}" Sheet Type Column`
						+ ` "${utils.yellow_ul(col.name)}" format error "${utils.yellow_ul(cell.w)}"!`, ex);
			}
		}
		DataTable.headerLst = typeHeader;
		DataTable.values.push({type:utils.ESheetRowType.type, values: tmpArry});
		++rIdx;
		break;
	}

	// handle datas
	for (; rIdx <= RowMax; ++rIdx) {
		let firstCol = true;
		const tmpArry = [];
		for (let col of ColumnArry) {
			const cell = GetCellData(worksheet, col.cIdx, rIdx);
			if (firstCol) {
				if (cell == undefined || cell.w == undefined || utils.NullStr(cell.w)) {
					break;
				}
				else if (cell.w[0] == '#') {
					break;
				}
				firstCol = false;
			}
			const value = cell && cell.w ? cell.w : '';
			let colObj;
			try {
				colObj = col.parser.ParseContent(cell);
				tmpArry.push(colObj);
			} catch (ex) {
				// col.checker.ParseDataStr(cell);
				utils.exception(`excel file "${utils.yellow_ul(fileName)}" sheet "${utils.yellow_ul(sheetName)}" `
							  + `Cell "${utils.yellow_ul(utils.FMT26.NumToS26(col.cIdx)+(rIdx).toString())}" `
							  + `Parse Data "${utils.yellow_ul(value)}" With ${utils.yellow_ul(col.parser.s)} `
							  + `Cause utils.exception "${utils.red(ex)}"!`);
				return;
			}
			if (gCfg.EnableTypeCheck) {
				if (!col.parser.CheckContentVaild(colObj)) {
					col.parser.CheckContentVaild(colObj); // for debug used
					utils.exception(`excel file "${utils.yellow_ul(fileName)}" sheet "${utils.yellow_ul(sheetName)}" `
								  + `Cell "${utils.yellow_ul(utils.FMT26.NumToS26(col.cIdx)+(rIdx).toString())}" `
								  + `format not match "${utils.yellow_ul(value)}" with ${utils.yellow_ul(col.parser.s)}!`);
					return;
				}
			}
		}
		if (!firstCol) {
			DataTable.values.push({type:utils.ESheetRowType.data, values: tmpArry});
		}
	}
	return DataTable;
}

async function HandleExcelFile(fileName: string) {
	const extname = path.extname(fileName);
	if (extname != '.xls' && extname != '.xlsx') {
		return;
	}
	if (gCfg.ExcludeFileNames.indexOf(path.basename(fileName)) >= 0) {
		utils.logger(true, `- Pass File "${fileName}"`);
		return;
	}
	if (path.basename(fileName).indexOf(`~$`) == 0) {
		utils.logger(true, `- Pass File "${fileName}"`);
		return;
	}
	let opt:xlsx.ParsingOptions = {
		type: "buffer",
		// codepage: 0,//If specified, use code page when appropriate **
		cellFormula: false,//Save formulae to the .f field
		cellHTML: false,//Parse rich text and save HTML to the .h field
		cellText: true,//Generated formatted text to the .w field
		cellDates: true,//Store dates as type d (default is n)
		cellStyles: true,//Store style/theme info to the .s field
		/**
		* If specified, use the string for date code 14 **
		 * https://github.com/SheetJS/js-xlsx#parsing-options
		 *		Format 14 (m/d/yy) is localized by Excel: even though the file specifies that number format,
		 *		it will be drawn differently based on system settings. It makes sense when the producer and
		 *		consumer of files are in the same locale, but that is not always the case over the Internet.
		 *		To get around this ambiguity, parse functions accept the dateNF option to override the interpretation of that specific format string.
		 */
		dateNF: 'yyyy/mm/dd',
		WTF: true,//If true, throw errors on unexpected file features **
	};
	const filebuffer = await fs.readFileAsync(fileName);
	const excel = xlsx.read(filebuffer, opt);
	if (excel == null) {
		utils.exception(`excel ${utils.yellow_ul(fileName)} open failure.`);
	}
	if (excel.Sheets == null) {
		return;
	}
	for (let sheetName of excel.SheetNames) {
		utils.logger(true, `- Handle excel "${utils.brightWhite(fileName)}" sheet "${utils.yellow_ul(sheetName)}"`);
		const worksheet = excel.Sheets[sheetName];
		const datatable = HandleWorkSheet(fileName, sheetName, worksheet);
		if (datatable) {
			utils.ExportExcelDataMap.set(datatable.name, datatable);
			for (const handler of gExportWrapperLst) {
				await handler.ExportTo(datatable, gCfg);
			}
		}
	}
}

async function execute() {
	for (let fileOrPath of gCfg.IncludeFilesAndPath) {
		if (!path.isAbsolute(fileOrPath)) {
			fileOrPath = path.join(gRootDir, fileOrPath);
		}
		if (!fs.existsSync(fileOrPath)) {
			utils.logger(false, `file or directory "${utils.yellow_ul(fileOrPath)}" not found!`);
			continue;
		}
		if (fs.statSync(fileOrPath).isDirectory()) {
			await HandleDir(fileOrPath);
		} else if (fs.statSync(fileOrPath).isFile()) {
			await HandleExcelFile(fileOrPath);
		} else {
			utils.exception(`UnHandle file or directory type : "${utils.yellow_ul(fileOrPath)}"`);
		}
	}
}

////////////////////////////////////////////////////////////////////////////////
async function main() {
	try {
		utils.SetBeforeExistHandler(()=>{
			for (let handler of gExportWrapperLst) {
				handler.ExportEnd(gCfg);
			}
		});
		await execute()
		console.log('--------------------------------------------------------------------');
	} catch (ex) {
		utils.exception(ex);
	}
}

// main entry
main();
