import {TrinoConnection} from '@malloydata/db-trino';
import {
  TrinoConnectionConfig,
  ConfigOptions,
} from '../connection_manager_types';

export const createTrinoConnection = async (
  connectionConfig: TrinoConnectionConfig,
  {rowLimit}: ConfigOptions
): Promise<TrinoConnection> => {
  const config = {
    username: connectionConfig.username,
    server: connectionConfig.server,
    password: connectionConfig.password,
    catalog: connectionConfig.catalog,
    schema: connectionConfig.schema,
    source: connectionConfig.source,
  };
  const connection = new TrinoConnection(
    connectionConfig.name,
    () => ({rowLimit}),
    config
  );
  return connection;
};
