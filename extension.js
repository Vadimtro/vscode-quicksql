const vscode = require('vscode');

//import * as path from 'path';
const path = require("path");
const fs = require('fs');

//import { Diagram } from "@oracle/quicksql";
const { quicksql, fromJSON } = require( "@oracle/quicksql" );


/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	console.log('QSQL is now active!');

	let toDDLcmd = vscode.commands.registerCommand('extension.toDDL', () => {
		if (!vscode.window.activeTextEditor) {
			vscode.window.showErrorMessage('No active editor');
			return; 
		}
		let { document } = vscode.window.activeTextEditor;
		const input = document.getText();

		const qsql = new quicksql(input);
		
		const output = qsql.getDDL(input);

		let newPath = document.uri.path+'.sql';
		newFile( output, newPath );
	});

	context.subscriptions.push(toDDLcmd);

	/*let toERDcmd = vscode.commands.registerCommand('extension.toERD', () => {
		if (!vscode.window.activeTextEditor) {
			vscode.window.showErrorMessage('No active editor');
			return; 
		}
		let { document } = vscode.window.activeTextEditor;
		const input = document.getText();

		const panel = vscode.window.createWebviewPanel(
			'ERD',
			'Entity Relationship Diagram',
			vscode.ViewColumn.One,
			{}
		  );
	
		  //
		  const onDiskPath = vscode.Uri.joinPath(context.extensionUri, '', 'diagram.html');
		  const url = panel.webview.asWebviewUri(onDiskPath);	
		  const text = fs.readFileSync(url.path) 
		  let html = text.toString(); 

		  html = html.replace(/qsqlInput/gi,input);
		  panel.webview.html = html;
	});*/

	//context.subscriptions.push(toERDcmd);


	let fromJSONcmd = vscode.commands.registerCommand('extension.fromJSON', () => {
		if (!vscode.window.activeTextEditor) {
			vscode.window.showErrorMessage('No active editor');
			return; 
		}
		let { document } = vscode.window.activeTextEditor;
		const input = document.getText();

		let file = document.uri.path;
		let pos = file.lastIndexOf('/');
		if( 0 < pos )
			file = file.substring(pos+1);
		pos = file.indexOf('.');
		if( 0 < pos )
			file = file.substring(0,pos);
			
		try {	
			const output = fromJSON(input, file);
			let newPath = document.uri.path+'.qsql';
			newFile( output, newPath );
		} catch( e ) {
			vscode.window.showErrorMessage(e.message);
			return;
		}

	});

	context.subscriptions.push(fromJSONcmd);

	const collection = vscode.languages.createDiagnosticCollection('test');
	if (vscode.window.activeTextEditor) {
		updateDiagnostics(vscode.window.activeTextEditor.document, collection);
	}
	context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(editor => {
		if (editor) {
			updateDiagnostics(editor.document, collection);
		}
	}));
	vscode.workspace.onDidChangeTextDocument((e) => {
		updateDiagnostics(e.document, collection);
    });

	/*vscode.languages.registerHoverProvider('qsql', {
		provideHover(document, position, token) {
		  return {
			contents: ['Hover Content']
		  };
		}
	});*/
}

const tokenTypes = [ 'variable', 'comment', 'string', 'keyword', 'number', 'operator', 'struct', 'property', 'type'];
const tokenModifiers = ['declaration', 'documentation'];
const legend = new vscode.SemanticTokensLegend(tokenTypes/*,tokenModifiers*/);

const provider = {
  provideDocumentSemanticTokens(
    document
  ) {
	const input = document.getText();
	const src = quicksql.lexer(input+'\n',true,true,'');
    const tokensBuilder = new vscode.SemanticTokensBuilder(legend);
    for( let i = 0; i < src.length; i++ ) {
		src[i].value = src[i].value.toLowerCase();
		let startCol = src[i].col;
		let endCol = src[i].col+src[i].value.length;
		let type = null;
		if( src[i].type == 'line-comment' ) {
			type = 'comment';
		} if( src[i].type == 'comment' ) {
			type = 'comment';
			tokensBuilder.push(
				new vscode.Range(new vscode.Position(src[i].line, startCol), new vscode.Position(src[i].line, endCol)),
				type
			);
			let j = src[i].line+1
			for( ; i < src.length-1 && j < src[i+1].line && j < src[src.length-1].line; j++ ) {
				tokensBuilder.push(
					new vscode.Range(new vscode.Position(j, 0), new vscode.Position(j, 250)),
					type
				);
			}
			endCol = 250;
			if( j == src[i+1].line ) 
				endCol =src[i+1].col;
			if( i < src.length && j == src[i+1].line || j == src[src.length-1].line ) {
				tokensBuilder.push(
					new vscode.Range(new vscode.Position(j, 0), new vscode.Position(j, endCol)),
					type
				);
			}
			continue;
		} else if( src[i].type == 'identifier' && 0 < i && src[i-1].value == '/' ) {
			type = 'keyword';
			startCol--;
		} else if( src[i].type == 'operation' && src[i].value != '/' ) {
			type = 'variable';
		} else if( src[i].type == 'digits' ) {
			type = 'number';
		} else if( src[i].value == 'num' || src[i].value == 'number'
		        || src[i].value == 'int' || src[i].value == 'integer'
		        || src[i].value == 'd'   || src[i].value == 'date'
		        || src[i].value == 'ts'   || src[i].value == 'timestamp'
		        || src[i].value == 'tstz'   || src[i].value == 'tswtz'
		        || src[i].value == 'char' || src[i].value == 'vc' || src[i].value == 'varchar'
		        || src[i].value == 'varchar2' || src[i].value == 'string'
		        || src[i].value == 'clob' || src[i].value == 'blob' || src[i].value == 'json'
		        || src[i].value == 'file'
				|| src[i].value.charAt(0) == 'v' && src[i].value.charAt(1) == 'c' && 0 <= src[i].value.charAt(2) && src[i].value.charAt(2) <= '9'
		) {
			type = 'type';
		}
		
		if( type != null ) {
			tokensBuilder.push(
			   new vscode.Range(new vscode.Position(src[i].line, startCol), new vscode.Position(src[i].line, endCol)),
			   type/*,
			   ['documentation']*/
		   );
		}
	}

    return tokensBuilder.build();
  }
};

const selector = { language: 'qsql', scheme: 'file' }; 

vscode.languages.registerDocumentSemanticTokensProvider(selector, provider, legend);

function updateDiagnostics(document, collection) {
	if (document && (document.uri.path.endsWith('.qsql') || document.uri.path.endsWith('.quicksql'))) {
		const input = document.getText();
		const output = new quicksql(input).getErrors();
		let errors = [];
		for( const i in output ) {
			const error = output[i];
			errors.push({
				code: '',
				message: error.message,
				range: new vscode.Range(new vscode.Position(error.from.line, error.from.depth), new vscode.Position(error.to.line, error.to.depth)),
				severity: vscode.DiagnosticSeverity.Error,
				source: '',
				relatedInformation: [
					new vscode.DiagnosticRelatedInformation(new vscode.Location(document.uri, new vscode.Range(new vscode.Position(1, 8), new vscode.Position(1, 9))), 'first assignment to `x`')
				]
			});
		}
		if( 0 < errors.length )
			collection.set(document.uri, errors);
		else
			collection.clear();
	} else {
		collection.clear();
	}
}

function newFile( content, filename ) {
	fs.writeFileSync(filename, content, 'utf8');
	
	const openPath = vscode.Uri.file(filename);
	vscode.workspace.openTextDocument(openPath).then(doc => {
		vscode.window.showTextDocument(doc);
	});
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
