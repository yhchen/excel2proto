const Sheet = {};

function initialize(_ExportExcelDataMap) {
	////////////////////////////////////////////////////////////////////////////////
	// ?????????? initialize sheet table here ??????????
	Sheet.Item = _ExportExcelDataMap.get('Item');
	Sheet.Equip = _ExportExcelDataMap.get('Equip');
}

////////////////////////////////////////////////////////////////////////////////
// ?????????? enum type add below ??????????
const enums = {
	EItemType: {
		Item: 1,
		Equip: 2,
	},

	ETriggerType: {
		Task: 1,
		Award: 2,
	},
};

////////////////////////////////////////////////////////////////////////////////
// ?????????? check function add below ??????????
const checker = {
	CheckItem: function (data) {
		if (!data) return true;
		return Sheet.Item('id', data[0]);
	},

	// check item config valid
	CheckAward: function (data) {
		if (!data) return true;
		switch (data[0]) {
			case enums.EItemType.Item:
				return Sheet.Item('id', data[1]);
			case enums.EItemType.Equip:
				return Sheet.Equip('id', data[1]);
		}
		return false;
	},
	CheckGetCellData: function (data) {
		const value = getDataByColName("checkCellValue");
		if (data != value) {
			throw `cell data: ${data} != ${value}`;
			return false;
		}
		return true;
	},
};

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
	_headerNameMap = headerNameMap
}

function setRowData(rowData) {
	_rowData = rowData;
}

exports.enums = enums;
exports.checker = checker;
exports.initialize = initialize;
exports.setHeaderNameMap = setHeaderNameMap;
exports.setRowData = setRowData;