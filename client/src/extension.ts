/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from 'path';
import { workspace, ExtensionContext } from 'vscode';

import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind,
} from 'vscode-languageclient/node';
import {
    formatterCommand,
    transformToEthereumSolidityCommand,
    transformToHyperledgerGolangCommand,
} from './commands';

let client: LanguageClient;

export function activate(context: ExtensionContext) {
    context.subscriptions.push(transformToEthereumSolidityCommand);
    context.subscriptions.push(transformToHyperledgerGolangCommand);
    context.subscriptions.push(formatterCommand);

    const serverModule = context.asAbsolutePath(path.join('dist', 'server.js'));

    const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

    const serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: {
            module: serverModule,
            transport: TransportKind.ipc,
            options: debugOptions,
        },
    };

    const clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: 'file', language: 'jabuti' }],
        synchronize: {
            fileEvents: workspace.createFileSystemWatcher('**/.clientrc'),
        },
    };

    client = new LanguageClient(
        'Language Server Jabuti',
        serverOptions,
        clientOptions,
    );

    client.start();
}

export function deactivate(): Thenable<void> | undefined {
    if (!client) {
        return undefined;
    }
    return client.stop();
}
