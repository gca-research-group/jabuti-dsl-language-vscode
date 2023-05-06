/* eslint-disable @typescript-eslint/no-explicit-any */
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import {
    createConnection,
    TextDocuments,
    Diagnostic,
    DiagnosticSeverity,
    ProposedFeatures,
    InitializeParams,
    DidChangeConfigurationNotification,
    CompletionItem,
    TextDocumentPositionParams,
    TextDocumentSyncKind,
    InitializeResult,
    DocumentSymbolParams,
    DefinitionParams,
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';
import {
    ANTLRErrorListener,
    CharStreams,
    CommonTokenStream,
    RecognitionException,
    Recognizer,
} from 'antlr4ts';

import { JabutiGrammarParser } from 'jabuti-dsl-language-antlr-v3/dist/JabutiGrammarParser';
import { JabutiGrammarLexer } from 'jabuti-dsl-language-antlr-v3/dist/JabutiGrammarLexer';
import { hoverProvider } from './providers/hover-provider';
import { completitionProvider } from './providers/completition-provider';
import { symbolProvider } from './providers/symbol-provider';
import { definitionProvider } from './providers/definition-provider';

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;

class ErrorListener implements ANTLRErrorListener<unknown> {
    private errors: Diagnostic[] = [];
    syntaxError(
        _recognizer: Recognizer<any, any>,
        _offendingSymbol: any,
        line: number,
        charPositionInLine: number,
        message: string,
        _e: RecognitionException | undefined,
    ): void {
        this.errors.push({
            severity: DiagnosticSeverity.Error,
            range: {
                start: {
                    line: line - 1,
                    character: charPositionInLine,
                },
                end: {
                    line: line - 1,
                    character:
                        charPositionInLine + (_offendingSymbol?.text?.length ?? 1),
                },
            },
            message,
            source: 'Jabuti Language',
        });
    }

    getErrors(): any[] {
        return this.errors;
    }
}

connection.onInitialize((params: InitializeParams) => {
    const capabilities = params.capabilities;

    // Does the client support the `workspace/configuration` request?
    // If not, we fall back using global settings.
    hasConfigurationCapability = !!(
        capabilities.workspace && !!capabilities.workspace.configuration
    );
    hasWorkspaceFolderCapability = !!(
        capabilities.workspace && !!capabilities.workspace.workspaceFolders
    );
    hasDiagnosticRelatedInformationCapability = !!(
        capabilities.textDocument &&
        capabilities.textDocument.publishDiagnostics &&
        capabilities.textDocument.publishDiagnostics.relatedInformation
    );

    const result: InitializeResult = {
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Incremental,
            // Tell the client that this server supports code completion.
            completionProvider: {
                resolveProvider: true,
            },
            hoverProvider: true,
            documentSymbolProvider: true,
            definitionProvider: true,
        },
    };
    if (hasWorkspaceFolderCapability) {
        result.capabilities.workspace = {
            workspaceFolders: {
                supported: true,
            },
        };
    }
    return result;
});

connection.onInitialized(() => {
    if (hasConfigurationCapability) {
        // Register for all configuration changes.
        connection.client.register(
            DidChangeConfigurationNotification.type,
            undefined,
        );
    }
    if (hasWorkspaceFolderCapability) {
        connection.workspace.onDidChangeWorkspaceFolders(_event => {
            connection.console.log('Workspace folder change event received.');
        });
    }
});

// The example settings
interface Settings {
    maxNumberOfProblems: number;
}

// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
const defaultSettings: Settings = { maxNumberOfProblems: 1000 };
let globalSettings: Settings = defaultSettings;

// Cache the settings of all open documents
const documentSettings: Map<string, Thenable<Settings>> = new Map();

connection.onDidChangeConfiguration(change => {
    if (hasConfigurationCapability) {
        // Reset all cached document settings
        documentSettings.clear();
    } else {
        globalSettings = <Settings>(
            (change.settings.jabutiDSLServer || defaultSettings)
        );
    }

    // Revalidate all open text documents
    documents.all().forEach(validateTextDocument);
});

function getDocumentSettings(resource: string): Thenable<Settings> {
    if (!hasConfigurationCapability) {
        return Promise.resolve(globalSettings);
    }
    let result = documentSettings.get(resource);
    if (!result) {
        result = connection.workspace.getConfiguration({
            scopeUri: resource,
            section: 'jabutiDSLServer',
        });
        documentSettings.set(resource, result);
    }
    return result;
}

