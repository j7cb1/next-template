export const getTrackSwapQueryKey = (hash: string, chainId: string) =>
  ['swap', 'track', hash, chainId]
