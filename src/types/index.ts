// Type definitions for the order book application
import { OrderSide } from '../core/enums/order/OrderSide'
import { OrderBookUpdateType } from '../core/enums/order/OrderBookUpdateType'
import { StatusChangeEnum } from '../core/enums/system/StatusChangeEnum'

/** 報價元組類型，表示價格和數量的字符串對 [價格, 數量] */
export type QuoteTuple = [string, string]

/** 解析後的訂單數據接口 */
export interface OrderParsed {
  asks: QuoteTuple[]           // 賣單列表
  bids: QuoteTuple[]           // 買單列表
  seqNum: number               // 當前序號
  prevSeqNum: number          // 前一個序號
  type: OrderBookUpdateType    // 更新類型(快照/增量)
  timestamp: number           // 時間戳
  symbol: string              // 交易對符號
}

/** 訂單簿條目接口 */
export interface OrderBookEntry {
  price: number               // 價格
  size: number               // 數量
  total: number              // 累計數量
}

/** 訂單簿數據接口 */
export interface OrderBookData {
  asks: OrderBookEntry[]      // 賣單列表
  bids: OrderBookEntry[]      // 買單列表
}

/** 交易數據接口 */
export interface TradeData {
  price: number              // 成交價格
  side: OrderSide           // 交易方向(買/賣)
  size: number              // 成交數量
  symbol: string            // 交易對符號
  timestamp: number         // 成交時間戳
  tradeId: number          // 交易ID
}

/** 交易狀態接口 */
export interface TradeStatus {
  status: StatusChangeEnum   // 價格變化狀態(上漲/下跌/不變)
  price: number             // 當前價格
  side: OrderSide | undefined // 交易方向(買/賣)
}

// Re-export enums for convenience
export { OrderSide, OrderBookUpdateType, StatusChangeEnum } 