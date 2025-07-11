import { describe, it, expect } from 'vitest';
import { processOrderBookData, updateOrderBookData, updateFullOrderBook, processFullOrderBook } from './orderBookServices';

describe('processOrderBookData', () => {
  it('should process empty array correctly', () => {
    const result = processOrderBookData([]);
    expect(result).toEqual([]);
  });

  it('should process single order correctly', () => {
    const rawData = [['100.5', '10.25']];
    const result = processOrderBookData(rawData);
    
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      price: 100.5,
      size: 10.25,
      total: 10.25
    });
  });

  it('should process multiple orders correctly', () => {
    const rawData = [
      ['100.0', '5.0'],
      ['101.0', '3.0'],
      ['102.0', '2.0']
    ];
    const result = processOrderBookData(rawData);
    
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      price: 100.0,
      size: 5.0,
      total: 5.0
    });
    expect(result[1]).toEqual({
      price: 101.0,
      size: 3.0,
      total: 3.0
    });
    expect(result[2]).toEqual({
      price: 102.0,
      size: 2.0,
      total: 2.0
    });
  });

  it('should handle string numbers with decimals', () => {
    const rawData = [
      ['1234.5678', '987.6543'],
      ['0.001', '0.999']
    ];
    const result = processOrderBookData(rawData);
    
    expect(result[0]).toEqual({
      price: 1234.5678,
      size: 987.6543,
      total: 987.6543
    });
    expect(result[1]).toEqual({
      price: 0.001,
      size: 0.999,
      total: 0.999
    });
  });

  it('should handle zero values correctly', () => {
    const rawData = [
      ['0', '0'],
      ['100', '0'],
      ['0', '100']
    ];
    const result = processOrderBookData(rawData);
    
    expect(result[0]).toEqual({
      price: 0,
      size: 0,
      total: 0
    });
    expect(result[1]).toEqual({
      price: 100,
      size: 0,
      total: 0
    });
    expect(result[2]).toEqual({
      price: 0,
      size: 100,
      total: 100
    });
  });

  it('should handle large numbers correctly', () => {
    const rawData = [
      ['999999.99', '1234567.89'],
      ['0.000001', '999999999.999999']
    ];
    const result = processOrderBookData(rawData);
    
    expect(result[0]).toEqual({
      price: 999999.99,
      size: 1234567.89,
      total: 1234567.89
    });
    expect(result[1]).toEqual({
      price: 0.000001,
      size: 999999999.999999,
      total: 999999999.999999
    });
  });

  it('should maintain order of input data', () => {
    const rawData = [
      ['100', '1'],
      ['200', '2'],
      ['300', '3']
    ];
    const result = processOrderBookData(rawData);
    
    expect(result[0].price).toBe(100);
    expect(result[1].price).toBe(200);
    expect(result[2].price).toBe(300);
  });
});

