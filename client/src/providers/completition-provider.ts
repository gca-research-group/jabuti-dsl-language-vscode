import { CompletionItemKind, Position, SnippetString, TextDocument } from 'vscode';
import { templateContract1, templateContract2 } from './templates/contract';

const pad20 = value => new String(value).padStart(2, '0');
const date_initial = new Date();
const date_initial_formatted = `${date_initial.getFullYear()}-${pad20(
    date_initial.getMonth() + 1,
)}-${pad20(date_initial.getDate())} ${pad20(date_initial.getHours())}:${pad20(
    date_initial.getMinutes(),
)}:${pad20(date_initial.getSeconds())}`;

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
    insertText?: SnippetString,
) {
    return labels.map(label => {
        return { label, kind, insertText };
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
                    label: 'contract #1',
                    document: 'A sample contract',
                    detail: 'A sample contract',
                    insertText: templateContract1,
                    kind: CompletionItemKind.Class,
                    command: {
                        command: 'editor.action.triggerSuggest',
                        title: 'Re-trigger completions...',
                    },
                },
                {
                    label: 'contract #2',
                    document: 'A complete contract',
                    detail: 'A complete contract',
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

        const element = findCurrentElement(lines, positionLine);

        if (element?.includes('contract')) {
            return [
                {
                    label: 'variables',
                    insertText: 'variables {\n\t\n}',
                    kind: CompletionItemKind.Function,
                },
                {
                    label: 'dates',
                    insertText: new SnippetString('dates {\n\t${1}\n}'),
                    kind: CompletionItemKind.Function,
                    command: {
                        command: 'editor.action.triggerSuggest',
                        title: 'Re-trigger completions...',
                    },
                },
                {
                    label: 'parties',
                    insertText: new SnippetString('parties {\n\t${1}\n}'),
                    kind: CompletionItemKind.Function,
                    command: {
                        command: 'editor.action.triggerSuggest',
                        title: 'Re-trigger completions...',
                    },
                },
                {
                    label: 'clauses',
                    insertText: new SnippetString('clauses {\n\t${1}\n}'),
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
                    insertText: new SnippetString(
                        'beginDate = ${1:0000-00-00} ${2:00:00:00}',
                    ),
                    kind: CompletionItemKind.Property,
                },
                {
                    label: 'dueDate',
                    insertText: new SnippetString(
                        'dueDate = ${1:0000-00-00} ${2:00:00:00}',
                    ),
                    kind: CompletionItemKind.Property,
                },
            ];
        }

        if (element?.includes('clauses')) {
            return [
                {
                    label: 'right',
                    insertText: new SnippetString(
                        'right ${1:clauseName} {\n\t${2}\n}',
                    ),
                    kind: CompletionItemKind.Function,
                    command: {
                        command: 'editor.action.triggerSuggest',
                        title: 'Re-trigger completions...',
                    },
                },
                {
                    label: 'obligation',
                    insertText: new SnippetString(
                        'obligation ${1:clauseName} {\n\t${2}\n}',
                    ),
                    kind: CompletionItemKind.Function,
                    command: {
                        command: 'editor.action.triggerSuggest',
                        title: 'Re-trigger completions...',
                    },
                },
                {
                    label: 'prohibition',
                    insertText: new SnippetString(
                        'prohibition ${1:clauseName} {\n\t${2}\n}',
                    ),
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
                    insertText: new SnippetString(
                        'rolePlayer = ${1|application,process|}',
                    ),
                    kind: CompletionItemKind.Property,
                },
                {
                    label: 'operation',
                    insertText: new SnippetString(
                        'operation = ${1|push,poll,read,write,request,response|}',
                    ),
                    kind: CompletionItemKind.Property,
                },
                {
                    label: 'terms',
                    insertText: new SnippetString('terms {\n\t${1}\n}'),
                    kind: CompletionItemKind.Function,
                    command: {
                        command: 'editor.action.triggerSuggest',
                        title: 'Re-trigger completions...',
                    },
                },
                {
                    label: 'onBreach',
                    insertText: new SnippetString('onBreach(${1:log("${2}")})'),
                    kind: CompletionItemKind.Property,
                },
            ];
        }

        if (element?.includes('terms')) {
            return [
                {
                    label: 'MaxNumberOfOperation',
                    insertText: new SnippetString(
                        'MaxNumberOfOperation(${1:0} per ${2|Second,Hour,Minute,Day,Week,Month|})',
                    ),
                    kind: CompletionItemKind.Property,
                },
                {
                    label: 'MessageContent',
                    insertText: new SnippetString('MessageContent(${1})'),
                    kind: CompletionItemKind.Property,
                },
                {
                    label: 'WeekDaysInterval',
                    insertText: new SnippetString(
                        'WeekDaysInterval(${1|Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday|} to ${2|Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday|})',
                    ),
                    kind: CompletionItemKind.Property,
                },
                {
                    label: 'TimeInterval',
                    insertText: new SnippetString(
                        'TimeInterval(${1:00:00:00} to ${2:23:59:59})',
                    ),
                    kind: CompletionItemKind.Property,
                },
                {
                    label: 'Timeout',
                    insertText: new SnippetString('Timeout(${1:180})'),
                    kind: CompletionItemKind.Property,
                },
                {
                    label: 'SessionInterval',
                    insertText: new SnippetString(
                        'SessionInterval(${1:0} ${2|Second,Minute,Day,Week,Month|})',
                    ),
                    kind: CompletionItemKind.Property,
                },
            ];
        }

        if (validateSubstringElement(element, 20, /variables/)) {
            return buildCompletitionItem(
                ['variables'],
                CompletionItemKind.Property,
                new SnippetString('${1:name} = "${2:value}"'),
            );
        }

        if (
            validateSubstringElement(
                element,
                11,
                /(beginDate[\s{1,}|\t{1,}]?=)|(dueDate[\s{1,}|\t{1,}]?=)/,
            )
        ) {
            return buildCompletitionItem(
                [date_initial_formatted],
                CompletionItemKind.Value,
                new SnippetString(`\${1:${date_initial_formatted}}`),
            );
        }

        if (validateSubstringElement(element, 13, /application[\s{1,}|\t{1,}]?=/)) {
            return buildCompletitionItem(
                ['Application name'],
                CompletionItemKind.Value,
                new SnippetString('"${1:Application name}"'),
            );
        }

        if (validateSubstringElement(element, 9, /process[\s{1,}|\t{1,}]?=/)) {
            return buildCompletitionItem(
                ['Process name'],
                CompletionItemKind.Value,
                new SnippetString('"${1:Process name}"'),
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
