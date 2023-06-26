import { Definition, Position, Range } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';

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

const getWord = (document: TextDocument, position: Position) => {
    const line = document.getText().split('\n')[position.line];
    const start = getStartPosition(position, line);
    const end = getEndPosition(position, line);

    const range: Range = Range.create(start, end);

    if (!(start && end)) {
        return;
    }

    return document.getText(range).replace(/(\s|\t){1,}/g, '');
};

export const definitionProvider = {
    provideDefinition(document: TextDocument, position: Position) {
        const word = getWord(document, position);

        if (!word) return;

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

        const start = Position.create(index, charPosition);
        const end = Position.create(index, charPosition + word.length);
        const range = Range.create(start, end);
        const definition: Definition = {
            uri: document.uri,
            range,
        };

        return definition;
    },
};
