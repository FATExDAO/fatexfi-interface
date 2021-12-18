import { ChainId, WETH, Token, Blockchain } from '@fatex-dao/sdk'
import { useMemo } from 'react'
import useGovernanceToken from './useGovernanceToken'
import useTokenWETHPrice from './useTokenWETHPrice'
import useBlockchain from './useBlockchain'
import getToken from '../utils/getToken'
import { useActiveWeb3React } from './index'

export default function useTokensWithWETHPrices(): Record<string, any> {
  const { chainId } = useActiveWeb3React()
  const blockchain = useBlockchain()

  const weth = chainId && WETH[chainId]

  const govToken = useGovernanceToken()
  const govTokenWETHPrice = useTokenWETHPrice(govToken)

  const PAXGTicker = blockchain === Blockchain.HARMONY ? '1PAXG' : 'PAXG'
  const PAXG = getToken(chainId, PAXGTicker)
  const PAXGWETHPrice = useTokenWETHPrice(PAXG)

  const BUSDTicker = chainId !== ChainId.HARMONY_TESTNET ? 'BUSD' : '1BUSD'
  const BUSD: Token | undefined = getToken(chainId, BUSDTicker)
  const BUSDWETHPrice = useTokenWETHPrice(BUSD)

  const USDCTicker = blockchain === Blockchain.HARMONY ? '1USDC' : 'USDC'
  const USDC: Token | undefined = getToken(chainId, USDCTicker)
  const USDCWETHPrice = useTokenWETHPrice(USDC)

  // Harmony specific tokens
  const bscBUSD: Token | undefined = blockchain === Blockchain.HARMONY ? getToken(chainId, 'bscBUSD') : undefined
  const bscBUSDWETHPrice = useTokenWETHPrice(bscBUSD)

  const bridgedETH: Token | undefined = Blockchain.HARMONY ? getToken(chainId, '1ETH') : undefined
  const bridgedETHWETHPrice = useTokenWETHPrice(bridgedETH)

  const DAITicker = blockchain === Blockchain.HARMONY ? '1DAI' : 'DAI'
  const DAI: Token | undefined = Blockchain.HARMONY ? getToken(chainId, DAITicker) : undefined
  const DAIWETHPrice = useTokenWETHPrice(DAI)

  const WBTCTicker = blockchain === Blockchain.HARMONY ? '1WBTC' : 'WBTC'
  const WBTC: Token | undefined = Blockchain.HARMONY ? getToken(chainId, WBTCTicker) : undefined
  const WBTCWETHPrice = useTokenWETHPrice(WBTC)

  const USTTicker = 'UST'
  const UST: Token | undefined = Blockchain.HARMONY ? getToken(chainId, USTTicker) : undefined
  const USTWETHPrice = useTokenWETHPrice(UST)

  const FATETicker = 'FATE'
  const FATE: Token | undefined = Blockchain.HARMONY ? getToken(chainId, FATETicker) : undefined
  const FATEWETHPrice = useTokenWETHPrice(FATE)

  const xFATETicker = 'xFATE'
  const xFATE: Token | undefined = Blockchain.HARMONY ? getToken(chainId, xFATETicker) : undefined
  const xFATEWETHPrice = useTokenWETHPrice(xFATE)

  const bscLINKTicker = 'bscLINK'
  const bscLINK: Token | undefined = Blockchain.HARMONY ? getToken(chainId, bscLINKTicker) : undefined
  const bscLINKWETHPrice = useTokenWETHPrice(bscLINK)

  const WMATICTicker = 'WMATIC'
  const WMATIC: Token | undefined = Blockchain.HARMONY ? getToken(chainId, WMATICTicker) : undefined
  const WMATICWETHPrice = useTokenWETHPrice(WMATIC)

  const _1SUSHITicker = '1SUSHI'
  const _1SUSHI: Token | undefined = Blockchain.HARMONY ? getToken(chainId, _1SUSHITicker) : undefined
  const _1SUSHIWETHPrice = useTokenWETHPrice(_1SUSHI)

  const LINKTicker = 'LINK'
  const LINK: Token | undefined = Blockchain.HARMONY ? getToken(chainId, LINKTicker) : undefined
  const LINKWETHPrice = useTokenWETHPrice(LINK)

  const FTMTicker = 'FTM'
  const FTM: Token | undefined = Blockchain.HARMONY ? getToken(chainId, FTMTicker) : undefined
  const FTMWETHPrice = useTokenWETHPrice(FTM)

  return useMemo(() => {
    return {
      WETH: { token: weth, price: undefined },
      govToken: { token: govToken, price: govTokenWETHPrice },
      BUSD: { token: BUSD, price: BUSDWETHPrice },
      USDC: { token: USDC, price: USDCWETHPrice },
      bscBUSD: { token: bscBUSD, price: bscBUSDWETHPrice },
      bridgedETH: { token: bridgedETH, price: bridgedETHWETHPrice },
      DAI: { token: DAI, price: DAIWETHPrice },
      PAXG: { token: PAXG, price: PAXGWETHPrice },
      WBTC: { token: WBTC, price: WBTCWETHPrice },
      UST: { token: UST, price: USTWETHPrice },
      FATE: { token: FATE, price: FATEWETHPrice },
      xFATE: { token: xFATE, price: xFATEWETHPrice },
      bscLINK: { token: bscLINK, price: bscLINKWETHPrice },
      WMATIC: { token: WMATIC, price: WMATICWETHPrice },
      '1SUSHI': { token: _1SUSHI, price: _1SUSHIWETHPrice },
      LINK: { token: LINK, price: LINKWETHPrice },
      FTM: { token: FTM, price: FTMWETHPrice }
    }
  }, [
    chainId,
    blockchain,
    weth,
    govToken,
    govTokenWETHPrice,
    BUSD,
    BUSDWETHPrice,
    USDC,
    USDCWETHPrice,
    bscBUSD,
    bscBUSDWETHPrice,
    bridgedETH,
    bridgedETHWETHPrice
  ])
}
