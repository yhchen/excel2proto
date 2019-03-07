import * as xlsx from 'xlsx';
import * as fs from 'fs-extra-promise';
import * as path from 'path';
import {execute} from './works'

import * as utils from './utils'
import {gCfg} from './config'


////////////////////////////////////////////////////////////////////////////////
async function main() {
	try {
		await execute();
		console.log('--------------------------------------------------------------------');
	} catch (ex) {
		utils.exception(ex);
	}
}

// main entry
main();