describe('updateFullOrderBook', () => {
  it('should return empty order book when both inputs are empty', () => {
    const existingData = {
      asks: [],
      bids: []
    };
    const newData = {
      asks: [],
      bids: []
    };
    const result = updateFullOrderBook(existingData, newData);
    
    expect(result.asks).toEqual([]);
    expect(result.bids).toEqual([]);
  });

  it('should update asks and bids correctly', () => {
    const existingData = {
      asks: [
        { price: 100, size: 10, total: 10 },
        { price: 101, size: 5, total: 15 }
      ],
      bids: [
        { price: 99, size: 8, total: 8 },
        { price: 98, size: 12, total: 20 }
      ]
    };
    const newData = {
      asks: [
        ['100', '15'],  // 更新 asks
        ['102', '8']    // 新增 asks
      ],
      bids: [
        ['99', '10'],   // 更新 bids
        ['97', '5']     // 新增 bids
      ]
    };
    const result = updateFullOrderBook(existingData, newData);
    
    // 檢查 asks
    expect(result.asks).toHaveLength(3);
    expect(result.asks.find(entry => entry.price === 100)).toEqual({
      price: 100,
      size: 15,
      total: 25  // 10 + 15
    });
    expect(result.asks.find(entry => entry.price === 102)).toEqual({
      price: 102,
      size: 8,
      total: 8
    });
    
    // 檢查 bids
    expect(result.bids).toHaveLength(3);
    expect(result.bids.find(entry => entry.price === 99)).toEqual({
      price: 99,
      size: 10,
      total: 18  // 8 + 10
    });
    expect(result.bids.find(entry => entry.price === 97)).toEqual({
      price: 97,
      size: 5,
      total: 5
    });
  });

  it('should handle empty asks or bids', () => {
    const existingData = {
      asks: [{ price: 100, size: 10, total: 10 }],
      bids: []
    };
    const newData = {
      asks: [],
      bids: [['99', '5']]
    };
    const result = updateFullOrderBook(existingData, newData);
    
    expect(result.asks).toEqual(existingData.asks);
    expect(result.bids).toHaveLength(1);
    expect(result.bids[0]).toEqual({
      price: 99,
      size: 5,
      total: 5
    });
  });

  it('should remove entries when size is zero', () => {
    const existingData = {
      asks: [
        { price: 100, size: 10, total: 10 },
        { price: 101, size: 5, total: 15 }
      ],
      bids: [
        { price: 99, size: 8, total: 8 },
        { price: 98, size: 12, total: 20 }
      ]
    };
    const newData = {
      asks: [['100', '0']],  // 移除 asks 中的價格 100
      bids: [['98', '0']]    // 移除 bids 中的價格 98
    };
    const result = updateFullOrderBook(existingData, newData);
    
    // 檢查 asks
    expect(result.asks).toHaveLength(1);
    expect(result.asks.find(entry => entry.price === 100)).toBeUndefined();
    expect(result.asks.find(entry => entry.price === 101)).toBeDefined();
    
    // 檢查 bids
    expect(result.bids).toHaveLength(1);
    expect(result.bids.find(entry => entry.price === 98)).toBeUndefined();
    expect(result.bids.find(entry => entry.price === 99)).toBeDefined();
  });
});

describe('processFullOrderBook', () => {
  it('should return empty order book when both inputs are empty', () => {
    const data = {
      asks: [],
      bids: []
    };
    const result = processFullOrderBook(data);
    
    expect(result.asks).toEqual([]);
    expect(result.bids).toEqual([]);
  });

  it('should process asks and bids correctly', () => {
    const data = {
      asks: [
        ['100.5', '10.25'],
        ['101.0', '5.5']
      ],
      bids: [
        ['99.5', '8.75'],
        ['98.0', '12.25']
      ]
    };
    const result = processFullOrderBook(data);
    
    // 檢查 asks
    expect(result.asks).toHaveLength(2);
    expect(result.asks[0]).toEqual({
      price: 100.5,
      size: 10.25,
      total: 10.25
    });
    expect(result.asks[1]).toEqual({
      price: 101.0,
      size: 5.5,
      total: 5.5
    });
    
    // 檢查 bids
    expect(result.bids).toHaveLength(2);
    expect(result.bids[0]).toEqual({
      price: 99.5,
      size: 8.75,
      total: 8.75
    });
    expect(result.bids[1]).toEqual({
      price: 98.0,
      size: 12.25,
      total: 12.25
    });
  });

  it('should handle empty asks or bids', () => {
    const data = {
      asks: [
        ['100', '10'],
        ['101', '5']
      ],
      bids: []
    };
    const result = processFullOrderBook(data);
    
    expect(result.asks).toHaveLength(2);
    expect(result.bids).toEqual([]);
  });

  it('should handle single entries', () => {
    const data = {
      asks: [['100', '10']],
      bids: [['99', '8']]
    };
    const result = processFullOrderBook(data);
    
    expect(result.asks).toHaveLength(1);
    expect(result.bids).toHaveLength(1);
    expect(result.asks[0]).toEqual({
      price: 100,
      size: 10,
      total: 10
    });
    expect(result.bids[0]).toEqual({
      price: 99,
      size: 8,
      total: 8
    });
  });

  it('should handle decimal values correctly', () => {
    const data = {
      asks: [
        ['1234.5678', '987.6543'],
        ['0.001', '0.999']
      ],
      bids: [
        ['999999.99', '1234567.89'],
        ['0.000001', '999999999.999999']
      ]
    };
    const result = processFullOrderBook(data);
    
    // 檢查 asks
    expect(result.asks[0]).toEqual({
      price: 1234.5678,
      size: 987.6543,
      total: 987.6543
    });
    expect(result.asks[1]).toEqual({
      price: 0.001,
      size: 0.999,
      total: 0.999
    });
    
    // 檢查 bids
    expect(result.bids[0]).toEqual({
      price: 999999.99,
      size: 1234567.89,
      total: 1234567.89
    });
    expect(result.bids[1]).toEqual({
      price: 0.000001,
      size: 999999999.999999,
      total: 999999999.999999
    });
  });
});

