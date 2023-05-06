import { ProviderResult } from 'vscode';
import { Hover, MarkupKind, Range } from 'vscode-languageserver';
import { Position, TextDocument } from 'vscode-languageserver-textdocument';

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

function getStartPosition(position: Position, currentLine: string) {
    const start = currentLine.substring(0, position.character).lastIndexOf(' ');
    const character = start > -1 ? start : 0;
    return { line: position.line, character };
}

function getEndPosition(position: Position, currentLine: string) {
    const end = currentLine
        .substring(position.character, currentLine.length)
        .indexOf(' ');
    const character = end > -1 ? end + position.character : currentLine.length;
    return { line: position.line, character };
}

export const hoverProvider = {
    provideHover(document: TextDocument, position: Position) {
        const line = document.getText().split('\n')[position.line];

        const start = getStartPosition(position, line);
        const end = getEndPosition(position, line);

        const range: Range = { start, end };

        if (!(start && end)) {
            return;
        }

        const hoveredWord = document.getText(range);

        if (hoveredWord.includes('contract')) {
            return {
                contents: [
                    'An agreement between two or more parties who do not trust each other unguardedly. A contract can be modelled as an Event Condition Action (ECA) system where events trigger the execution of actions when certain conditions are satisfied.',
                ],
            };
        }

        if (hoveredWord.includes('beginDate')) {
            const contents = {
                kind: MarkupKind.PlainText,
                value: [
                    'The begin date of the contract.',
                    'Allowed patterns: yyyy-mm-dd HH:mm, yyyy-mm-dd HH:mm:ss',
                    'Examples:',
                    `${beginDate}`,
                    `${beginDate.substring(0, 16)}`,
                ].join('\n'),
            };
            return {
                contents,
                range,
            };
        }

        if (hoveredWord.includes('dueDate')) {
            const contents = {
                kind: MarkupKind.PlainText,
                value: [
                    'The due date of the contract.',
                    'Allowed patterns: yyyy-mm-dd HH:mm, yyyy-mm-dd HH:mm:ss',
                    'Examples:',
                    `${dueDate}`,
                    `${dueDate.substring(0, 16)}`,
                ].join('\n'),
            };
            return {
                contents,
                range,
            };
        }

        if (hoveredWord.includes('dates')) {
            const contents = {
                kind: MarkupKind.Markdown,
                value: [
                    'The dates of the contract.',
                    '\nExample:',
                    [
                        '```jabuti',
                        'dates {',
                        `\tbeginDate = ${beginDate}`,
                        `\tdueDate = ${dueDate}`,
                        '}',
                        '```',
                    ].join('\n'),
                ].join('\n'),
            };
            return {
                contents,
                range,
            };
        }

        if (hoveredWord.includes('parties')) {
            const contents = {
                kind: MarkupKind.Markdown,
                value: [
                    'An entity (typically an enterprise or a human) that agrees with another to sign an agreement with clauses that stipulate terms and conditions.',
                    '\nExample:',
                    [
                        '```jabuti',
                        'parties {',
                        '\tapplication = "application name"',
                        '\tprocess = "process name"',
                        '}',
                        '```',
                    ].join('\n'),
                ].join('\n'),
            };
            return {
                contents,
                range,
            };
        }

        if (hoveredWord.includes('clauses')) {
            const contents = {
                kind: MarkupKind.Markdown,
                value: [
                    'A statement that stipulates one or more rights, obligations and prohibitions that the parties are expected to observe.',
                    '\nExample:',
                    [
                        '```jabuti',
                        'clauses {',
                        '\tclauseType clauseName {',
                        '\t\trolePlayer="A reference to a rolePlayer operation"',
                        '\t\toperation="A reference to an operation terms"',
                        '\t\tterms {',
                        '\t\t\t// Add terms here',
                        '\t\t}',
                        '\t}',
                        '}',
                        '```',
                    ].join('\n'),
                ].join('\n'),
            };
            return {
                contents,
                range,
            };
        }

        if (hoveredWord.includes('variables')) {
            return { contents: ['The variables of the contract.'] };
        }

        if (hoveredWord.includes('application')) {
            return { contents: ['The application name of the contract.'] };
        }

        if (hoveredWord.includes('process')) {
            return { contents: ['The process name of the contract.'] };
        }

        if (hoveredWord.includes('right')) {
            const contents = {
                kind: MarkupKind.Markdown,
                value: [
                    'An action (operation) that a party can perform if it wishes to and a condition holds. The party is free to execute the action (for example, send a purchase order) but can choose not to without negative consequences for the party. The execution of a right is illegal if the party tries to execute it when the conditions are not satisfied.',
                    '\nExample:',
                    [
                        '```jabuti',
                        'right clauseName {',
                        '\trolePlayer="A reference to a rolePlayer operation"',
                        '\toperation="A reference to an operation terms"',
                        '\tterms {',
                        '\t\t// Add terms here',
                        '\t}',
                        '}',
                        '```',
                    ].join('\n'),
                ].join('\n'),
            };
            return {
                contents,
                range,
            };
        }

        if (hoveredWord.includes('obligation')) {
            const contents = {
                kind: MarkupKind.Markdown,
                value: [
                    'An action (for example, pay a bill) that a party is expected to execute to comply with the smart contract, when a condition holds. A failure to execute the action that fulfils and obligation results in penalties to be paid by the irresponsible party.',
                    '\nExample:',
                    [
                        '```jabuti',
                        'obligation clauseName {',
                        '\trolePlayer="A reference to a rolePlayer operation"',
                        '\toperation="A reference to an operation terms"',
                        '\tterms {',
                        '\t\t// Add terms here',
                        '\t}',
                        '}',
                        '```',
                    ].join('\n'),
                ].join('\n'),
            };
            return {
                contents,
                range,
            };
        }

        if (hoveredWord.includes('prohibition')) {
            const contents = {
                kind: MarkupKind.Markdown,
                value: [
                    'An action that a party is not expected to execute when certain conditions hold unless it wishes to take the risk of being penalised.',
                    '\nExample:',
                    [
                        '```jabuti',
                        'prohibition clauseName {',
                        '\trolePlayer="A reference to a rolePlayer operation"',
                        '\toperation="A reference to an operation terms"',
                        '\tterms {',
                        '\t\t// Add terms here',
                        '\t}',
                        '}',
                        '```',
                    ].join('\n'),
                ].join('\n'),
            };
            return {
                contents,
                range,
            };
        }

        if (hoveredWord.includes('rolePlayer')) {
            return {
                contents: [
                    'Defines the scope of the clause: application or process.',
                ],
            };
        }

        if (hoveredWord.includes('operation')) {
            const contents = {
                kind: MarkupKind.PlainText,
                value: [
                    'Defines the type of the operation of the clause.',
                    '\nExample:',
                    'Allowed values:',
                    'push | poll | read | write | request | response',
                ].join('\n'),
            };
            return {
                contents,
                range,
            };
        }

        if (hoveredWord.includes('terms')) {
            const contents = {
                kind: MarkupKind.Markdown,
                value: [
                    'Used to define the rules of the service level and business level.',
                    '\nExample:',
                    ['```jabuti', 'terms {', '\t// Add terms here', '}', '```'].join(
                        '\n',
                    ),
                ].join('\n'),
            };
            return {
                contents,
                range,
            };
        }

        if (hoveredWord.includes('WeekDaysInterval')) {
            const contents = {
                kind: MarkupKind.PlainText,
                value: [
                    'A weekday interval.',
                    'WeekDays:',
                    'Monday | Tuesday | Wednesday | Thursday | Friday | Saturday | Sunday',
                    '\nExample:',
                    'WeekDaysInterval(Monday to Friday)',
                ].join('\n'),
            };
            return {
                contents,
                range,
            };
        }

        if (hoveredWord.includes('TimeInterval')) {
            const contents = {
                kind: MarkupKind.PlainText,
                value: [
                    'The time interval.',
                    '\nExample:',
                    'TimeInterval(00:00:00 to 23:00:00)',
                ].join('\n'),
            };
            return {
                contents,
                range,
            };
        }

        if (hoveredWord.includes('Timeout')) {
            const contents = {
                kind: MarkupKind.PlainText,
                value: ['The time interval.', '\nExample:', 'Timeout(180)'].join(
                    '\n',
                ),
            };
            return {
                contents,
                range,
            };
        }

        if (hoveredWord.includes('MaxNumberOfOperation')) {
            const contents = {
                kind: MarkupKind.PlainText,
                value: [
                    'A max number of operation.',
                    'Allowed intervals:',
                    'Second | Hour | Minute | Day | Week | Month',
                    '\nExample:',
                    'MaxNumberOfOperation(5 per Day)',
                ].join('\n'),
            };
            return {
                contents,
                range,
            };
        }

        if (hoveredWord.includes('MessageContent')) {
            return { contents: ['A message content.'] };
        }

        if (hoveredWord.includes('onBreach')) {
            return {
                contents: [
                    'used to perform an action if there is a clause violation.',
                ],
            };
        }

        if (hoveredWord.includes('log')) {
            return { contents: ['A log function.'] };
        }

        const hover: ProviderResult<Hover> = {
            contents: [],
        };
        return hover;
    },
};
