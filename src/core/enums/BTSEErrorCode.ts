export enum BTSEErrorCode {
  MARKET_PAIR_NOT_SUPPORTED = 1000,
  OPERATION_NOT_SUPPORTED = 1001,
  INVALID_REQUEST = 1002,
  TOPIC_NOT_EXIST = 1005,
  USER_MESSAGE_BUFFER_FULL = 1007,
  MAX_FAILED_ATTEMPTS = 1008
}

export const BTSE_ERROR_MESSAGES: Record<BTSEErrorCode, string> = {
  [BTSEErrorCode.MARKET_PAIR_NOT_SUPPORTED]: 'Market pair provided is currently not supported.',
  [BTSEErrorCode.OPERATION_NOT_SUPPORTED]: 'Operation provided is currently not supported.',
  [BTSEErrorCode.INVALID_REQUEST]: 'Invalid request. Please check again your request and provide all information required.',
  [BTSEErrorCode.TOPIC_NOT_EXIST]: 'Topic provided does not exist.',
  [BTSEErrorCode.USER_MESSAGE_BUFFER_FULL]: 'User message buffer is full.',
  [BTSEErrorCode.MAX_FAILED_ATTEMPTS]: 'Reached maximum failed attempts, closing the session.'
}

export interface BTSEError {
  code: BTSEErrorCode;
  message: string;
  timestamp: number;
}

/**
 * 解析BTSE錯誤
 * @param errorData 錯誤數據
 * @returns BTSE錯誤對象
 */
export function parseBTSEError(errorData: any): BTSEError {
  const code = errorData.code || errorData.error || 0;
  const message = errorData.message || BTSE_ERROR_MESSAGES[code as BTSEErrorCode] || 'Unknown error';
  
  return {
    code: code as BTSEErrorCode,
    message,
    timestamp: Date.now()
  };
}

/**
 * 檢查是否為已知的BTSE錯誤代碼
 * @param code 錯誤代碼
 * @returns 是否為已知錯誤
 */
export function isKnownBTSEError(code: number): boolean {
  return Object.values(BTSEErrorCode).includes(code);
}

/**
 * 獲取錯誤處理建議
 * @param error BTSE錯誤
 * @returns 處理建議
 */
export function getErrorHandlingSuggestion(error: BTSEError): string {
  switch (error.code) {
    case BTSEErrorCode.MARKET_PAIR_NOT_SUPPORTED:
      return '請檢查交易對名稱是否正確，或該交易對是否已下架';
    
    case BTSEErrorCode.OPERATION_NOT_SUPPORTED:
      return '請檢查操作類型是否正確，或該操作是否已被禁用';
    
    case BTSEErrorCode.INVALID_REQUEST:
      return '請檢查請求格式是否正確，確保所有必需參數都已提供';
    
    case BTSEErrorCode.TOPIC_NOT_EXIST:
      return '請檢查訂閱主題是否存在，或主題名稱是否正確';
    
    case BTSEErrorCode.USER_MESSAGE_BUFFER_FULL:
      return '用戶消息緩衝區已滿，請稍後再試或減少消息發送頻率';
    
    case BTSEErrorCode.MAX_FAILED_ATTEMPTS:
      return '已達到最大失敗嘗試次數，連接已關閉。請檢查網絡連接並重新連接';
    
    default:
      return '未知錯誤，請檢查網絡連接或聯繫技術支持';
  }
} 