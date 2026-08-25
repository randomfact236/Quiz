import { getItem, setItem, removeItem } from '@/lib/storage';

describe('storage wrapper', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('set/get round-trips JSON values', () => {
    setItem('test:key', { a: 1 });
    expect(getItem('test:key', null)).toEqual({ a: 1 });
  });

  it('removeItem clears the key', () => {
    setItem('test:key', 'x');
    removeItem('test:key');
    expect(getItem('test:key', 'default')).toBe('default');
  });
});
