/**
 * 格式化價格顯示
 * @param price 價格
 * @param decimals 小數位數
 * @returns 格式化後的價格字符串
 */
export function formatPrice(price: number, decimals: number = 2): string {
    return price.toFixed(decimals);
  }
  
  /**
   * 格式化數量顯示
   * @param size 數量
   * @param decimals 小數位數
   * @returns 格式化後的數量字符串
   */
  export function formatSize(size: number, decimals: number = 4): string {
    return size.toFixed(decimals);
  }
  
  /**
   * 格式化總量顯示
   * @param total 總量
   * @param decimals 小數位數
   * @returns 格式化後的總量字符串
   */
  export function formatTotal(total: number, decimals: number = 4): string {
    return total.toFixed(decimals);
  }