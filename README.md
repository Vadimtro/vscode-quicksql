# vscode-quicksql
 vscode extension for QSQL

## Installation

```bash
npm install @oracle/quicksql
```

## Run Extension

- Run -> Start Debugging (F5)
- Run -> Run Without Debugging (^F5)

In addition to usual language sugarcoating of .qsql files, the Command Palette 
has command `Translate QSQL to DDL`. 

## JSON to QSQL

This is experimental feature of QSQL. Try opening json files, e.g. https://github.com/oracle/quicksql/blob/main/test/JSON/car_racing/2.json. Run the Command Palette `Translate JSON to QSQL`.