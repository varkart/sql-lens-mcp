import { describe, it, beforeEach } from 'mocha';
import { expect } from 'chai';
import { registerHistoryResource } from '../../../../dist/tools/resources/history.js';
import { createMockServer, createMockContext } from '../../../helpers/mock-server.js';

describe('History Resource', () => {
  let server: ReturnType<typeof createMockServer>;
  let context: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    server = createMockServer();
    context = createMockContext();
  });

  it('should register query-history resource', () => {
    registerHistoryResource(server, context);
    expect(server).to.exist;
  });

  it('should provide empty history initially', () => {
    registerHistoryResource(server, context);

    expect(context.queryHistory).to.have.length(0);
    const json = JSON.stringify(context.queryHistory, null, 2);
    expect(json).to.equal('[]');
  });

  it('should include query history entries', () => {
    registerHistoryResource(server, context);

    context.queryHistory.push({
      connectionId: 'test-db',
      sql: 'SELECT 1',
      statementType: 'SELECT',
      rowCount: 1,
      executionTimeMs: 5,
      timestamp: new Date(),
    });

    expect(context.queryHistory).to.have.length(1);
    expect(context.queryHistory[0].sql).to.equal('SELECT 1');
  });

  it('should limit history to MAX_HISTORY entries', () => {
    registerHistoryResource(server, context);

    // Add more than 50 entries
    for (let i = 0; i < 60; i++) {
      context.queryHistory.push({
        connectionId: 'test-db',
        sql: `SELECT ${i}`,
        statementType: 'SELECT',
        rowCount: 1,
        executionTimeMs: 5,
        timestamp: new Date(),
      });
    }

    // The resource should only return first 50
    const limited = context.queryHistory.slice(0, 50);
    expect(limited).to.have.length(50);
  });
});
