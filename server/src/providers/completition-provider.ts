import { TextDocument } from 'vscode-languageserver-textdocument';
import { templateContract1, templateContract2 } from './templates/contract';
import {
    CompletionItemKind,
    InsertTextFormat,
    Position,
} from 'vscode-languageserver';

const pad20 = (value: number) => `${value}`.padStart(2, '0');
const date_initial = new Date();
const date_final = new Date(Date.now() + 3600 * 1000 * 24);
const beginDate = `${date_initial.getFullYear()}-${pad20(
    date_initial.getMonth() + 1,
)}-${pad20(date_initial.getDate())} ${pad20(date_initial.getHours())}:${pad20(
    date_initial.getMinutes(),
)}:${pad20(date_initial.getSeconds())}`;
const dueDate = `${date_final.getFullYear()}-${pad20(
    date_final.getMonth() + 1,
)}-${pad20(date_final.getDate())} ${pad20(date_final.getHours())}:${pad20(
    date_final.getMinutes(),
)}:${pad20(date_final.getSeconds())}`;

const findCurrentElement = function (lines: string[], positionLine: number) {
    let element;
    let process = true;
    let index = 0;
    let closeParen = 0;

    while (process) {
        element = lines[positionLine - index];
        element = element.replace(/\t{1,}/, '');
        element = element.replace(/\s{2,}/, ' ');
        element = element.trim();

        if (!element) {
            ++index;
            continue;
        }

        if (element.substring(element.length - 1, element.length) === '=') {
            process = false;
        }

        if (element.includes('}')) {
            ++closeParen;
        }

        if (element.includes('{') && index !== 0) {
            closeParen > 0 ? --closeParen : (process = false);
        }

        ++index;
    }

    return element;
};

const validateSubstringElement = function (
    element: string,
    length: number,
    pattern: RegExp,
) {
    return element
        ?.substring(element.length - length, element.length)
        .match(pattern);
};

const buildCompletitionItem = function (
    labels: string[],
    kind: CompletionItemKind,
    insertText?: string,
) {
    return labels.map(label => {
        return {
            label,
            kind,
            insertText,
            insertTextFormat: InsertTextFormat.Snippet,
        };
    });
};

