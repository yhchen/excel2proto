import * as fs from 'fs-extra-promise';
import * as utils from './utils'

import ConfTpl from "./config_tpl.json";

// Work Root Dir
export const gRootDir = process.cwd();

// Global Export Config
export let gCfg: typeof ConfTpl = ConfTpl; // default config
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

utils.SetEnableDebugOutput(gCfg.EnableDebugOutput);
utils.SetLineBreaker(gCfg.LineBreak);

import {CTypeParser} from './CTypeParser';
CTypeParser.DateFmt = gCfg.DateFmt;
CTypeParser.TinyDateFmt = gCfg.TinyDateFmt;
CTypeParser.FractionDigitsFMT = gCfg.FractionDigitsFMT;
