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

            const code = await ethereumSolidityParser.transform(
                currentFileContent.toString(),
            );

            fs.writeFileSync(newFilePath, code.content);

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

            const code = hyperledgerFabricGolangParser.transform(
                currentFileContent.toString(),
            );

            const fileName = getFileName(currentFilePath);

            const folderPath = path.join(path.dirname(currentFilePath), fileName);

            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath, { recursive: true });
            }

            fs.writeFileSync(path.join(folderPath, `${fileName}.go`), code.content);

            fs.writeFileSync(path.join(folderPath, 'go.mod'), code.mod);

            const newFileUri = path.join(folderPath, `${fileName}.go`);

            return newFileUri;
        } catch (error) {
            outputChannel.appendLine(
                `[An error occurred during the transformation] ${error}`,
            );
        }
    },
);

export const formatterCommand =
    vscode.languages.registerDocumentFormattingEditProvider('jabuti', {
        provideDocumentFormattingEdits(document) {
            const data = document.getText();
            let formatedText = data
                .toString()
                .replace(/\t/g, ' ')
                .replace(/\}\t/g, '}')
                .replace(/\s{2,}=/g, ' =')
                .replace(/=\s{2,}/g, '= ')
                .replace(/\s{2,}==/g, ' ==')
                .replace(/==\s{2,}/g, '== ')
                .replace(/ \(/g, '(')
                .replace(/\( /g, '(')
                .replace(/ \)/g, ')')
                .replace(/}\s*\n.*(onBreach)/g, '}\n\n$1') // Add a line break after closing terms block
                .replace(/\*\w/g, match => match.replace('*', '* ')) // Add a space after opening a comment
                .replace(/\w\*\//g, match => match.replace('*', ' *')) // Add a space before closing a comment
                .replace(/operation = \w{1,}/g, match => `${match}\n`) // Add a line break after operation attribute
                .replace(/(terms \{[^{]*?)\n{2,}/g, '$1\n') // Remove double line breaks within terms
                .replace(/(\})\n(\s*\w+)/g, '$1\n\n$2'); // Add a line break after closing a block

            for (const match of formatedText.matchAll(/\/\/([^\s])/g)) {
                formatedText = formatedText.replace(match[0], `// ${match[1]}`);
            }

            for (const match of formatedText.matchAll(/(\w){/g)) {
                formatedText = formatedText.replace(match[0], `${match[1]} {`);
            }

            let indentation = 0;

            let newText = '';

            for (const line of formatedText.split('\n')) {
                const [match] = line.match(/^(\s{1,})/) ?? [];

                let formatedLine = line.toString();

                if (formatedLine.includes('}') && indentation > 0) {
                    indentation = indentation - 1;
                }

                if (match && match.length !== 2 * indentation) {
                    formatedLine = `${' '.repeat(
                        2 * indentation,
                    )}${formatedLine.replace(match, '')}`;
                } else if (!match && indentation) {
                    formatedLine = `${' '.repeat(2 * indentation)}${formatedLine}`;
                }

                if (formatedLine.endsWith(' ')) {
                    formatedLine = formatedLine.trimEnd();
                }

                if (formatedLine.includes('{')) {
                    indentation = indentation + 1;
                }

                newText += `${formatedLine}\n`;
            }

            newText = newText.replace(/\n{3,}/g, '\n\n');
            const fullRange = new vscode.Range(
                document.lineAt(0).range.start,
                document.lineAt(document.lineCount - 1).range.end,
            );
            return [vscode.TextEdit.replace(fullRange, newText)];
        },
    });
