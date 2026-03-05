export const getSwapQuoteQueryKey = (
  sellAsset: string,
  buyAsset: string,
  sellAmount: string,
  slippage: number,
) => ['swap', 'quote', sellAsset, buyAsset, sellAmount, slippage]
