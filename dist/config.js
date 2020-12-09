"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitGlobalConfig = exports.gCfg = exports.gGlobalIgnoreDirName = exports.gRootDir = void 0;
const fs = __importStar(require("fs-extra-promise"));
const path = __importStar(require("path"));
const utils = __importStar(require("./utils"));
const CTypeParser_1 = require("./CTypeParser");
const config_tpl_json_1 = __importDefault(require("./config_tpl.json"));
const CHighTypeChecker_1 = require("./CHighTypeChecker");
// Work Root Dir
exports.gRootDir = process.cwd();
exports.gGlobalIgnoreDirName = new Set([
    ".svn",
    ".git"
]);
// Global Export Config
exports.gCfg = config_tpl_json_1.default; // default config
function InitGlobalConfig(fpath = '') {
    if (fpath != '') {
        exports.gCfg = JSON.parse(fs.readFileSync(fpath, { encoding: 'utf8' }));
        function check(gCfg, ConfTpl) {
            for (let key in ConfTpl) {
                if (ConfTpl[key] != null && typeof gCfg[key] !== typeof ConfTpl[key]) {
                    utils.exception(utils.red(`configure format error. key "${utils.yellow(key)}" not found!`));
                    return false;
                }
                if (utils.isObject(typeof ConfTpl[key])) {
                    check(gCfg[key], ConfTpl[key]);
                }
            }
            return true;
        }
        ;
        if (!check(exports.gCfg, config_tpl_json_1.default)) {
            return false;
        }
    }
    utils.SetLineBreaker(exports.gCfg.LineBreak);
    CTypeParser_1.CTypeParser.DateFmt = exports.gCfg.DateFmt;
    CTypeParser_1.CTypeParser.TinyDateFmt = exports.gCfg.TinyDateFmt;
    CTypeParser_1.CTypeParser.TimeStampUseMS = exports.gCfg.TimeStampUseMS;
    CTypeParser_1.CTypeParser.CustomDataNode = exports.gCfg.CustomDataNode;
    CTypeParser_1.CTypeParser.FractionDigitsFMT = exports.gCfg.FractionDigitsFMT;
    if (exports.gCfg.TypeCheckerJSFilePath) {
        let gPath = exports.gCfg.TypeCheckerJSFilePath;
        if (!path.isAbsolute(gPath)) {
            gPath = path.join(exports.gRootDir, gPath);
        }
        if (!fs.existsSync(gPath)) {
            utils.exception("config : {TypeCheckerJSFilePath} incorrect! path not found!");
        }
        CHighTypeChecker_1.CHightTypeChecker.TypeCheckerJSFilePath = gPath;
        try {
            require(gPath);
        }
        catch (ex) {
            utils.exception("config: {TypeCheckerJSFilePath} incorrect! js file format error", ex);
        }
    }
    return true;
}
exports.InitGlobalConfig = InitGlobalConfig;
//# sourceMappingURL=config.js.map