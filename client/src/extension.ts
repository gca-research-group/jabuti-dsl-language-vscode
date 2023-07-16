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
import * as vscode from 'vscode';
import * as fs from 'fs';
import { SolidityParser } from 'jabuti-dsl-model-transformation';

let client: LanguageClient;

const solidityParser = new SolidityParser();

export function activate(context: ExtensionContext) {
    const transformToSolidityCommand = vscode.commands.registerCommand(
        'extension.transform_to_solitity',
        async () => {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                const currentFilePath = editor.document.uri.fsPath;
                const fileName = path.basename(
                    currentFilePath,
                    path.extname(currentFilePath),
                );
                const currentFileDir = path.dirname(currentFilePath);
                const newFileName = `${fileName}.sol`;
                const newFilePath = path.join(currentFileDir, newFileName);
                const currentFileContent = fs.readFileSync(currentFilePath);
                const fileContentTransformed = solidityParser.parse(
                    currentFileContent.toString(),
                );

                fs.writeFileSync(newFilePath, fileContentTransformed.toString());

                const newFileUri = vscode.Uri.file(newFilePath);

                const newFileDocument = await vscode.workspace.openTextDocument(
                    newFileUri,
                );

                await vscode.window.showTextDocument(newFileDocument);
            }
        },
    );

    context.subscriptions.push(transformToSolidityCommand);

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
