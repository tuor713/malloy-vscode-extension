/*
 * Copyright 2024 Google LLC
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

import {LitElement, css, html} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {QueryDownloadOptions} from '../../../common/message_types';
import '../components/popup_dialog';
import './download_form';

const styles = css`
  .icon {
    padding-top: 3px;
  }

  svg {
    width: 16px;
    height: 16px;
    cursor: pointer;
    padding: 3px;
    border-radius: 5px;
    &:hover {
      background: var(--vscode-toolbar-hoverBackground);
    }
  }
`;

const icon = html`<svg
  width="22px"
  height="22px"
  viewBox="0 0 110 110"
  version="1.1"
>
  <g id="download" transform="translate(8.000000, 9.133308)">
    <path
      d="M19.5833333,78.3333333 L74.4166667,78.3333333 L74.4166667,70.5 L19.5833333,70.5 L19.5833333,78.3333333 Z M74.4166667,35.25 L58.75,35.25 L58.75,11.75 L35.25,11.75 L35.25,35.25 L19.5833333,35.25 L47,62.6666667 L74.4166667,35.25 Z"
      fill-rule="nonzero"
      fill="var(--vscode-icon-foreground)"
    ></path>
  </g>
</svg>`;

@customElement('download-button')
export class DownloadButton extends LitElement {
  static override styles = [styles];

  @property()
  onDownload!: (options: QueryDownloadOptions) => Promise<void>;

  @property({type: Boolean})
  canStream!: boolean;

  @property({attribute: false})
  open = false;

  override render() {
    return html`<div
        class="icon"
        title="Download"
        @click=${() => (this.open = !this.open)}
      >
        ${icon}
      </div>
      <popup-dialog
        ?open=${this.open}
        .setOpen=${(open: boolean) => (this.open = open)}
        style="width: 200px"
      >
        <download-form
          ?canStream=${this.canStream}
          .onDownload=${async (options: QueryDownloadOptions) => {
            this.open = false;
            await this.onDownload(options);
          }}
        ></download-form>
      </popup-dialog>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'download-button': DownloadButton;
  }
}
