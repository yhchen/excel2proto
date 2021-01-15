////////////////////////////////////////////////////////////////////////////////
// internal type 
const char = 'char';
const uchar = 'uchar';
const short = 'short';
const ushort = 'ushort';
const int = 'int';
const uint = 'uint';
const int64 = 'int64';
const uint64 = 'uint64';
const string = 'string';
const double = 'double';
const float = 'float';
const bool = 'bool';
const vector2 = 'vector2';
const vector3 = 'vector3';
const date = 'date';
const tinydate = 'tinydate';
const timestamp = 'timestamp';
const utctime = 'utctime';


const Sheet = {}; // sheet table id checker
const enums = {}; // define enum
const checker = {}; // define check function
const defines = {}; // reserved...

function initialize(_ExportExcelDataMap) {
	////////////////////////////////////////////////////////////////////////////////
	// ?????????? initialize sheet table here ??????????
	Sheet.Item = _ExportExcelDataMap.get('Item');
	Sheet.Equip = _ExportExcelDataMap.get('Equip');

	////////////////////////////////////////////////////////////////////////////////
	// ?????????? enum type add below ??????????
	enums.EItemType = {
		Item: 1,
		Equip: 2,
	};
	enums.ETriggerType = {
		Task: 1,
		Award: 2,
	};

	////////////////////////////////////////////////////////////////////////////////
	// ?????????? check function add below ??????????
	checker.CheckItem = function (data) {
		if (!data) return true;
		return Sheet.Item.id(data[0]);
	};

	// check item config valid
	checker.CheckAward = function (data) {
		if (!data) return true;
		switch (data[0]) {
			case enums.EItemType.Item:
				return Sheet.Item.id(data[1]);
			case enums.EItemType.Equip:
				return Sheet.Equip.id(data[1]);
		}
		return false;
	};
	checker.CheckGetCellData = function (data) {
		const value = getDataByColName("checkCellValue");
		if (data != value) {
			throw `cell data: ${data} != ${value}`;
		}
		return true;
	};


	// >>>>>>>>>>>>>>>>>>>> reserved <<<<<<<<<<<<<<<<<<<<
	// type define
	// defines.ItemId = Sheet.Item.id;
	// defines.Item = {
	// 	Type: {
	// 		Id: int,
	// 		Count: int64,
	// 	},
	// 	Checker: checker.CheckItem,
	// };
	// defines.Equip = {
	// 	Type: {
	// 		Id: int,
	// 		ItemId: defines.ItemId
	// 	}
	// };
	// >>>>>>>>>>>>>>>>>>>> reserved <<<<<<<<<<<<<<<<<<<<
}

// @return: rowData['name']
function getDataByColName(name) {
	let idx = _headerNameMap.get(name);
	if (idx === undefined) {
		throw `type extens checker failure. column name ${name} not found!`;
	}
	return _rowData[idx];
}

let _headerNameMap;
let _rowData;

function setHeaderNameMap(headerNameMap) {
	_headerNameMap = headerNameMap;
}

function setRowData(rowData) {
	_rowData = rowData;
}

exports.enums = enums;
exports.checker = checker;
exports.defines = defines;
exports.initialize = initialize;
exports.setHeaderNameMap = setHeaderNameMap;
exports.setRowData = setRowData;