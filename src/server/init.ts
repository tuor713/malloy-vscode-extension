/*
 * Copyright 2023 Google LLC
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files
 * (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge,
 * publish, distribute, sublicense, and/or sell copies of the Software,
 * and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import {
  TextDocuments,
  InitializeParams,
  TextDocumentSyncKind,
  InitializeResult,
  SemanticTokensBuilder,
  CompletionItem,
  HoverParams,
  Hover,
  Connection,
  Position,
  DidChangeConfigurationParams,
} from 'vscode-languageserver';
import debounce from 'lodash/debounce';

import {TextDocument} from 'vscode-languageserver-textdocument';
import {getMalloyDiagnostics} from './diagnostics';
import {getMalloySymbols} from './symbols';
import {TOKEN_TYPES, TOKEN_MODIFIERS, stubMalloyHighlights} from './highlights';
import {getMalloyLenses} from './lenses';
import {
  getCompletionItems,
  resolveCompletionItem,
} from './completions/completions';
import {getHover} from './hover/hover';
import {getMalloyDefinitionReference} from './definitions/definitions';
import {TranslateCache} from './translate_cache';
import {ConnectionManager} from '../common/connection_manager';
import {findMalloyLensesAt} from './lenses/lenses';

export const initServer = (
  documents: TextDocuments<TextDocument>,
  connection: Connection,
  connectionManager: ConnectionManager,
  onDidChangeConfiguration?: (params: DidChangeConfigurationParams) => void
) => {
  let haveConnectionsBeenSet = false;
  connection.onInitialize((params: InitializeParams) => {
    connection.console.info('onInitialize');
    const capabilities = params.capabilities;

    const result: InitializeResult = {
      capabilities: {
        textDocumentSync: TextDocumentSyncKind.Incremental,
        documentSymbolProvider: true,
        codeLensProvider: {
          resolveProvider: false,
        },
        completionProvider: {
          resolveProvider: true,
        },
        definitionProvider: true,
        semanticTokensProvider: {
          full: true,
          range: false,
          legend: {
            tokenTypes: TOKEN_TYPES,
            tokenModifiers: TOKEN_MODIFIERS,
          },
        },
        hoverProvider: true,
      },
    };

    if (capabilities.workspace?.workspaceFolders) {
      result.capabilities.workspace = {
        workspaceFolders: {
          supported: true,
        },
      };
    }

    return result;
  });

  const translateCache = new TranslateCache(
    documents,
    connection,
    connectionManager
  );

  async function diagnoseDocument(document: TextDocument) {
    if (haveConnectionsBeenSet) {
      connection.console.info(`diagnoseDocument ${document.uri} start`);
      // Necessary to copy the versions, because they're mutated in the same document object
      const versionsAtRequestTime = new Map(
        documents.all().map(document => [document.uri, document.version])
      );
      const diagnostics = await getMalloyDiagnostics(translateCache, document);

      // Only send diagnostics if the document hasn't changed since this request started
      for (const uri in diagnostics) {
        const versionAtRequest = versionsAtRequestTime.get(uri);
        if (
          versionAtRequest === undefined ||
          versionAtRequest === document.version
        ) {
          connection.sendDiagnostics({
            uri,
            diagnostics: diagnostics[uri],
            version: documents.get(uri)?.version,
          });
        }
      }

      // Trigger diagnostics for all documents we know that import this one,
      // too.
      translateCache.cache.forEach((entry, key) => {
        // Don't re-eject the current document
        if (documents.get(key)?.uri === document.uri) {
          return;
        }
        if (entry.model.fromSources.includes(document.uri)) {
          if (translateCache.cache.delete(key)) {
            const document = documents.get(key);
            if (document) {
              connection.console.info(
                `diagnoseDocument ejecting ${document.uri}`
              );
              debouncedDiagnoseDocuments[key](document);
            }
          }
        }
      });
      connection.console.info(`diagnoseDocument ${document.uri} end`);
    }
  }

  const debouncedDiagnoseDocuments: Record<
    string,
    (document: TextDocument) => Promise<void> | undefined
  > = {};

  const debouncedDiagnoseDocument = (document: TextDocument) => {
    const {uri} = document;
    if (!debouncedDiagnoseDocuments[uri]) {
      debouncedDiagnoseDocuments[uri] = debounce(diagnoseDocument, 300);
    }
    debouncedDiagnoseDocuments[uri](document);
  };

  documents.onDidChangeContent(change => {
    debouncedDiagnoseDocument(change.document);
  });

  documents.onDidClose(event => {
    const {uri} = event.document;
    translateCache.cache.delete(uri);
    delete debouncedDiagnoseDocuments[uri];
  });

  connection.onDocumentSymbol(handler => {
    const document = documents.get(handler.textDocument.uri);
    return document && document.languageId === 'malloy'
      ? getMalloySymbols(document)
      : [];
  });

  connection.languages.semanticTokens.on(handler => {
    const document = documents.get(handler.textDocument.uri);
    return document && document.languageId === 'malloy'
      ? stubMalloyHighlights(document)
      : new SemanticTokensBuilder().build();
  });

  connection.onCodeLens(async handler => {
    const document = documents.get(handler.textDocument.uri);
    if (document && document.languageId === 'malloy') {
      return await getMalloyLenses(connection, document);
    }
    return [];
  });

  connection.onRequest(
    'malloy/findLensesAt',
    async ({uri, position}: {uri: string; position: Position}) => {
      const document = documents.get(uri);
      if (document && position) {
        return await findMalloyLensesAt(connection, document, position);
      } else {
        return [];
      }
    }
  );

  connection.onDefinition(handler => {
    const document = documents.get(handler.textDocument.uri);
    return document && document.languageId === 'malloy'
      ? getMalloyDefinitionReference(translateCache, document, handler.position)
      : [];
  });

  connection.onDidChangeConfiguration(change => {
    onDidChangeConfiguration?.(change);
    connectionManager.setConnectionsConfig(
      (change?.settings as any)?.malloy?.connections ?? []
    );
    haveConnectionsBeenSet = true;
    documents.all().forEach(debouncedDiagnoseDocument);
  });

  // This handler provides the initial list of the completion items.
  connection.onCompletion(async (params): Promise<CompletionItem[]> => {
    const document = documents.get(params.textDocument.uri);
    if (document && document.languageId === 'malloy') {
      const completionItems = await getCompletionItems(
        document,
        params,
        translateCache
      );
      return completionItems;
    } else {
      return [];
    }
  });

  // This handler resolves additional information for the item selected in
  // the completion list.
  connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
    return resolveCompletionItem(item);
  });

  connection.onHover((params: HoverParams): Hover | null => {
    const document = documents.get(params.textDocument.uri);

    return document && document.languageId === 'malloy'
      ? getHover(document, params)
      : null;
  });

  documents.listen(connection);

  connection.listen();
};
