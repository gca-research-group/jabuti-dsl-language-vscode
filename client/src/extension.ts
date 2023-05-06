/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from 'path';
import {
    workspace,
    ExtensionContext,
    languages,
    Definition,
    Position,
    Range,
} from 'vscode';

import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind,
} from 'vscode-languageclient/node';
import { completitionProvider } from './providers/completition-provider';
import { symbolProvider } from './providers/symbol-provider';

let client: LanguageClient;

export function activate(context: ExtensionContext) {
    context.subscriptions.push(
        languages.registerCompletionItemProvider('jabuti', completitionProvider),
    );
    context.subscriptions.push(
        languages.registerDocumentSymbolProvider('jabuti', symbolProvider),
    );
    context.subscriptions.push(
        languages.registerDefinitionProvider('jabuti', {
            provideDefinition(document, position, token) {
                const word = document
                    .getText(document.getWordRangeAtPosition(position))
                    .replace(/(\s|\t){1,}/g, '');

                const APPLICATION = 'application';
                const PROCESS = 'process';

                if (![APPLICATION, PROCESS].includes(word)) return;

                const text = document.getText();
                const lines = text.split('\n');
                const index = lines.findIndex(item => {
                    const replaced = item.replace(/(\s|\t){1,}/g, '');
                    return replaced.includes(`${word}=`);
                });

                if (index == -1) return;

                const line = lines[index];

                const charPosition = line.indexOf(word);

                const start = new Position(index, charPosition);
                const end = new Position(index, charPosition + word.length);
                const range = new Range(start, end);
                const definition: Definition = {
                    uri: document.uri,
                    range,
                };

                return definition;
            },
        }),
    );
    // The server is implemented in node
    const serverModule = context.asAbsolutePath(path.join('dist', 'server.js'));

    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    const serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: {
            module: serverModule,
            transport: TransportKind.ipc,
        },
    };

    // Options to control the language client
    const clientOptions: LanguageClientOptions = {
        // Register the server for plain text documents
        documentSelector: [{ scheme: 'file', language: 'jabuti' }],
        synchronize: {
            // Notify the server about file changes to '.clientrc files contained in the workspace
            fileEvents: workspace.createFileSystemWatcher('**/.clientrc'),
        },
    };

    // Create the language client and start the client.
    client = new LanguageClient(
        'jabutiLSPServer',
        'Language Server Jabuti',
        serverOptions,
        clientOptions,
    );

    // Start the client. This will also launch the server
    client.start();
}

export function deactivate(): Thenable<void> | undefined {
    if (!client) {
        return undefined;
    }
    return client.stop();
}