// Only keep settings for open documents
documents.onDidClose(e => {
    documentSettings.delete(e.document.uri);
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
    validateTextDocument(change.document);
});

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
    // In this simple example we get the settings for every validate run.
    const settings = await getDocumentSettings(textDocument.uri);

    // The validator creates diagnostics for all uppercase words length 2 and more
    const text = textDocument.getText();

    const inputStream = CharStreams.fromString(text);
    const lexer = new JabutiGrammarLexer(inputStream);
    lexer.removeErrorListeners();
    const errorListener = new ErrorListener();
    lexer.addErrorListener(errorListener);
    const tokenStream = new CommonTokenStream(lexer);
    const parser = new JabutiGrammarParser(tokenStream);
    parser.removeErrorListeners();
    parser.addErrorListener(errorListener);

    parser.contract();

    const diagnostics = errorListener
        .getErrors()
        .slice(0, settings?.maxNumberOfProblems ?? 1);

    const extractTokenError = function (str: string, character?: number) {
        if (character) {
            return str
                .substring(0, character)
                .replace('=', '')
                .replace('(', '')
                .replace(')', '')
                .replace(/\s{2,}/, '')
                .replace(/\t{1,}/, '')
                .replace('{', '')
                .replace('}', '')
                .trim()
                .split(/\s/)
                .pop();
        }
        return str
            .replace('=', '')
            .replace('(', '')
            .replace(')', '')
            .replace(/\s{2,}/, '')
            .replace(/\t{1,}/, '')
            .replace('{', '')
            .replace('}', '')
            .trim()
            .split(/\s/)
            .pop();
    };

    diagnostics.map((diagnostic: Diagnostic) => {
        const range = diagnostic.range;

        const lines = text.split('\n');

        if (
            diagnostic.message.match(/missing ({?StringLiteral|Word|Digit)/) ||
            diagnostic.message.match(/expecting ({?StringLiteral|Digit)/) ||
            diagnostic.message.match(/(expecting {N|missing {N)/) ||
            diagnostic.message.match(/(missing {')/) ||
            diagnostic.message.match(/^extraneous input/) ||
            diagnostic.message.match(/^mismatched input/)
        ) {
            let currentLine = range.start.line;
            const character = range.start.character;

            let tokenError = extractTokenError(lines[currentLine], character);

            let process = !tokenError;

            while (process) {
                currentLine--;

                if (currentLine <= 0) {
                    process = false;
                }

                tokenError = extractTokenError(lines[currentLine]);

                if (tokenError?.endsWith(',') || tokenError?.endsWith(')'))
                    tokenError = undefined;

                process = !tokenError;
            }

            if (tokenError && !diagnostic.message.match(/^extraneous input/)) {
                let initialCharacter = lines[currentLine].lastIndexOf(tokenError);
                initialCharacter = initialCharacter >= 0 ? initialCharacter : 0;
                diagnostic.range = {
                    start: {
                        line: currentLine,
                        character: initialCharacter,
                    },
                    end: {
                        line: currentLine,
                        character: initialCharacter + (tokenError.length ?? 1),
                    },
                };
            }

            if (tokenError) {
                if (['right', 'obligation', 'prohibition'].includes(tokenError)) {
                    tokenError += ' clause';
                }

                if (diagnostic.message.match(/(expecting {N|missing {N)/)) {
                    diagnostic.message = `incorrect ${tokenError} value format`;
                }

                if (diagnostic.message.match(/^missing (StringLiteral|Word)/)) {
                    diagnostic.message = `expecting ${tokenError} name`;
                }

                if (
                    diagnostic.message.match(
                        /expecting (Digit|{?StringLiteral)|missing ({?StringLiteral|Digit)/,
                    )
                ) {
                    diagnostic.message = `expecting ${tokenError} value`;
                }

                if (diagnostic.message.match(/missing {'/)) {
                    diagnostic.message = `expecting ${tokenError} value`;
                }

                if (diagnostic.message.match(/^(extraneous|mismatched) input/)) {
                    diagnostic.message = `expecting ${tokenError} function`;
                }
            }
        }

        return diagnostic;
    });

    const beginDateText = text.match(
        /beginDate[\s|\t]*=[\s|\t]*(\/|:|-|\d|\s|\t){1,}/,
    );
    const dueDateText = text.match(/dueDate[\s|\t]*=[\s|\t]*(\/|:|-|\d|\s|\t){1,}/);

    if (beginDateText && dueDateText) {
        const beginDate = beginDateText[0]
            .split('=')[1]
            .replace(/(\s|\t){2,}/g, ' ')
            .trim();
        const dueDate = dueDateText[0]
            .split('=')[1]
            .replace(/(\s|\t){2,}/g, ' ')
            .trim();
        if (new Date(dueDate) < new Date(beginDate)) {
            const message = 'dueDate should be greater than beginDate';
            const lines = text.split(/\n/);
            const line = lines.findIndex(item => item.includes('dueDate'));
            const charPositionDueDate = lines[line].indexOf('dueDate');
            diagnostics.push({
                severity: DiagnosticSeverity.Error,
                range: {
                    start: {
                        line: line,
                        character: charPositionDueDate,
                    },
                    end: {
                        line: line,
                        character: charPositionDueDate + 7,
                    },
                },
                message,
                source: 'Jabuti Language',
            });
        }
    }

    // Send the computed diagnostics to VSCode.
    connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

connection.onDidChangeWatchedFiles(_change => {
    // Monitored files have change in VSCode
    connection.console.log('We received an file change event');
});

connection.onCompletion((params: TextDocumentPositionParams): CompletionItem[] => {
    const text = documents.get(params.textDocument.uri);

    if (!text) {
        return [];
    }

    return completitionProvider.provideCompletionItems(text, params.position);
});

connection.onHover((params: TextDocumentPositionParams) => {
    const text = documents.get(params.textDocument.uri);

    if (!text) {
        return { contents: [] };
    }

    return hoverProvider.provideHover(text, params.position);
});

connection.onDocumentSymbol((params: DocumentSymbolParams) => {
    const text = documents.get(params.textDocument.uri);
    if (!text) {
        return [];
    }
    return symbolProvider.provideDocumentSymbols(text);
});

connection.onDefinition((params: DefinitionParams) => {
    const text = documents.get(params.textDocument.uri);
    if (!text) {
        return [];
    }
    return definitionProvider.provideDefinition(text, params.position);
});

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
