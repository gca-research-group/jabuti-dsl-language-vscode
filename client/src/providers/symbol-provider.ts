import { DocumentSymbol, Position, Range, SymbolKind } from 'vscode';

const CONTRACT_TOKEN = 'contract';
const VARIABLES_TOKEN = 'variables';
const DATES_TOKEN = 'dates';
const BEGIN_DATE_TOKEN = 'beginDate';
const DUE_DATE_TOKEN = 'dueDate';
const PARTIES_TOKEN = 'parties';
const APPLICATION_TOKEN = 'application';
const PROCESS_TOKEN = 'process';
const CLAUSES_TOKEN = 'clauses';
const RIGHT_TOKEN = 'right';
const PROHIBITION_TOKEN = 'prohibition';
const OBLIGATION_TOKEN = 'obligation';
const ROLE_PLAYER_TOKEN = 'rolePlayer';
const OPERATION_TOKEN = 'operation';
const ON_BREACH_TOKEN = 'onBreach';
const TERMS_TOKEN = 'terms';
const WEEK_DAYS_INTERVAL_TOKEN = 'WeekDaysInterval';
const TIME_INTEVAL_TOKEN = 'TimeInterval';
const MAX_NUMBER_OF_OPERATION_TOKEN = 'MaxNumberOfOperation';
const MESSAGE_CONTENT_TOKEN = 'MessageContent';
const TIMEOUT_TOKEN = 'Timeout';

const buildSymbol = (
    token: string,
    position: Position,
    kind: SymbolKind = SymbolKind.Field,
) => {
    const range: Range = new Range(position, position);
    const symbol: DocumentSymbol = new DocumentSymbol(
        token,
        null,
        kind,
        range,
        range,
    );
    return symbol;
};

const findPositionInText = (
    text: string,
    token: string,
    charPositionInText: number,
): Position => {
    if (!charPositionInText) {
        return new Position(0, 0);
    }
    const line = text.substring(0, charPositionInText).split(/\n/).length - 1;
    const charPositionInLine = text.split(/\n/)[line].indexOf(token);
    return new Position(line, charPositionInLine);
};

