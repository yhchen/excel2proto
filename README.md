# excel_tiny_wrapper

## excel export with type check using nodejs in super fast speed

## How To Use

* Configure file is `config.json`. Add files and directory to `[IncludeFilesAndPath]` to dealing with.
* If the first character of the `file name` is "`!`" it will be `ignored` for export. `Sheet names` also apply to this rule.
* Add output table `Column Name` Row under `table name` Row. If a Column Name Start with `#` means is was a comment Column. And the Column will be ignored in the final export.
* Add `Column Format Type` line under `Column Name` Row.
* `[Export]`  is temporary not supported.
* A comment Row was start with word `#` at `A Column`. And the Row will be ignored in the final export.
* Cell `[N]A([N] is Row index)` start with `#` is a comment line.

## Support Format Export

type|desc
---|---
csv|csv format
json|Export as `json` format. <br>If `Export.OutputDir` is a directory. Export as a separate file per sheet, otherwise export as one file.
js|Export as `js` format. <br>Set `Export.ExportTemple` for export template. The tools will replace `{name}` with sheet name, and replace `{data}` with sheet data. <br>If `Export.OutputDir` is a directory. Export as a separate file per sheet, otherwise export as one file.
tsd|Export *.d.ts file for language `typescript` type check. <br>Set `Export.ExportTemple` for export template. The tools will replace `{type}` with table type, and replace `{data}` with row type. <br>If `Export.OutputDir` is a directory. Export as a separate file per sheet, otherwise export as one file.
lua|Export as `lua table` format. <br>Support Key name Compress if `Export.UseShortName` is true. <br>If `Export.OutputDir` is a directory. Export as a separate file per sheet, otherwise export as one file.
csharp(c#)|Export as `csharp(c#)` code. <br>Support {customData} replace is `ExportTemple` if `Export.CustomDataNode` set to be a sheet cell. <br>Configuration `UseNamespace` can be exported `using XXX1; Using XXX2 `at the beginning of the code. <br>If `Export.OutputDir` is a directory. Export as a separate file per sheet, otherwise export as one file.
proto3|Export as protobuf Version 3.x header. <br>Set `Export.OutputDataDir` to choose where to export to data files. `OutputDataDir` support directory only! <br>`Export.OutputDir` support directory only too!
jsonline|Export each line as as `json` format each line end with `Export.`, Compatible with ET Framework. see: [https://github.com/egametang/ET](#https://github.com/egametang/ET)

## Support Format Check

* Declare type definitions using grammar rules like typescript interface.
* Support numeric type size overflow validation.
* More convenient type definitions for game developers(like vector2 vector3 etc...).

### Base Type

type|desc
---|---
`char`|min:-127                  max:127
`uchar`|min:0                     max:255
`short`|min:-32768                max:32767
`ushort`|min:0                     max:65535
`int`|min:-2147483648           max:2147483647
`uint`|min:0                     max:4294967295
`int64`|min:-9223372036854775808  max:9223372036854775807
`uint64`|min:0                     max:18446744073709551615
`string`|auto change 'line break' to '\n
`double`|no limit
`float`|no limit
`bool`|true: 'true' or '1'       false: 'false' empty or '0
`date`|YYYY/MM/DD HH:mm:ss
`tinydate`|YYYY/MM/DD
`timestamp`|Linux time stamp
`utctime`|UTC time stamp

### Combination Type

type|desc
---|---
`<type>[<N> or null]`  | `<type>` is one of "Base Type" or "Combination Type". `<N>` is empty(variable-length) or number.<br/><b>`ATTENTION : For a better numerical configuration experience, the array depth should be no more than three levels.`</b>
`vector2`           | Equals to `float[2]`
`vector3`           | Equals to `float[3]`

### Simple Array Format

Separator :

* "`,`" is the first level separator
* "`;`" is the second level separator
* "`\n`" is the third level separator

Example :
> Type : `int[][]`  
> Data : `1,2;3,4,5`  
