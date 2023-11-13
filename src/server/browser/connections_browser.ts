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
  createConnection,
  BrowserMessageReader,
  BrowserMessageWriter,
} from 'vscode-languageserver/browser';
import {ConnectionManager} from '../../common/connection_manager';
import {WebConnectionFactory} from '../../common/connections/browser/connection_factory';
import {errorMessage} from '../../common/errors';

const messageReader = new BrowserMessageReader(self as unknown as Worker);
const messageWriter = new BrowserMessageWriter(self as unknown as Worker);

export const connection = createConnection(messageReader, messageWriter);

const fetchBinaryFile = async (uri: string): Promise<Uint8Array> => {
  try {
    connection.console.info(`fetchBinaryFile requesting ${uri}`);
    return await connection.sendRequest('malloy/fetchBinaryFile', {uri});
  } catch (error) {
    connection.console.error(errorMessage(error));
    throw new Error(
      `fetchBinaryFile: unable to load '${uri}': ${errorMessage(error)}`
    );
  }
};

export const connectionManager = new ConnectionManager(
  new WebConnectionFactory(fetchBinaryFile),
  []
);
