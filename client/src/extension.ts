/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from 'path';
import {
    workspace,
    ExtensionContext,
    languages,
    Position,
    SymbolInformation,
    SymbolKind,
    Location,
    DocumentSymbol,
    Range,
} from 'vscode';

import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind,
} from 'vscode-languageclient/node';
import { hoverProvider } from './providers/hover-provider';
import { completitionProvider } from './providers/completition-provider';
import { symbolProvider } from './providers/symbol-provider';

let client: LanguageClient;

export function activate(context: ExtensionContext) {
    context.subscriptions.push(
        languages.registerCompletionItemProvider('jabuti', completitionProvider),
    );
    context.subscriptions.push(
        languages.registerHoverProvider('jabuti', hoverProvider),
    );
    context.subscriptions.push(
        languages.registerDocumentSymbolProvider('jabuti', symbolProvider),
    );

    // The server is implemented in node
    const serverModule = context.asAbsolutePath(
        path.join('server', 'out', 'server.js'),
    );

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
