import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import {
    HyperledgerFabricGolangFactory,
    EthereumSolidityFactory,
} from 'jabuti-ce-transformation-engine';

const ethereumSolidityParser = new EthereumSolidityFactory();
const hyperledgerFabricGolangParser = new HyperledgerFabricGolangFactory();

const getCurrentEditor = () => {
    return vscode.window.activeTextEditor;
};

const getCurrentFilePath = () => {
    const editor = getCurrentEditor();

    if (!editor) {
        return;
    }

    return editor.document.uri.fsPath;
};

const getFileName = (filePath: string) => {
    return path.basename(filePath, path.extname(filePath));
};

const outputChannel: vscode.OutputChannel =
    vscode.window.createOutputChannel('Jabuti CE');

const baseCommand = (
    progressTitle: string,
    command: string,
    commandFn: (currentFilePath: string) => Promise<string>,
) =>
    vscode.commands.registerCommand(command, async () => {
        vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                cancellable: false,
                title: progressTitle,
            },
            async progress => {
                progress.report({ increment: 0 });

                const currentFilePath = getCurrentFilePath();

                if (!currentFilePath) {
                    progress.report({ increment: 100 });
                    vscode.window.showErrorMessage(
                        'Open the jabuti file to perform the transformation.',
                    );
                    return;
                }

                const filePath = await commandFn(currentFilePath);

                const fileUri = vscode.Uri.file(filePath);

                const fileDocument = await vscode.workspace.openTextDocument(
                    fileUri,
                );

                await vscode.window.showTextDocument(fileDocument);

                progress.report({ increment: 100 });
            },
        );
    });

export const transformToEthereumSolidityCommand = baseCommand(
    'Transforming to Ethereum (Solidity) - in development',
    'extension.transform_to_ethereum_solitity',
    async (currentFilePath: string) => {
        try {
            const fileName = getFileName(currentFilePath);
            const newFileName = `${fileName}.sol`;

            const currentFolderPath = path.dirname(currentFilePath);
            const newFilePath = path.join(currentFolderPath, newFileName);

            const currentFileContent = fs.readFileSync(currentFilePath);

            const code = await ethereumSolidityParser.run(
                currentFileContent.toString(),
            );

            fs.writeFileSync(newFilePath, code);

            return newFilePath;
        } catch (error) {
            outputChannel.appendLine(
                `[An error occurred during the transformation] ${error}`,
            );
        }
    },
);

export const transformToHyperledgerGolangCommand = baseCommand(
    'Transforming to Hyperldeger (Golang)',
    'extension.transform_to_hyperledger_golang',
    async (currentFilePath: string) => {
        try {
            const currentFileContent = fs.readFileSync(currentFilePath);

            const [code, goMod] = hyperledgerFabricGolangParser.run(
                currentFileContent.toString(),
            );

            const fileName = getFileName(currentFilePath);

            const folderPath = path.join(path.dirname(currentFilePath), fileName);

            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath, { recursive: true });
            }

            fs.writeFileSync(path.join(folderPath, `${fileName}.go`), code);

            fs.writeFileSync(path.join(folderPath, 'go.mod'), goMod);

            const newFileUri = path.join(folderPath, `${fileName}.go`);

            return newFileUri;
        } catch (error) {
            outputChannel.appendLine(
                `[An error occurred during the transformation] ${error}`,
            );
        }
    },
);
