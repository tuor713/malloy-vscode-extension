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

import {CSVWriter, JSONWriter, Result, WriteStream} from '@malloydata/malloy';
import {
  QueryDownloadMessage,
  QueryDownloadOptions,
  QueryDownloadStatus,
  downloadProgress,
} from '../../common/message_types';

import * as vscode from 'vscode';
import {Utils} from 'vscode-uri';
import {QuerySpec} from '../../common/query_spec';
import {MessageDownload} from '../../common/worker_message_types';
import {MALLOY_EXTENSION_STATE} from '../state';
import {Disposable} from 'vscode-jsonrpc';
import {WorkerConnection} from '../worker_connection';
import {errorMessage} from '../../common/errors';
import {noAwait} from '../../util/no_await';
import {getMalloyConfig} from '../utils';

/**
 * VSCode doesn't support streaming writes, so fake it.
 */

class VSCodeWriteStream implements WriteStream {
  contents = '';

  constructor(private uri: vscode.Uri) {}

  async close() {
    noAwait(
      vscode.workspace.fs.writeFile(
        this.uri,
        new TextEncoder().encode(this.contents)
      )
    );
  }

  async write(chunk?: string) {
    this.contents = this.contents += chunk;
    return Promise.resolve(undefined);
  }
}

const sendDownloadMessage = (
  worker: WorkerConnection,
  cancellationToken: vscode.CancellationToken,
  query: QuerySpec,
  panelId: string,
  name: string,
  downloadUri: string,
  downloadOptions: QueryDownloadOptions
) => {
  const message: MessageDownload = {
    query,
    panelId,
    downloadUri,
    downloadOptions,
  };
  return worker.sendRequest('malloy/download', message, cancellationToken);
};

export async function queryDownload(
  worker: WorkerConnection,
  query: QuerySpec,
  downloadOptions: QueryDownloadOptions,
  currentResults: Result,
  panelId: string,
  name: string
): Promise<void> {
  const configDownloadPath = getMalloyConfig().get('downloadsPath');
  let downloadPath =
    configDownloadPath && typeof configDownloadPath === 'string'
      ? configDownloadPath
      : '~/Downloads';

  const homeUri = MALLOY_EXTENSION_STATE.getHomeUri();
  if (homeUri) {
    downloadPath = downloadPath.replace(/^~/, homeUri.fsPath);
  }
  const downloadPathUri = vscode.Uri.file(downloadPath);
  try {
    const stat = await vscode.workspace.fs.stat(downloadPathUri);
    if (!(stat.type & vscode.FileType.Directory)) {
      noAwait(
        vscode.window.showErrorMessage(
          `Download path ${downloadPath} is not a directory.`
        )
      );
      return;
    }
  } catch (error) {
    console.error(error);
    noAwait(
      vscode.window.showErrorMessage(
        `Download path ${downloadPath} is not accessible.`
      )
    );
    return;
  }

  const fileExtension = downloadOptions.format === 'json' ? 'json' : 'csv';
  const fileUri = await dedupeFileName(downloadPathUri, name, fileExtension);
  noAwait(
    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Malloy Download (${name})`,
        cancellable: true,
      },
      async (progress, cancellationToken) => {
        const subscriptions: Disposable[] = [];

        try {
          if (downloadOptions.amount === 'current') {
            const writeStream = new VSCodeWriteStream(fileUri);
            const writer =
              downloadOptions.format === 'json'
                ? new JSONWriter(writeStream)
                : new CSVWriter(writeStream);
            const rowStream = currentResults.data.inMemoryStream();
            await writer.process(rowStream);
            writeStream.close();
            noAwait(
              vscode.window.showInformationMessage(
                `Malloy Download (${name}): Complete`
              )
            );
          } else {
            const listener = (msg: QueryDownloadMessage) => {
              switch (msg.status) {
                case QueryDownloadStatus.Compiling:
                  progress.report({increment: 20, message: 'Compiling'});
                  break;
                case QueryDownloadStatus.Running:
                  progress.report({increment: 40, message: 'Running'});
                  break;
              }
            };
            subscriptions.push(
              worker.onProgress(downloadProgress, panelId, listener)
            );
            await sendDownloadMessage(
              worker,
              cancellationToken,
              query,
              panelId,
              name,
              fileUri.toString(),
              downloadOptions
            );
            noAwait(
              vscode.window.showInformationMessage(
                `Malloy Download (${name}): Complete`
              )
            );
          }
        } catch (error) {
          noAwait(
            vscode.window.showErrorMessage(
              `Malloy Download (${name}): Error\n${errorMessage(error)}`
            )
          );
        } finally {
          subscriptions.forEach(subscription => subscription.dispose());
        }
      }
    )
  );
}

async function dedupeFileName(uri: vscode.Uri, name: string, ext: string) {
  let index = 0;
  let attempt = Utils.joinPath(uri, `${name}.${ext}`);
  try {
    let stat: vscode.FileStat | null = await vscode.workspace.fs.stat(attempt);
    while (stat) {
      attempt = Utils.joinPath(uri, `${name} ${++index}.${ext}`);
      try {
        stat = await vscode.workspace.fs.stat(attempt);
      } catch {
        stat = null;
      }
    }
  } catch {
    // Hopefully nothing bad...
  }
  return attempt;
}
