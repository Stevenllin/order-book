/**
 * 格式化價格顯示
 * @param price 價格
 * @param decimals 小數位數
 * @returns 格式化後的價格字符串
 */
export function formatNumber(price: number, decimals: number = 2): string {
  return price.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}