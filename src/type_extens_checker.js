const ExportExcelDataMap = require('./utils').ExportExcelDataMap

const Item = ExportExcelDataMap.get('Item');
const Equip = ExportExcelDataMap.get('Equip');

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
	CheckItem: function (data, rowData, headerNameMap) {
		if (!data) return true;
		return Item.checkColumnContainsValue('id', data[0]);
	},

	// check item config valid
	CheckAward: function (data, rowData, headerNameMap) {
		if (!data) return true;
		switch (data[0]) {
			case enums.EItemType.Item:
				return Item.checkColumnContainsValue('id', data[1]);
			case enums.EItemType.Equip:
				return Equip.checkColumnContainsValue('id', data[1]);
		}
		return false;
	},
	CheckGetCellData: function (data, rowData, headerNameMap) {
		const value = getDataByColName(rowData, headerNameMap, "checkCellValue");
		if (data != value) {
			throw `cell data: ${data} != ${value}`;
			return false;
		}
		return true;
	},
};

// @return: rowData['name']
function getDataByColName(rowData, headerNameMap, name) {
	let idx = headerNameMap.get(name);
	if (idx === undefined) {
		throw `type extens checker failure. column name ${name} not found!`;
	}
	return rowData[idx];
}

exports.enums = enums;
exports.checker = checker;