const isCommentOrChar = function (text: string, position: Position) {
    const isComment = text
        .split(/\n/)
        .at(position.line)
        .substring(0, position.character)
        .match(/\/\/|\/\*|\*\//);
    const isChar = text
        .split(/\n/)
        .at(position.line)
        .substring(0, position.character)
        .match(/"/);
    return isComment || isChar;
};

const findAllOccurrenciesOfStringInText = function (
    token: { name: string; symbolKind?: SymbolKind },
    text: string,
) {
    let result;
    const indices: {
        position: Position;
        token: { name: string; symbolKind?: SymbolKind };
        charPositionInText: string;
    }[] = [];
    const regex = new RegExp(token.name, 'g');
    while ((result = regex.exec(text))) {
        const charPositionInText = result.index;
        const position = findPositionInText(text, token.name, charPositionInText);
        if (!isCommentOrChar(text, position)) {
            indices.push({ charPositionInText, position, token });
        }
    }
    return indices;
};

const findAllClauseTokens = function (
    text: string,
    tokens: { name: string; symbolKind?: SymbolKind }[],
) {
    return tokens
        .map(token => findAllOccurrenciesOfStringInText(token, text))
        .flat()
        .map(item => {
            const symbol = buildSymbol(
                item.token.name,
                item.position,
                item.token.symbolKind,
            );
            return { ...item, ...{ symbol, children: [] } };
        });
};

const findAllMainClauseTokens = function (tokens, mainTokens) {
    return tokens
        .filter(item => mainTokens.includes(item.token.name))
        .sort((a, b) => a.charPositionInText - b.charPositionInText);
};

const addChildrenToMainClauseToken = function (allClauseTokens, tree) {
    return tree
        .map(item => {
            const mainClauseTokens = findAllMainClauseTokens(
                allClauseTokens,
                item.main,
            );
            const childrenClauseTokens = findAllMainClauseTokens(
                allClauseTokens,
                item.children,
            );

            return mainClauseTokens.map((clause, index) => {
                const children = childrenClauseTokens
                    .filter(indice => !item.main.includes(indice.token.name))
                    .filter(indice => {
                        if (index != mainClauseTokens.length - 1) {
                            const nextIndex =
                                index == mainClauseTokens.length - 1
                                    ? index
                                    : index + 1;
                            return (
                                indice.charPositionInText <=
                                    mainClauseTokens[nextIndex].charPositionInText &&
                                indice.charPositionInText >=
                                    clause.charPositionInText
                            );
                        }
                        return (
                            indice.charPositionInText >= clause.charPositionInText
                        );
                    })
                    .map(indice => indice.symbol);

                clause.symbol.children.push(...children);
                return clause.symbol;
            });
        })
        .pop();
};

const createVariableNamesSymbol = function (text: string, variablesIndex: number) {
    const variablesMatches = text.match(/variables\s?\{([^{]*)\}/);

    const symbols = [];

    if (!variablesMatches) {
        return symbols;
    }

    const variableNames: string[] = variablesMatches[1]
        .match(/\w{1,}[\s{1,}]?=/gi)
        ?.map(item => item.replace(/[\s{1,}|=]/g, ''));

    const variableNamesUnique = new Set(variableNames);
    const variablePosition = findPositionInText(
        text,
        VARIABLES_TOKEN,
        variablesIndex,
    );

    variableNamesUnique.forEach(item => {
        const currentSymbols = findAllOccurrenciesOfStringInText(
            { name: item, symbolKind: SymbolKind.Variable },
            variablesMatches[0],
        ).map(item => {
            item.position = new Position(
                item.position.line + variablePosition.line,
                item.position.character,
            );
            return buildSymbol(
                item.token.name,
                item.position,
                item.token.symbolKind,
            );
        });

        symbols.push(...currentSymbols);
    });

    return symbols;
};

export const symbolProvider = {
    provideDocumentSymbols(document, _token) {
        const text = document.getText();

        if (!text) {
            return [];
        }

        const symbols = [];

        const contractIndex = text.indexOf(CONTRACT_TOKEN);
        const vairablesIndex = text.indexOf(VARIABLES_TOKEN);
        const datesndex = text.indexOf(DATES_TOKEN);
        const beginDateIndex = text.indexOf(BEGIN_DATE_TOKEN);
        const dueDateIndex = text.indexOf(DUE_DATE_TOKEN);
        const partiesIndex = text.indexOf(PARTIES_TOKEN);
        const applicationIndex = text.indexOf(APPLICATION_TOKEN);
        const processIndex = text.indexOf(PROCESS_TOKEN);
        const clausesIndex = text.indexOf(CLAUSES_TOKEN);

        const contractSymbol =
            contractIndex != -1
                ? buildSymbol(
                      CONTRACT_TOKEN,
                      findPositionInText(text, CONTRACT_TOKEN, contractIndex),
                      SymbolKind.Module,
                  )
                : null;
        const variablesSymbol =
            vairablesIndex != -1
                ? buildSymbol(
                      VARIABLES_TOKEN,
                      findPositionInText(text, VARIABLES_TOKEN, vairablesIndex),
                  )
                : null;
        const datesSymbol =
            datesndex != -1
                ? buildSymbol(
                      DATES_TOKEN,
                      findPositionInText(text, DATES_TOKEN, datesndex),
                  )
                : null;
        const beginDateSymbol =
            beginDateIndex != -1
                ? buildSymbol(
                      BEGIN_DATE_TOKEN,
                      findPositionInText(text, BEGIN_DATE_TOKEN, beginDateIndex),
                      SymbolKind.Property,
                  )
                : null;
        const dueDateSymbol =
            dueDateIndex != -1
                ? buildSymbol(
                      DUE_DATE_TOKEN,
                      findPositionInText(text, DUE_DATE_TOKEN, dueDateIndex),
                      SymbolKind.Property,
                  )
                : null;
        const partiesSymbol =
            partiesIndex != -1
                ? buildSymbol(
                      PARTIES_TOKEN,
                      findPositionInText(text, PARTIES_TOKEN, partiesIndex),
                  )
                : null;
        const applicationSymbol =
            applicationIndex != -1
                ? buildSymbol(
                      APPLICATION_TOKEN,
                      findPositionInText(text, APPLICATION_TOKEN, applicationIndex),
                      SymbolKind.Property,
                  )
                : null;
        const processSymbol =
            processIndex != -1
                ? buildSymbol(
                      PROCESS_TOKEN,
                      findPositionInText(text, PROCESS_TOKEN, processIndex),
                      SymbolKind.Property,
                  )
                : null;
        const clausesSymbol =
            clausesIndex != -1
                ? buildSymbol(
                      CLAUSES_TOKEN,
                      findPositionInText(text, CLAUSES_TOKEN, clausesIndex),
                  )
                : null;

        variablesSymbol.children.push(
            ...createVariableNamesSymbol(text, vairablesIndex),
        );

        [beginDateSymbol, dueDateSymbol].forEach(symbol => {
            if (datesSymbol && symbol) {
                datesSymbol.children.push(symbol);
            }
        });

        [processSymbol, applicationSymbol].forEach(symbol => {
            if (partiesSymbol && symbol) {
                partiesSymbol.children.push(symbol);
            }
        });

        [variablesSymbol, datesSymbol, partiesSymbol, clausesSymbol].forEach(
            symbol => {
                if (contractSymbol && symbol) {
                    contractSymbol.children.push(symbol);
                }
            },
        );

        const tree = [
            {
                main: [TERMS_TOKEN],
                children: [
                    WEEK_DAYS_INTERVAL_TOKEN,
                    TIME_INTEVAL_TOKEN,
                    MAX_NUMBER_OF_OPERATION_TOKEN,
                    MESSAGE_CONTENT_TOKEN,
                    TIMEOUT_TOKEN,
                ],
            },
            {
                main: [RIGHT_TOKEN, PROHIBITION_TOKEN, OBLIGATION_TOKEN],
                children: [
                    ROLE_PLAYER_TOKEN,
                    OPERATION_TOKEN,
                    ON_BREACH_TOKEN,
                    TERMS_TOKEN,
                ],
            },
        ];

        const args = [
            { name: RIGHT_TOKEN },
            { name: PROHIBITION_TOKEN },
            { name: OBLIGATION_TOKEN },
            { name: ROLE_PLAYER_TOKEN, symbolKind: SymbolKind.Property },
            { name: OPERATION_TOKEN, symbolKind: SymbolKind.Property },
            { name: ON_BREACH_TOKEN, symbolKind: SymbolKind.Function },
            { name: TERMS_TOKEN },
            { name: WEEK_DAYS_INTERVAL_TOKEN, symbolKind: SymbolKind.Function },
            { name: TIME_INTEVAL_TOKEN, symbolKind: SymbolKind.Function },
            { name: MAX_NUMBER_OF_OPERATION_TOKEN, symbolKind: SymbolKind.Function },
            { name: MESSAGE_CONTENT_TOKEN, symbolKind: SymbolKind.Function },
            { name: TIMEOUT_TOKEN, symbolKind: SymbolKind.Function },
        ];
        const allClauseTokens = findAllClauseTokens(text, args);
        const clausesChildrenSymbol = addChildrenToMainClauseToken(
            allClauseTokens,
            tree,
        );

        clausesSymbol.children.push(...clausesChildrenSymbol);

        symbols.push(contractSymbol);

        return symbols;
    },
};