export const completitionProvider = {
    provideCompletionItems(document: TextDocument, position: Position) {
        const text = document.getText();
        const lines = text?.split(/\n/g);
        const positionLine = position.line;

        if (!lines?.length || !text.includes('contract')) {
            return [
                {
                    label: 'contract',
                    document: 'A sample contract',
                    detail: 'A sample contract',
                    insertTextFormat: InsertTextFormat.Snippet,
                    insertText: templateContract1,
                    kind: CompletionItemKind.Class,
                    command: {
                        command: 'editor.action.triggerSuggest',
                        title: 'Re-trigger completions...',
                    },
                },
                {
                    label: 'contract',
                    document: 'A complete contract',
                    detail: 'A complete contract',
                    insertTextFormat: InsertTextFormat.Snippet,
                    insertText: templateContract2,
                    kind: CompletionItemKind.Class,
                    command: {
                        command: 'editor.action.triggerSuggest',
                        title: 'Re-trigger completions...',
                    },
                },
            ];
        }

        if (
            !lines[position.line].substring(0, position.character).includes('{') &&
            lines[position.line].includes('contract')
        ) {
            return [];
        }

        const currentText = lines[position.line];
        const hasRParen = currentText.indexOf(')', position.character);
        const hasLParen = currentText.substring(0, position.character).indexOf('(');

        if (hasLParen !== -1 && hasRParen !== -1) {
            if (currentText.includes('WeekDaysInterval')) {
                if (
                    currentText.match(/\((\s\t){1,}\w+(\s\t){1,}to(\s\t){1,}\w+\)/)
                ) {
                    return [];
                }

                const isREmpty = !currentText
                    .substring(position.character, hasRParen)
                    .replace(/(\s|\t){1,}/g, '');

                const hasRTo = currentText
                    .substring(position.character, hasLParen)
                    .replace(/(\s|\t){1,}/g, '')
                    .endsWith('to');

                const isLEmpty = !currentText
                    .substring(hasLParen + 1, position.character)
                    .replace(/(\s|\t){1,}/g, '');

                const hasLTo = currentText
                    .substring(position.character, hasRParen)
                    .replace(/(\s|\t){1,}/g, '')
                    .startsWith('to');

                if ((isREmpty && hasRTo) || (isLEmpty && hasLTo)) {
                    return [
                        {
                            label: 'Monday',
                            insertText:
                                '${1|Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday|}',
                            insertTextFormat: InsertTextFormat.Snippet,
                            kind: CompletionItemKind.Property,
                        },
                    ];
                }
            }

            if (currentText.includes('MaxNumberOfOperation')) {
                if (
                    currentText.match(/\((\s\t){1,}\d+(\s\t){1,}per(\s\t){1,}\w+\)/)
                ) {
                    return [];
                }

                const isREmpty = !currentText
                    .substring(position.character, hasRParen)
                    .replace(/(\s|\t){1,}/g, '');

                const hasRTo = currentText
                    .substring(position.character, hasLParen)
                    .replace(/(\s|\t){1,}/g, '')
                    .endsWith('per');

                const isLEmpty = !currentText
                    .substring(hasLParen + 1, position.character)
                    .replace(/(\s|\t){1,}/g, '');

                const hasLTo = currentText
                    .substring(position.character, hasRParen)
                    .replace(/(\s|\t){1,}/g, '')
                    .startsWith('per');

                if (isLEmpty && hasLTo) {
                    return [
                        {
                            label: '0',
                            kind: CompletionItemKind.Property,
                        },
                    ];
                }

                if (isREmpty && hasRTo) {
                    return [
                        {
                            label: 'Second',
                            insertText: '${1|Second,Hour,Minute,Day,Week,Month|}',
                            insertTextFormat: InsertTextFormat.Snippet,
                            kind: CompletionItemKind.Property,
                        },
                    ];
                }
            }

            if (currentText.includes('TimeInterval')) {
                if (
                    currentText.match(
                        /\((\s\t){1,}(\d|:)*(\s\t){1,}to(\s\t){1,}(\d|:)*\)/,
                    )
                ) {
                    return [];
                }

                const isREmpty = !currentText
                    .substring(position.character, hasRParen)
                    .replace(/(\s|\t){1,}/g, '');

                const hasRTo = currentText
                    .substring(position.character, hasLParen)
                    .replace(/(\s|\t){1,}/g, '')
                    .endsWith('to');

                const isLEmpty = !currentText
                    .substring(hasLParen + 1, position.character)
                    .replace(/(\s|\t){1,}/g, '');

                const hasLTo = currentText
                    .substring(position.character, hasRParen)
                    .replace(/(\s|\t){1,}/g, '')
                    .startsWith('to');

                if (isLEmpty && hasLTo) {
                    return [
                        {
                            label: '00:00:00',
                            kind: CompletionItemKind.Property,
                        },
                    ];
                }

                if (isREmpty && hasRTo) {
                    return [
                        {
                            label: '23:59:59',
                            kind: CompletionItemKind.Property,
                        },
                    ];
                }
            }

            return [];
        }

        const element = findCurrentElement(lines, positionLine);

        if (!element) return [];

        if (element?.includes('contract')) {
            return [
                {
                    label: 'variables',
                    insertText: 'variables {\n\t\n}',
                    kind: CompletionItemKind.Function,
                },
                {
                    label: 'dates',
                    insertText: 'dates {\n\t${1}\n}',
                    insertTextFormat: InsertTextFormat.Snippet,
                    kind: CompletionItemKind.Function,
                    command: {
                        command: 'editor.action.triggerSuggest',
                        title: 'Re-trigger completions...',
                    },
                },
                {
                    label: 'parties',
                    insertText:
                        'parties {\n\tapplication="${1:Application name}"\n\tprocess="${2:Process name}"\n}',
                    insertTextFormat: InsertTextFormat.Snippet,
                    kind: CompletionItemKind.Function,
                    command: {
                        command: 'editor.action.triggerSuggest',
                        title: 'Re-trigger completions...',
                    },
                },
                {
                    label: 'clauses',
                    insertText: 'clauses {\n\t${1}\n}',
                    insertTextFormat: InsertTextFormat.Snippet,
                    kind: CompletionItemKind.Function,
                    command: {
                        command: 'editor.action.triggerSuggest',
                        title: 'Re-trigger completions...',
                    },
                },
            ];
        }

        if (element?.includes('dates')) {
            return [
                {
                    label: 'beginDate',
                    insertText: 'beginDate = ${1:0000-00-00} ${2:00:00:00}',
                    insertTextFormat: InsertTextFormat.Snippet,
                    kind: CompletionItemKind.Property,
                },
                {
                    label: 'dueDate',
                    insertText: 'dueDate = ${1:0000-00-00} ${2:00:00:00}',
                    insertTextFormat: InsertTextFormat.Snippet,
                    kind: CompletionItemKind.Property,
                },
            ];
        }

        if (element?.includes('clauses')) {
            return [
                {
                    label: 'right',
                    insertText: 'right ${1:clauseName} {\n\t${2}\n}',
                    insertTextFormat: InsertTextFormat.Snippet,
                    kind: CompletionItemKind.Function,
                    command: {
                        command: 'editor.action.triggerSuggest',
                        title: 'Re-trigger completions...',
                    },
                },
                {
                    label: 'obligation',
                    insertText: 'obligation ${1:clauseName} {\n\t${2}\n}',
                    insertTextFormat: InsertTextFormat.Snippet,
                    kind: CompletionItemKind.Function,
                    command: {
                        command: 'editor.action.triggerSuggest',
                        title: 'Re-trigger completions...',
                    },
                },
                {
                    label: 'prohibition',
                    insertText: 'prohibition ${1:clauseName} {\n\t${2}\n}',
                    insertTextFormat: InsertTextFormat.Snippet,
                    kind: CompletionItemKind.Function,
                    command: {
                        command: 'editor.action.triggerSuggest',
                        title: 'Re-trigger completions...',
                    },
                },
            ];
        }

        if (
            element?.includes('right') ||
            element?.includes('obligation') ||
            element?.includes('prohibition')
        ) {
            return [
                {
                    label: 'rolePlayer',
                    insertText: 'rolePlayer = ${1|application,process|}',
                    insertTextFormat: InsertTextFormat.Snippet,
                    kind: CompletionItemKind.Property,
                },
                {
                    label: 'operation',
                    insertText:
                        'operation = ${1|push,poll,read,write,request,response|}',
                    insertTextFormat: InsertTextFormat.Snippet,
                    kind: CompletionItemKind.Property,
                },
                {
                    label: 'terms',
                    insertText: 'terms {\n\t${1}\n}',
                    insertTextFormat: InsertTextFormat.Snippet,
                    kind: CompletionItemKind.Function,
                    command: {
                        command: 'editor.action.triggerSuggest',
                        title: 'Re-trigger completions...',
                    },
                },
                {
                    label: 'onBreach',
                    insertText: 'onBreach(${1:log("${2}")})',
                    insertTextFormat: InsertTextFormat.Snippet,
                    kind: CompletionItemKind.Property,
                },
            ];
        }

        if (element?.includes('terms')) {
            return [
                {
                    label: 'MaxNumberOfOperation',
                    insertText:
                        'MaxNumberOfOperation(${1:0} per ${2|Second,Hour,Minute,Day,Week,Month|})',
                    insertTextFormat: InsertTextFormat.Snippet,
                    kind: CompletionItemKind.Property,
                },
                {
                    label: 'MessageContent',
                    insertText: 'MessageContent(${1})',
                    insertTextFormat: InsertTextFormat.Snippet,
                    kind: CompletionItemKind.Property,
                },
                {
                    label: 'WeekDaysInterval',
                    insertText:
                        'WeekDaysInterval(${1|Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday|} to ${2|Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday|})',
                    insertTextFormat: InsertTextFormat.Snippet,
                    kind: CompletionItemKind.Property,
                },
                {
                    label: 'TimeInterval',
                    insertText: 'TimeInterval(${1:00:00:00} to ${2:23:59:59})',
                    insertTextFormat: InsertTextFormat.Snippet,
                    kind: CompletionItemKind.Property,
                },
                {
                    label: 'Timeout',
                    insertText: 'Timeout(${1:180})',
                    insertTextFormat: InsertTextFormat.Snippet,
                    kind: CompletionItemKind.Property,
                },
                {
                    label: 'SessionInterval',
                    insertText:
                        'SessionInterval(${1:0} ${2|Second,Minute,Day,Week,Month|})',
                    insertTextFormat: InsertTextFormat.Snippet,
                    kind: CompletionItemKind.Property,
                },
            ];
        }

        if (validateSubstringElement(element, 20, /variables/)) {
            return buildCompletitionItem(
                ['variables'],
                CompletionItemKind.Property,
                '${1:name} = "${2:value}"',
            );
        }

        if (validateSubstringElement(element, 11, /(beginDate[\s{1,}|\t{1,}]?=)/)) {
            return buildCompletitionItem(
                [beginDate],
                CompletionItemKind.Value,
                `\${1:${beginDate}}`,
            );
        }

        if (validateSubstringElement(element, 11, /(dueDate[\s{1,}|\t{1,}]?=)/)) {
            return buildCompletitionItem(
                [dueDate],
                CompletionItemKind.Value,
                `\${1:${dueDate}}`,
            );
        }

        if (validateSubstringElement(element, 13, /application[\s{1,}|\t{1,}]?=/)) {
            return buildCompletitionItem(
                ['application name'],
                CompletionItemKind.Value,
                '"${1:Application name}"',
            );
        }

        if (validateSubstringElement(element, 9, /process[\s{1,}|\t{1,}]?=/)) {
            return buildCompletitionItem(
                ['process name'],
                CompletionItemKind.Value,
                '"${1:Process name}"',
            );
        }

        if (validateSubstringElement(element, 12, /rolePlayer[\s{1,}|\t{1,}]?=/)) {
            return buildCompletitionItem(
                ['process', 'application'],
                CompletionItemKind.Enum,
            );
        }

        if (validateSubstringElement(element, 11, /operation[\s{1,}|\t{1,}]?=/)) {
            return buildCompletitionItem(
                ['push', 'poll', 'read', 'write', 'request', 'response'],
                CompletionItemKind.Enum,
            );
        }

        return [];
    },
};
