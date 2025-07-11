// Type definitions for the order book application
import { OrderSide } from '../core/enums/order/OrderSide'
import { OrderBookUpdateType } from '../core/enums/order/OrderBookUpdateType'
import { StatusChangeEnum } from '../core/enums/system/StatusChangeEnum'

export type QuoteTuple = [string, string]

export interface OrderParsed {
  asks: QuoteTuple[]
  bids: QuoteTuple[]
  seqNum: number
  prevSeqNum: number
  type: OrderBookUpdateType
  timestamp: number
  symbol: string
}

export interface OrderBookEntry {
  price: number
  size: number
  total: number
}

export interface OrderBookData {
  asks: OrderBookEntry[]
  bids: OrderBookEntry[]
}

export interface TradeData {
  price: number
  side: OrderSide
  size: number
  symbol: string
  timestamp: number
  tradeId: number
}

export interface TradeStatus {
  status: StatusChangeEnum
  price: number
  side: OrderSide | undefined
}

// Re-export enums for convenience
export { OrderSide, OrderBookUpdateType, StatusChangeEnum } 