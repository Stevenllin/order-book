import { describe, it, expect } from 'vitest';
import { processOrderBookData, updateOrderBookData } from './orderBookServices';

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
