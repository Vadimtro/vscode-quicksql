# VsCode extension for Quick SQL

This extension equip `.qsql` and `.quicksql` files with 
[Quick SQL Language](https://github.com/oracle/quicksql/blob/main/doc/user/quick-sql-grammar.md) sugarcoating:
   - Syntax Highlighting
   - Syntax Error Checking

The Command Palette features `Translate QSQL to DDL`, which execution would generate 
DDL definitions in new `.sql` file.

## Experimental JSON to QSQL feature

Open a JSON file, e.g. https://github.com/oracle/quicksql/blob/main/test/JSON/car_racing/2.json. 
Run the Command Palette `Translate JSON to QSQL`.