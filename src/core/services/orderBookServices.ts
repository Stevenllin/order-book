
export interface OrderBookEntry {
  price: number;
  size: number;
  total: number;
}

export interface OrderBookData {
  asks: OrderBookEntry[];
  bids: OrderBookEntry[];
}

/**
 * 將原始訂單簿數據轉換為包含累計總量的格式
 * @param rawData 原始數據，格式為 [price, size][]
 * @param isAsk 是否為賣單（asks），用於決定排序方向
 * @returns 包含累計總量的訂單簿條目數組
 */
export function processOrderBookData(rawData: [string, string][], isAsk: boolean = false): OrderBookEntry[] {
  // 先轉換為 OrderBookEntry 格式
  const entries = rawData.map(([priceStr, sizeStr]) => {
    const price = parseFloat(priceStr);
    const size = parseFloat(sizeStr);
    
    return {
      price,
      size,
      total: 0 // 暫時設為 0，稍後計算
    };
  });

  // 按價格排序
  if (isAsk) {
    // Asks: 從低價到高價排序
    entries.sort((a, b) => a.price - b.price);
  } else {
    // Bids: 從高價到低價排序
    entries.sort((a, b) => b.price - a.price);
  }

  // 計算累計總量
  let runningTotal = 0;
  entries.forEach(entry => {
    runningTotal += entry.size;
    entry.total = runningTotal;
  });

  return entries;
}

/**
 * 增量更新訂單簿數據
 * @param existingData 現有的訂單簿數據
 * @param newRawData 新的原始數據
 * @param isAsk 是否為賣單（asks），用於決定排序方向
 * @returns 更新後的訂單簿數據
 */
export function updateOrderBookData(
  existingData: OrderBookEntry[],
  newRawData: [string, string][],
  isAsk: boolean = false
): OrderBookEntry[] {
  // 創建價格到條目的映射，方便快速查找和更新
  const priceMap = new Map<number, OrderBookEntry>();
  
  // 先將現有數據加入映射
  existingData.forEach(entry => {
    priceMap.set(entry.price, { ...entry });
  });
  
  // 更新或添加新數據
  newRawData.forEach(([priceStr, sizeStr]) => {
    const price = parseFloat(priceStr);
    const size = parseFloat(sizeStr);
    
    if (size === 0) {
      // 如果數量為0，移除該價格條目
      priceMap.delete(price);
    } else {
      // 更新或新增條目
      priceMap.set(price, {
        price,
        size,
        total: 0 // 暫時設為 0，稍後重新計算累計總量
      });
    }
  });
  
  // 轉換回數組並按價格排序
  const updatedData = Array.from(priceMap.values()).sort((a, b) => 
    isAsk ? a.price - b.price : b.price - a.price
  );

  // 重新計算累計總量
  return updatedData.reduce((acc, entry) => {
    entry.total = (acc[acc.length - 1]?.total || 0) + entry.size;
    acc.push(entry);
    return acc;
  }, [] as OrderBookEntry[]);
}

/**
 * 增量更新完整的訂單簿數據（包含 asks 和 bids）
 * @param existingData 現有的完整訂單簿數據
 * @param newData 新的原始數據
 * @returns 更新後的完整訂單簿數據
 */
export function updateFullOrderBook(
  existingData: OrderBookData,
  newData: {
    asks: [string, string][];
    bids: [string, string][];
  }
): OrderBookData {
  return {
    asks: updateOrderBookData(existingData.asks, newData.asks, true), // isAsk = true
    bids: updateOrderBookData(existingData.bids, newData.bids, false) // isAsk = false
  };
}

/**
 * 處理完整的訂單簿數據（包含 asks 和 bids）
 * @param data 包含 asks 和 bids 的原始數據
 * @returns 處理後的訂單簿數據
 */
export function processFullOrderBook(data: {
  asks: [string, string][];
  bids: [string, string][];
}): OrderBookData {
  return {
    asks: processOrderBookData(data.asks, true), // isAsk = true
    bids: processOrderBookData(data.bids, false) // isAsk = false
  };
}
