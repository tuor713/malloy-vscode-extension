import {LitElement, html} from 'lit';
import {
  provideVSCodeDesignSystem,
  vsCodeCheckbox,
  vsCodeRadio,
  vsCodeTextField,
} from '@vscode/webview-ui-toolkit';
import {TrinoConnectionConfig} from '../../../../common/connection_manager_types';
import {customElement, property} from 'lit/decorators.js';
import {styles} from './connection_editor.css';

provideVSCodeDesignSystem().register(
  vsCodeCheckbox(),
  vsCodeRadio(),
  vsCodeTextField()
);

@customElement('trino-connection-editor')
export class TrinoConnectionEditor extends LitElement {
  static override styles = [styles];

  @property({type: Object})
  config!: TrinoConnectionConfig;
  @property()
  setConfig!: (config: TrinoConnectionConfig) => void;

  @property({attribute: false})
  showPassword = false;

  override render() {
    return html`<table>
      <tbody>
        <tr>
          <td class="label-cell">
            <label>Name:</label>
          </td>
          <td>
            <vscode-text-field
              value=${this.config.name}
              @change=${({target: {value}}: {target: HTMLInputElement}) => {
                this.setConfig({...this.config, name: value});
              }}
            ></vscode-text-field>
          </td>
        </tr>
        <tr>
          <td class="label-cell">
            <label>Server:</label>
          </td>
          <td>
            <vscode-text-field
              value=${this.config.server || ''}
              @change=${({target: {value}}: {target: HTMLInputElement}) => {
                this.setConfig({...this.config, server: value});
              }}
            ></vscode-text-field>
          </td>
        </tr>
        <tr>
          <td class="label-cell">
            <label>Catalog:</label>
          </td>
          <td>
            <vscode-text-field
              value=${this.config.catalog || ''}
              @change=${({target: {value}}: {target: HTMLInputElement}) => {
                this.setConfig({...this.config, catalog: value});
              }}
            ></vscode-text-field>
          </td>
        </tr>
        <tr>
          <td class="label-cell">
            <label>Schema:</label>
          </td>
          <td>
            <vscode-text-field
              value=${this.config.schema || ''}
              @change=${({target: {value}}: {target: HTMLInputElement}) => {
                this.setConfig({...this.config, schema: value});
              }}
            ></vscode-text-field>
          </td>
        </tr>
        <tr>
        <td class="label-cell">
          <label>Source:</label>
        </td>
        <td>
          <vscode-text-field
            value=${this.config.source || ''}
            @change=${({target: {value}}: {target: HTMLInputElement}) => {
              this.setConfig({...this.config, source: value});
            }}
          ></vscode-text-field>
        </td>
      </tr>
        <tr>
          <td class="label-cell">
            <label>Username:</label>
          </td>
          <td>
            <vscode-text-field
              value=${this.config.username || ''}
              @change=${({target: {value}}: {target: HTMLInputElement}) => {
                this.setConfig({...this.config, username: value});
              }}
            ></vscode-text-field>
          </td>
        </tr>
        <tr>
          <td class="label-cell">
            <label>Password:</label>
          </td>
          <td>
            ${this.config.useKeychainPassword !== undefined &&
            html`<div>
              <vscode-radio
                value="keychain"
                .checked=${this.config.useKeychainPassword || false}
                @change=${({target}: {target: HTMLInputElement}) => {
                  if (target.checked) {
                    this.setConfig({
                      ...this.config,
                      password: undefined,
                      useKeychainPassword: true,
                    });
                  }
                }}
              >
                Use existing value
              </vscode-radio>
            </div>`}
            <div>
              <vscode-radio
                value="none"
                key="none"
                .checked=${!this.config.useKeychainPassword &&
                this.config.password === undefined}
                @change=${({target}: {target: HTMLInputElement}) => {
                  if (target.checked) {
                    this.setConfig({
                      ...this.config,
                      password: undefined,
                      useKeychainPassword:
                        this.config.useKeychainPassword === undefined
                          ? undefined
                          : false,
                    });
                  }
                }}
              >
                No password
              </vscode-radio>
            </div>
            <div>
              <vscode-radio
                value="specified"
                key="specified"
                .checked=${this.config.password !== undefined}
                @change=${({target}: {target: HTMLInputElement}) => {
                  if (target.checked) {
                    this.setConfig({
                      ...this.config,
                      password: '',
                      useKeychainPassword:
                        this.config.useKeychainPassword === undefined
                          ? undefined
                          : false,
                    });
                  }
                }}
              >
                Enter a password ${this.config.password !== undefined && ':'}
              </vscode-radio>
            </div>
          </td>
        </tr>
        ${this.config.password !== undefined
          ? html`<tr>
              <td></td>
              <td>
                <vscode-text-field
                  value=${this.config.password || ''}
                  @change=${({target: {value}}: {target: HTMLInputElement}) => {
                    this.setConfig({
                      ...this.config,
                      password: value,
                    });
                  }}
                  type=${this.showPassword ? 'text' : 'password'}
                  placeholder="Optional"
                ></vscode-text-field>
              </td>
              <td style="padding-left: 10px">
                <vscode-checkbox
                  .checked=${this.showPassword}
                  @change=${({target}: {target: HTMLInputElement}) => {
                    this.showPassword = target.checked;
                  }}
                >
                  Show Password
                </vscode-checkbox>
              </td>
            </tr>`
          : null}
      </tbody>
    </table>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'trino-connection-editor': TrinoConnectionEditor;
  }
}
