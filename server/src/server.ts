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
import { ParseTreeWalker } from 'antlr4ts/tree/ParseTreeWalker';

import { hoverProvider } from './providers/hover-provider';
import { completitionProvider } from './providers/completition-provider';
import { symbolProvider } from './providers/symbol-provider';
import { definitionProvider } from './providers/definition-provider';
import {
    GrammarParser,
    JabutiGrammarListenerImpl,
    ValidationError,
} from 'jabuti-ce-transformation-engine';
import { JabutiGrammarLexer } from 'jabuti-dsl-grammar-antlr/JabutiGrammarLexer';
import { JabutiGrammarParser } from 'jabuti-dsl-grammar-antlr/JabutiGrammarParser';

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

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;

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
    // documents.all().forEach(validateTextDocument);
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
    try {
        const inputStream = CharStreams.fromString(change.document.getText());

        const lexer = new JabutiGrammarLexer(inputStream);
        const tokenStream = new CommonTokenStream(lexer);
        const parser = new JabutiGrammarParser(tokenStream);

        parser.removeErrorListeners();
        lexer.removeErrorListeners();

        const errorListener = new ErrorListener();

        parser.addErrorListener(errorListener);
        lexer.addErrorListener(errorListener);

        const walker = new ParseTreeWalker();
        walker.walk(new JabutiGrammarListenerImpl(), parser.contract());

        connection.sendDiagnostics({
            uri: change.document.uri,
            diagnostics: errorListener.getErrors(),
        });
    } catch (error) {
        if (error instanceof ValidationError) {
            connection.sendDiagnostics({
                uri: change.document.uri,
                diagnostics: [
                    {
                        severity: DiagnosticSeverity.Error,
                        range: {
                            start: {
                                line: error.range?.start.line ?? 0,
                                character: error.range?.start.character ?? 0,
                            },
                            end: {
                                line: error.range?.end.line ?? 0,
                                character: error.range?.end.character ?? 0,
                            },
                        },
                        message: error.message,
                        source: 'Jabuti Language',
                    },
                ],
            });
        }
    }
});

connection.onDidChangeWatchedFiles(_change => {
    connection.console.log('We received an file change event');
});

connection.onCompletionResolve((item: CompletionItem): CompletionItem => item);

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

documents.listen(connection);

connection.listen();
