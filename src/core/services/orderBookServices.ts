
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
 * @returns 包含累計總量的訂單簿條目數組
 */
export function processOrderBookData(rawData: [string, string][]): OrderBookEntry[] {
  return rawData.map(([priceStr, sizeStr]) => {
    const price = parseFloat(priceStr);
    const size = parseFloat(sizeStr);
    
    // 初始數據：total = size（因為沒有歷史數據）
    return {
      price,
      size,
      total: size
    };
  });
}

/**
 * 增量更新訂單簿數據
 * @param existingData 現有的訂單簿數據
 * @param newRawData 新的原始數據
 * @returns 更新後的訂單簿數據
 */
export function updateOrderBookData(
  existingData: OrderBookEntry[],
  newRawData: [string, string][]
): OrderBookEntry[] {
  // 創建價格到條目的映射，方便快速查找和更新
  const priceMap = new Map<number, OrderBookEntry>();
  
  // 先將現有數據加入映射（保留歷史 total）
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
      // 獲取現有條目（如果存在）
      const existingEntry = priceMap.get(price);
      
      if (existingEntry) {
        // 更新現有條目：保留歷史 total，更新 size
        priceMap.set(price, {
          price,
          size,
          total: existingEntry.total + size // 歷史 total + 新的 size
        });
      } else {
        // 新增條目：total = size
        priceMap.set(price, {
          price,
          size,
          total: size
        });
      }
    }
  });
  
  // 轉換回數組並按價格排序
  const updatedData = Array.from(priceMap.values());
  
  return updatedData;
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
    asks: updateOrderBookData(existingData.asks, newData.asks),
    bids: updateOrderBookData(existingData.bids, newData.bids)
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
    asks: processOrderBookData(data.asks),
    bids: processOrderBookData(data.bids)
  };
}

/**
 * 計算價格變化百分比
 * @param currentPrice 當前價格
 * @param previousPrice 之前價格
 * @returns 變化百分比
 */
export function calculatePriceChange(currentPrice: number, previousPrice: number): number {
  if (previousPrice === 0) return 0;
  return ((currentPrice - previousPrice) / previousPrice) * 100;
}
