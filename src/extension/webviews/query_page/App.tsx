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
  Explore,
  Field,
  NamedQuery,
  QueryField,
  Result,
} from '@malloydata/malloy';
import {HTMLView} from '@malloydata/render';
import React, {
  DOMElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import styled from 'styled-components';
import {
  QueryRunStatus,
  QueryRunStats,
  QueryMessageStatus,
  QueryMessageType,
} from '../../../common/message_types';
import {Spinner} from '../components';
import {
  ResultKind,
  ResultKindToggle,
  resultKindFromString,
} from './ResultKindToggle';
import Prism from 'prismjs';
import {useQueryVSCodeContext} from './query_vscode_context';
import {DownloadButton} from './DownloadButton';
import {CopyButton} from './CopyButton';
import {Scroll} from '../components/Scroll';
import {PrismContainer} from '../components/PrismContainer';
import {SchemaRenderer} from '../components/SchemaRenderer';
import {fieldType} from '../../../common/schema';

enum Status {
  Ready = 'ready',
  Compiling = 'compiling',
  Running = 'running',
  Error = 'error',
  Displaying = 'displaying',
  Rendering = 'rendering',
  Done = 'done',
}

interface Results {
  stats?: string;
  html?: HTMLElement;
  sql?: string;
  json?: string;
  schema?: Explore[];
}

interface CurrentStatus {
  status: Status;
  warning?: string;
  error?: string;
}

export const App: React.FC = () => {
  const [status, setStatus] = useState<CurrentStatus>({status: Status.Ready});
  const [results, setResults] = useState<Results>({});
  const [resultKind, setResultKind] = useState<ResultKind>(ResultKind.HTML);

  const [showOnlySQL, setShowOnlySQL] = useState(false);
  const [showOnlySchema, setShowOnlySchema] = useState(false);

  const [darkMode, setDarkMode] = useState(false);
  const [observer, setObserver] = useState<MutationObserver>();

  const [canDownload, setCanDownload] = useState(false);
  const [canDownloadStream, setCanDownloadStream] = useState(false);

  const ref = useRef<HTMLDivElement>(null);

  const vscode = useQueryVSCodeContext();

  useEffect(() => {
    vscode.postMessage({type: QueryMessageType.AppReady});
  }, []);

  const themeCallback = useCallback(() => {
    const themeKind = document.body.dataset['vscodeThemeKind'];
    setDarkMode(themeKind === 'vscode-dark');
  }, []);

  useEffect(() => {
    themeCallback();
    const obs = new MutationObserver(themeCallback);
    setObserver(obs);
  }, [themeCallback, setObserver]);

  useEffect(() => {
    if (!observer) return;
    observer.observe(document.body, {
      attributeFilter: ['data-vscode-theme-kind'],
    });
    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [observer, document.body]);

  useEffect(() => {
    const listener = (event: MessageEvent<QueryMessageStatus>) => {
      const message = event.data;

      if (message.status === QueryRunStatus.Error) {
        setStatus({...status, status: Status.Error, error: message.error});
      }

      if (message.status === QueryRunStatus.Compiled && message.showSQLOnly) {
        const {sql} = message;
        setShowOnlySQL(true);
        if (resultKind === ResultKind.HTML) {
          setResultKind(ResultKind.SQL);
        }
        setStatus({status: Status.Done, error: status.error});
        setResults({sql});
        setResultKind(ResultKind.SQL);
      } else if (message.status === QueryRunStatus.Schema) {
        setShowOnlySchema(true);
        setStatus({status: Status.Done, error: status.error});
        setResults({
          ...results,
          schema: message.schema.map(json => Explore.fromJSON(json)),
        });
        setResultKind(ResultKind.SCHEMA);
      } else if (message.status === QueryRunStatus.EstimatedCost) {
        setResults({
          ...results,
          stats: getQueryCostStats(message.queryCostBytes, true),
          schema: message.schema.map(json => Explore.fromJSON(json)),
        });
      } else if (message.status === QueryRunStatus.Done) {
        const {
          resultJson,
          canDownloadStream,
          defaultTab,
          stats: runStats,
        } = message;
        const defaultKind = resultKindFromString(defaultTab);
        if (defaultKind) {
          setResultKind(defaultKind);
        } else if (resultKind === ResultKind.SQL) {
          setResultKind(ResultKind.HTML);
        }
        // TODO(web) Figure out some way to download current result set
        setCanDownload(canDownloadStream);
        setCanDownloadStream(canDownloadStream);
        setStatus({status: Status.Rendering});
        setTimeout(async () => {
          const result = Result.fromJSON(resultJson);
          const {data, sql} = result;
          const json = JSON.stringify(data.toObject(), null, 2);
          const schema =
            result.resultExplore.name.startsWith('__stage') &&
            result.resultExplore.parentExplore
              ? [result.resultExplore.parentExplore]
              : [result.resultExplore];
          const stats = runStats
            ? getStats(runStats, result.runStats?.queryCostBytes)
            : '';
          const html = await new HTMLView(document).render(result, {
            dataStyles: {},
            isDrillingEnabled: true,
            onDrill: (
              drillQuery: string,
              _target: HTMLElement,
              _drillFilters: string[]
            ) => {
              const status = QueryRunStatus.RunCommand;
              const command = 'malloy.copyToClipboard';
              const args = [drillQuery, 'Query'];
              vscode.postMessage({status, command, args});
            },
          });
          setStatus({status: Status.Displaying});
          setTimeout(() => {
            setResults({json, html, schema, sql, stats});
            if (data.rowCount < result.totalRows) {
              const rowCount = data.rowCount.toLocaleString();
              const totalRows = result.totalRows.toLocaleString();
              setStatus({
                ...status,
                warning: `Row limit hit. Viewing ${rowCount} of ${totalRows} results.`,
                status: Status.Done,
              });
            } else {
              setStatus({...status, status: Status.Done});
            }
          }, 0);
        }, 0);
      } else {
        setResults({html: document.createElement('span')});
        setShowOnlySQL(false);
        setShowOnlySchema(false);
        switch (message.status) {
          case QueryRunStatus.Compiling:
            setStatus({status: Status.Compiling});
            break;
          case QueryRunStatus.Running:
            setStatus({status: Status.Running});
            break;
        }
      }
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  });

  const copyToClipboard = useCallback(() => {
    if (!results) {
      return;
    }
    const {html, json, sql} = results;
    let clipboardData: string | undefined;
    switch (resultKind) {
      case ResultKind.HTML:
        if (html) {
          clipboardData = getStyledHTML(html);
        }
        break;
      case ResultKind.JSON:
        if (json) {
          clipboardData = json;
        }
        break;
      case ResultKind.SQL:
        if (sql) {
          clipboardData = sql;
        }
        break;
    }
    if (clipboardData) {
      const status = QueryRunStatus.RunCommand;
      const command = 'malloy.copyToClipboard';
      const args = [clipboardData, 'Results'];
      vscode.postMessage({status, command, args});
    }
  }, [resultKind, results]);

  const onFieldClick = (field: Field) => {
    const type = fieldType(field);

    if (type !== 'query') {
      const {fieldPath} = field;
      fieldPath.shift();
      const accessPath = fieldPath.join('.');
      const status = QueryRunStatus.RunCommand;
      const command = 'malloy.copyToClipboard';
      const args = [accessPath, 'Path'];
      vscode.postMessage({status, command, args});
    }
  };

  const onQueryClick = (query: NamedQuery | QueryField) => {
    if ('parentExplore' in query) {
      const {fieldPath} = query;
      const exploreName = fieldPath.shift();
      const accessPath = fieldPath.join('.');
      const status = QueryRunStatus.RunCommand;
      const command = 'malloy.runQuery';
      const queryString = `run: ${exploreName}->${accessPath}`;
      const title = `${exploreName}->${accessPath}`;
      const args = [queryString, title];
      vscode.postMessage({status, command, args});
    }
  };

  /*
   * Intercept the context menu click from the schema renderer, and
   * apply context data to the element's `vscode-context` attribute.
   * Then simulate a context click so that VS Code will pick up
   * the context and draw a context menu.
   */
  const onContextClick = (
    event: MouseEvent,
    context: Record<string, unknown>
  ) => {
    event.stopPropagation();
    context = {...context, preventDefaultContextMenuItems: true};
    if (ref.current) {
      ref.current.dataset['vscodeContext'] = JSON.stringify(context);
    }
    ref.current?.dispatchEvent(
      new MouseEvent('contextmenu', {
        clientX: event.clientX,
        clientY: event.clientY,
        bubbles: true,
      })
    );
  };

  return (
    <div
      style={{
        height: '100%',
        margin: '0',
        display: 'flex',
        flexDirection: 'column',
      }}
      ref={ref}
    >
      {[
        Status.Compiling,
        Status.Running,
        Status.Rendering,
        Status.Displaying,
      ].includes(status.status) ? (
        <Spinner text={getStatusLabel(status.status) || ''} />
      ) : (
        ''
      )}
      {!status.error &&
        [Status.Displaying, Status.Done].includes(status.status) && (
          <ResultControlsBar>
            <ResultLabel>
              {showOnlySQL
                ? 'SQL'
                : showOnlySchema
                ? 'SCHEMA'
                : 'QUERY RESULTS'}
            </ResultLabel>
            <ResultControlsItems>
              {!showOnlySchema && (
                <ResultKindToggle
                  kind={resultKind}
                  setKind={setResultKind}
                  showOnlySQL={showOnlySQL}
                />
              )}
              {canDownload && (
                <DownloadButton
                  canStream={canDownloadStream}
                  onDownload={async downloadOptions => {
                    vscode.postMessage({
                      status: QueryRunStatus.StartDownload,
                      downloadOptions,
                    });
                  }}
                />
              )}
            </ResultControlsItems>
          </ResultControlsBar>
        )}
      {!status.error && results.html && resultKind === ResultKind.HTML && (
        <Scroll>
          <div
            style={{padding: '10px', height: '100%', boxSizing: 'border-box'}}
          >
            <CopyButton onClick={copyToClipboard} />
            <DOMElement element={results.html} />
          </div>
        </Scroll>
      )}
      {!status.error && results.json && resultKind === ResultKind.JSON && (
        <Scroll>
          <CopyButton onClick={copyToClipboard} />
          <PrismContainer darkMode={darkMode} style={{margin: '10px'}}>
            <div
              dangerouslySetInnerHTML={{
                __html: Prism.highlight(
                  results.json,
                  Prism.languages['json'],
                  'json'
                ),
              }}
              style={{margin: '10px'}}
            />
          </PrismContainer>
        </Scroll>
      )}
      {!status.error && results.sql && resultKind === ResultKind.SQL && (
        <Scroll>
          <CopyButton onClick={copyToClipboard} />
          <PrismContainer darkMode={darkMode} style={{margin: '10px'}}>
            <div
              dangerouslySetInnerHTML={{
                __html: Prism.highlight(
                  results.sql,
                  Prism.languages['sql'],
                  'sql'
                ),
              }}
              style={{margin: '10px', whiteSpace: 'break-spaces'}}
            />
          </PrismContainer>
        </Scroll>
      )}
      {!status.error && results.schema && resultKind === ResultKind.SCHEMA && (
        <Scroll>
          <SchemaRenderer
            explores={results.schema}
            queries={[]}
            defaultShow={true}
            onFieldClick={onFieldClick}
            onQueryClick={onQueryClick}
            onContextClick={onContextClick}
          />
        </Scroll>
      )}
      {status.error && (
        <Error multiline={status.error.includes('\n')}>{status.error}</Error>
      )}
      {status.warning && <Warning>{status.warning}</Warning>}
      {results.stats && <StatsBar>{results.stats}</StatsBar>}
    </div>
  );
};

function getStatusLabel(status: Status) {
  switch (status) {
    case Status.Compiling:
      return 'Compiling';
    case Status.Running:
      return 'Running';
    case Status.Rendering:
      return 'Rendering';
    case Status.Displaying:
      return 'Displaying';
  }
}

function getStyledHTML(html: HTMLElement): string {
  const resolveStyles = getComputedStyle(html);
  const styles = /* html */ `<style>
  :root {
    --malloy-font-family: ${resolveStyles.getPropertyValue(
      '--malloy-font-family'
    )};
    --malloy-title-color: ${resolveStyles.getPropertyValue(
      '--malloy-title-color'
    )};
    --malloy-label-color: ${resolveStyles.getPropertyValue(
      '--malloy-label-color'
    )};
    --malloy-border-color: ${resolveStyles.getPropertyValue(
      '--malloy-border-color'
    )};
    --malloy-tile-background-color: ${resolveStyles.getPropertyValue(
      '--malloy-tile-background-color'
    )};
  }
  body {
    color: ${resolveStyles.getPropertyValue('--foreground')};
    background: ${resolveStyles.getPropertyValue('--background')};
    font-family: var(--malloy-font-family);
    font-size: 11px;
  }
  table {
    font-size: 11px;
  }
</style>
`;
  return styles + html.outerHTML;
}

function getStats(stats: QueryRunStats, queryCostBytes?: number): string {
  return `Compile Time: ${stats.compileTime.toLocaleString()}s, Run Time: ${stats.runTime.toLocaleString()}s, Total Time: ${stats.totalTime.toLocaleString()}s.${
    getQueryCostStats(queryCostBytes) ?? ''
  }`;
}

function getQueryCostStats(
  queryCostBytes?: number,
  isEstimate?: boolean
): string | undefined {
  return queryCostBytes
    ? ` ${isEstimate ? 'Will process' : 'Processed'} ${(
        queryCostBytes /
        1024 /
        1024
      ).toLocaleString()} MB.`
    : undefined;
}

const DOMElement: React.FC<{element: HTMLElement}> = ({element}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const parent = ref.current;
    if (parent) {
      parent.innerHTML = '';
      parent.appendChild(element);
    }
  }, [element]);

  return <div style={{fontSize: 11, height: '100%'}} ref={ref}></div>;
};

const Warning = styled.div`
  color: var(--vscode-statusBarItem-warningForeground);
  background-color: var(--vscode-statusBarItem-warningBackground);
  font-size: 12px;
  padding: 5px;
`;

const StatsBar = styled.div`
  color: var(--vscode-editorWidget-Foreground);
  background-color: var(--vscode-editorWidget-background);
  font-size: 12px;
  padding: 5px;
`;

interface ErrorProps {
  multiline: boolean;
}

const Error = styled.div<ErrorProps>`
  background-color: var(--vscode-inputValidation-errorBackground);
  padding: 5px;
  white-space: ${props => (props.multiline ? 'pre' : 'normal')};
  font-family: ${props => (props.multiline ? 'monospace' : 'inherit')};
  font-size: var(--vscode-editor-font-size);
`;

const ResultControlsBar = styled.div`
  display: flex;
  border-bottom: 1px solid var(--vscode-panel-border);
  justify-content: space-between;
  align-items: center;
  color: var(--vscode-foreground);
  padding: 0 10px;
  user-select: none;
`;

const ResultLabel = styled.span`
  font-weight: 500;
  font-size: 12px;
  padding: 8px;
`;

const ResultControlsItems = styled.div`
  display: flex;
  align-items: center;
`;
