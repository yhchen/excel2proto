#!/usr/bin/env node
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const works_1 = require("./works");
const utils = __importStar(require("./utils"));
const config = __importStar(require("./config"));
////////////////////////////////////////////////////////////////////////////////
function printHelp() {
    console.log(false, `${process.argv[0]} ${process.argv[1]} <config file path(optional)>`);
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const configPath = process.argv.length >= 3 ? process.argv[2] : undefined;
            if (configPath == '-h' || configPath == '--h' || configPath == '/h' || configPath == '/?') {
                printHelp();
                return;
            }
            else if (!fs.existsSync(process.argv[2])) {
                printHelp();
                return;
            }
            if (!config.InitGlobalConfig(configPath)) {
                utils.exception(`Init Global Config "${configPath}" Failure.`);
                return;
            }
            yield works_1.execute();
            console.log('--------------------------------------------------------------------');
        }
        catch (ex) {
            utils.exception(ex);
            process.exit(-1 /* EXECUTE_FAILURE */);
        }
    });
}
// main entry
main();
//# sourceMappingURL=index.js.map