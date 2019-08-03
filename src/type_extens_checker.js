const ExportExcelDataMap = require('./utils').ExportExcelDataMap

Item = ExportExcelDataMap.get('Item');
Equip = ExportExcelDataMap.get('Equip');

////////////////////////////////////////////////////////////////////////////////
// 👇👇👇enum type add below👇👇👇
enums = {
	EItemType: {
		Item: 1,
		Equip: 2,
	},

	ETriggerType: {
		Task: 1,
		Award: 2,
	},
}

////////////////////////////////////////////////////////////////////////////////
// 👇👇👇check function add below👇👇👇
checker = {
	CheckItem: function (data) {
		return Item.checkColumnContainsValue('id', data[0]);
	},

	// check item config valid
	CheckAward: function (data) {
		switch (data[0]) {
			case enums.EItemType.Item:
				return Item.checkColumnContainsValue('id', data[1]);
			case enums.EItemType.Equip:
				return Equip.checkColumnContainsValue('id', data[1]);
		}
		return false;
	},
}

exports.enums = enums;
exports.checker = checker;