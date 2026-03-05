const TW = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains'

export type ChainMeta = {
  key: string
  name: string
  iconUrl: string
  color: string
}

export const CHAIN_META: Record<string, ChainMeta> = {
  ETH:   { key: 'ETH',   name: 'Ethereum',     iconUrl: `${TW}/ethereum/info/logo.png`,     color: '#627EEA' },
  ARB:   { key: 'ARB',   name: 'Arbitrum',      iconUrl: `${TW}/arbitrum/info/logo.png`,     color: '#28A0F0' },
  BASE:  { key: 'BASE',  name: 'Base',          iconUrl: `${TW}/base/info/logo.png`,         color: '#0052FF' },
  BSC:   { key: 'BSC',   name: 'BNB Chain',     iconUrl: `${TW}/binance/info/logo.png`,      color: '#F0B90B' },
  SOL:   { key: 'SOL',   name: 'Solana',        iconUrl: `${TW}/solana/info/logo.png`,       color: '#9945FF' },
  AVAX:  { key: 'AVAX',  name: 'Avalanche',     iconUrl: `${TW}/avalanchec/info/logo.png`,   color: '#E84142' },
  OP:    { key: 'OP',    name: 'Optimism',       iconUrl: `${TW}/optimism/info/logo.png`,     color: '#FF0420' },
  POL:   { key: 'POL',   name: 'Polygon',       iconUrl: `${TW}/polygon/info/logo.png`,      color: '#8247E5' },
  BTC:   { key: 'BTC',   name: 'Bitcoin',       iconUrl: `${TW}/bitcoin/info/logo.png`,      color: '#F7931A' },
  THOR:  { key: 'THOR',  name: 'THORChain',     iconUrl: `${TW}/thorchain/info/logo.png`,    color: '#33FF99' },
  GAIA:  { key: 'GAIA',  name: 'Cosmos',        iconUrl: `${TW}/cosmos/info/logo.png`,       color: '#2E3148' },
  NEAR:  { key: 'NEAR',  name: 'NEAR',          iconUrl: `${TW}/near/info/logo.png`,         color: '#00C1DE' },
  DOT:   { key: 'DOT',   name: 'Polkadot',      iconUrl: `${TW}/polkadot/info/logo.png`,     color: '#E6007A' },
  ADA:   { key: 'ADA',   name: 'Cardano',       iconUrl: `${TW}/cardano/info/logo.png`,      color: '#0033AD' },
  SUI:   { key: 'SUI',   name: 'Sui',           iconUrl: `${TW}/sui/info/logo.png`,          color: '#6FBCF0' },
  TON:   { key: 'TON',   name: 'TON',           iconUrl: `${TW}/ton/info/logo.png`,          color: '#0098EA' },
  TRON:  { key: 'TRON',  name: 'TRON',          iconUrl: `${TW}/tron/info/logo.png`,         color: '#FF0013' },
  LTC:   { key: 'LTC',   name: 'Litecoin',      iconUrl: `${TW}/litecoin/info/logo.png`,     color: '#345D9D' },
  BCH:   { key: 'BCH',   name: 'Bitcoin Cash',  iconUrl: `${TW}/bitcoincash/info/logo.png`,  color: '#8DC351' },
  DOGE:  { key: 'DOGE',  name: 'Dogecoin',      iconUrl: `${TW}/doge/info/logo.png`,         color: '#C2A633' },
  ZEC:   { key: 'ZEC',   name: 'Zcash',         iconUrl: `${TW}/zcash/info/logo.png`,        color: '#ECB244' },
  DASH:  { key: 'DASH',  name: 'Dash',          iconUrl: `${TW}/dash/info/logo.png`,         color: '#008CE7' },
  KUJI:  { key: 'KUJI',  name: 'Kujira',        iconUrl: `${TW}/kujira/info/logo.png`,       color: '#E53935' },
  MONAD: { key: 'MONAD', name: 'Monad',         iconUrl: `${TW}/monad/info/logo.png`,        color: '#836EF9' },
  GNO:   { key: 'GNO',   name: 'Gnosis',        iconUrl: `${TW}/xdai/info/logo.png`,         color: '#04795B' },
  XRP:   { key: 'XRP',   name: 'XRP Ledger',    iconUrl: `${TW}/ripple/info/logo.png`,       color: '#23292F' },
  XLAYER:{ key: 'XLAYER',name: 'X Layer',       iconUrl: `${TW}/okc/info/logo.png`,          color: '#000000' },
  // These chains don't have trustwallet icons — fallback to letter badge
  MAYA:  { key: 'MAYA',  name: 'Maya',          iconUrl: '',                                  color: '#3B82F6' },
  BERA:  { key: 'BERA',  name: 'Berachain',     iconUrl: '',                                  color: '#7C3AED' },
  STRK:  { key: 'STRK',  name: 'Starknet',      iconUrl: '',                                  color: '#EC796B' },
  XRD:   { key: 'XRD',   name: 'Radix',         iconUrl: '',                                  color: '#052CC0' },
}

/** Preferred display order for chain filter pills */
export const CHAIN_ORDER = ['ETH', 'ARB', 'BASE', 'BSC', 'SOL', 'AVAX', 'OP', 'POL', 'BTC']

/** Get chain metadata with graceful fallback for unknown chains */
export function getChainMeta(chainKey: string): ChainMeta {
  return CHAIN_META[chainKey] ?? {
    key: chainKey,
    name: chainKey,
    iconUrl: '',
    color: '#888888',
  }
}
