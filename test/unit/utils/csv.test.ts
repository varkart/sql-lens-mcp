import { describe, it } from 'mocha';
import { expect } from 'chai';
import { toCsv } from '../../../dist/utils/csv.js';
import type { ColumnInfo } from '../../../dist/utils/types.js';

const cols = (...names: string[]): ColumnInfo[] => names.map(name => ({ name, type: 'text' }));

describe('CSV Export', () => {
  it('should render header and rows', () => {
    const csv = toCsv(cols('id', 'name'), [
      { id: 1, name: 'alice' },
      { id: 2, name: 'bob' },
    ]);
    expect(csv).to.equal('id,name\n1,alice\n2,bob\n');
  });

  it('should render only the header for empty results', () => {
    expect(toCsv(cols('id', 'name'), [])).to.equal('id,name\n');
  });

  it('should quote fields containing commas', () => {
    const csv = toCsv(cols('v'), [{ v: 'a,b' }]);
    expect(csv).to.equal('v\n"a,b"\n');
  });

  it('should escape double quotes by doubling them', () => {
    const csv = toCsv(cols('v'), [{ v: 'say "hi"' }]);
    expect(csv).to.equal('v\n"say ""hi"""\n');
  });

  it('should quote fields containing newlines and carriage returns', () => {
    const csv = toCsv(cols('v'), [{ v: 'line1\nline2' }, { v: 'a\r\nb' }]);
    expect(csv).to.equal('v\n"line1\nline2"\n"a\r\nb"\n');
  });

  it('should quote column names that need escaping', () => {
    const csv = toCsv(cols('a,b'), [{ 'a,b': 1 }]);
    expect(csv).to.equal('"a,b"\n1\n');
  });

  it('should render null and undefined as empty fields', () => {
    const csv = toCsv(cols('a', 'b', 'c'), [{ a: null, b: undefined, c: 3 }]);
    expect(csv).to.equal('a,b,c\n,,3\n');
  });

  it('should render dates as ISO strings and objects as JSON', () => {
    const csv = toCsv(cols('d', 'o'), [
      { d: new Date('2026-01-02T03:04:05.000Z'), o: { k: 'v' } },
    ]);
    expect(csv).to.equal('d,o\n2026-01-02T03:04:05.000Z,"{""k"":""v""}"\n');
  });
});