describe('updateOrderBookData', () => {
  it('should return empty array when both inputs are empty', () => {
    const result = updateOrderBookData([], []);
    expect(result).toEqual([]);
  });

  it('should return existing data when new data is empty', () => {
    const existingData = [
      { price: 100, size: 10, total: 10 },
      { price: 101, size: 5, total: 15 }
    ];
    const result = updateOrderBookData(existingData, []);
    expect(result).toEqual(existingData);
  });

  it('should add new entries when existing data is empty', () => {
    const newData = [
      ['100', '10'],
      ['101', '5']
    ];
    const result = updateOrderBookData([], newData);
    
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      price: 100,
      size: 10,
      total: 10
    });
    expect(result[1]).toEqual({
      price: 101,
      size: 5,
      total: 5
    });
  });

  it('should update existing entries correctly', () => {
    const existingData = [
      { price: 100, size: 10, total: 10 },
      { price: 101, size: 5, total: 15 }
    ];
    const newData = [
      ['100', '15'],  // 更新價格 100 的數量
      ['102', '8']    // 新增價格 102
    ];
    const result = updateOrderBookData(existingData, newData);
    
    expect(result).toHaveLength(3);
    expect(result.find(entry => entry.price === 100)).toEqual({
      price: 100,
      size: 15,
      total: 25  // 10 + 15
    });
    expect(result.find(entry => entry.price === 101)).toEqual({
      price: 101,
      size: 5,
      total: 15
    });
    expect(result.find(entry => entry.price === 102)).toEqual({
      price: 102,
      size: 8,
      total: 8
    });
  });

  it('should remove entries when size is zero', () => {
    const existingData = [
      { price: 100, size: 10, total: 10 },
      { price: 101, size: 5, total: 15 },
      { price: 102, size: 8, total: 23 }
    ];
    const newData = [
      ['101', '0'],  // 移除價格 101
      ['103', '12']  // 新增價格 103
    ];
    const result = updateOrderBookData(existingData, newData);
    
    expect(result).toHaveLength(3);
    expect(result.find(entry => entry.price === 100)).toBeDefined();
    expect(result.find(entry => entry.price === 101)).toBeUndefined();
    expect(result.find(entry => entry.price === 102)).toBeDefined();
    expect(result.find(entry => entry.price === 103)).toEqual({
      price: 103,
      size: 12,
      total: 12
    });
  });

  it('should handle multiple updates to same price with total accumulation', () => {
    const existingData = [
      { price: 100, size: 10, total: 10 }
    ];
    const newData = [
      ['100', '5'],   // 第一次更新：total = 10 + 5 = 15
      ['100', '20'],  // 第二次更新：total = 15 + 20 = 35
      ['100', '15']   // 第三次更新：total = 35 + 15 = 50
    ];
    const result = updateOrderBookData(existingData, newData);
    
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      price: 100,
      size: 15,  // 最後一次更新的 size
      total: 50  // 累積的 total：10 + 5 + 20 + 15
    });
  });

  it('should handle decimal values correctly', () => {
    const existingData = [
      { price: 100.5, size: 10.25, total: 10.25 }
    ];
    const newData = [
      ['100.5', '5.75'],
      ['101.25', '3.5']
    ];
    const result = updateOrderBookData(existingData, newData);
    
    expect(result).toHaveLength(2);
    expect(result.find(entry => entry.price === 100.5)).toEqual({
      price: 100.5,
      size: 5.75,
      total: 16.0  // 10.25 + 5.75
    });
    expect(result.find(entry => entry.price === 101.25)).toEqual({
      price: 101.25,
      size: 3.5,
      total: 3.5
    });
  });
});
