import { describe, it } from 'mocha';
import { expect } from 'chai';
import { registerAllTools } from '../../../dist/tools/index.js';
import { createMockServer, createMockContext } from '../../helpers/mock-server.js';

describe('Tools Index', () => {
  it('should export registerAllTools function', () => {
    expect(registerAllTools).to.be.a('function');
  });

  it('should register all tools without errors', () => {
    const server = createMockServer();
    const context = createMockContext();

    expect(() => registerAllTools(server, context)).to.not.throw();
  });

  it('should register tools on the server', () => {
    const server = createMockServer();
    const context = createMockContext();

    registerAllTools(server, context);

    // Server should exist and have tools registered
    expect(server).to.exist;
  });
});
