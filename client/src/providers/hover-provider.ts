import { Hover, MarkdownString, ProviderResult } from 'vscode';

const pad20 = value => new String(value).padStart(2, '0');
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

export const hoverProvider = {
    provideHover(document, position, _token) {
        const range = document.getWordRangeAtPosition(position);
        if (!range) {
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
            const markdown = new MarkdownString('The begin date of the contract.');
            markdown.appendText('\nAllowed patterns: yyyy-mm-dd HH:mm, yyyy-mm-dd HH:mm:ss\n');
            markdown.appendText('\nExamples:\n');
            markdown.appendText(`\n${beginDate}\n`);
            markdown.appendText(`\n${beginDate.substring(0, 16)}\n`);
            markdown.isTrusted = true;
            return new Hover(markdown, range);
        }

        if (hoveredWord.includes('dueDate')) {
            const markdown = new MarkdownString('The due date of the contract.');
            markdown.appendText('\nAllowed patterns: yyyy-mm-dd HH:mm, yyyy-mm-dd HH:mm:ss\n');
            markdown.appendText('\nExamples:\n');
            markdown.appendText(`\n${dueDate}\n`);
            markdown.appendText(`\n${dueDate.substring(0, 16)}\n`);
            markdown.isTrusted = true;
            return new Hover(markdown, range);
        }

        if (hoveredWord.includes('dates')) {
            const markdown = new MarkdownString('The dates of the contract.');
            markdown.appendText('\nExample:\n');
            markdown.appendCodeblock(
                [
                    'dates {',
                    `\n\tbeginDate = ${beginDate}`,
                    `\n\tdueDate = ${dueDate}`,
                    '\n}',
                ].join(''),
            );
            markdown.isTrusted = true;
            return new Hover(markdown, range);
        }

        if (hoveredWord.includes('parties')) {
            const markdown = new MarkdownString('An entity (typically an enterprise or a human) that agrees with another to sign an agreement with clauses that stipulate terms and conditions.');
            markdown.appendText('\nExample:\n');
            markdown.appendCodeblock(
                [
                    'parties {',
                    '\n\tapplication = "application name"',
                    '\n\tprocess = "process name"',
                    '\n}',
                ].join(''),
            );
            markdown.isTrusted = true;
            return new Hover(markdown, range);
        }

        if (hoveredWord.includes('clauses')) {
            const markdown = new MarkdownString('A statement that stipulates one or more Rights, Obligations and Prohibitions that the parties are expected to observe.');
            markdown.appendText('\nExample:\n');
            markdown.appendCodeblock(
                [
                    'clauses {',
                    '\n\tclauseType clauseName {',
                    '\n\t\trolePlayer="a role player value"',
                    '\n\t\toperation="a operation value"',
                    '\n\t\tterms {',
                    '\n\t\t\t// Add terms here',
                    '\n\t\t}',
                    '\n\t}',
                    '\n}',
                ].join(''),
            );
            markdown.isTrusted = true;
            return new Hover(markdown, range);
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
            const markdown = new MarkdownString(
                'An action (operation) that a party can perform if it wishes to and a condition holds. The party is free to execute the action (for example, send a purchase order) but can choose not to without negative consequences for the party. The execution of a right is illegal if the party tries to execute it when the conditions are not satisfied.',
            );
            markdown.appendText('\nExample:\n');
            markdown.appendCodeblock(
                [
                    'right clauseName {',
                    '\n\trolePlayer="a role player value"',
                    '\n\toperation="a operation value"',
                    '\n\tterms {',
                    '\n\t\t// Add terms here',
                    '\n\t}',
                    '\n}',
                ].join(''),
            );
            markdown.isTrusted = true;
            return new Hover(markdown, range);
        }

        if (hoveredWord.includes('obligation')) {
            const markdown = new MarkdownString(
                'An action (for example, pay a bill) that a party is expected to execute to comply with the smart contract, when a condition holds. A failure to execute the action that fulfils and obligation results in penalties to be paid by the irresponsible party.',
            );
            markdown.appendText('\nExample:\n');
            markdown.appendCodeblock(
                [
                    'obligation clauseName {',
                    '\n\trolePlayer="a role player value"',
                    '\n\toperation="a operation value"',
                    '\n\tterms {',
                    '\n\t\t// Add terms here',
                    '\n\t}',
                    '\n}',
                ].join(''),
            );
            markdown.isTrusted = true;
            return new Hover(markdown, range);
        }

        if (hoveredWord.includes('prohibition')) {
            const markdown = new MarkdownString(
                'An action that a party is not expected to execute when certain conditions hold unless it wishes to take the risk of being penalised.',
            );
            markdown.appendText('\nExample:\n');
            markdown.appendCodeblock(
                [
                    'prohibition clauseName {',
                    '\n\trolePlayer="a role player value"',
                    '\n\toperation="a operation value"',
                    '\n\tterms {',
                    '\n\t\t// Add terms here',
                    '\n\t}',
                    '\n}',
                ].join(''),
            );
            markdown.isTrusted = true;
            return new Hover(markdown, range);
        }

        if (hoveredWord.includes('rolePlayer')) {
            return {
                contents: [
                    'Defines the scope of the clause: application or process.',
                ],
            };
        }

        if (hoveredWord.includes('operation')) {
            const markdown = new MarkdownString(
                'Defines the type of the operation of the clause.',
            );
            markdown.appendText('\nAllowed values:');
            markdown.appendText('\npush | poll | read | write | request | response');
            markdown.isTrusted = true;
            return new Hover(markdown, range);
        }

        if (hoveredWord.includes('terms')) {
            const markdown = new MarkdownString('The terms of the clause.');
            markdown.appendText('\nExample:\n');
            markdown.appendCodeblock(
                ['terms {', '\n\t// Add terms here', '\n}'].join(''),
            );
            markdown.isTrusted = true;
            return new Hover(markdown, range);
        }

        if (hoveredWord.includes('WeekDaysInterval')) {
            const markdown = new MarkdownString('A weekday interval.');
            markdown.appendText('\nWeekDays:');
            markdown.appendText(
                '\nMonday | Tuesday | Wednesday | Thursday | Friday | Saturday | Sunday\n',
            );
            markdown.appendText('\nExample:');
            markdown.appendText('\nWeekDaysInterval(Monday to Friday)');
            markdown.isTrusted = true;
            return new Hover(markdown, range);
        }

        if (hoveredWord.includes('TimeInterval')) {
            const markdown = new MarkdownString('The time interval.');
            markdown.appendText('\nExample:');
            markdown.appendText('\nTimeInterval(00:00:00 to 23:00:00)');
            markdown.isTrusted = true;
            return new Hover(markdown, range);
        }

        if (hoveredWord.includes('MaxNumberOfOperation')) {
            const markdown = new MarkdownString('A max number of operation.');
            markdown.appendText('\nAllowed intervals:');
            markdown.appendText('\nSecond | Hour | Minute | Day | Week | Month');
            markdown.appendText('\nExample:');
            markdown.appendText('\nMaxNumberOfOperation(5 per Day)');
            markdown.isTrusted = true;
            return new Hover(markdown, range);
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
