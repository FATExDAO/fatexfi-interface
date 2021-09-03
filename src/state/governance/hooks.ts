import { PRELOADED_PROPOSALS } from './../../constants/index'
import { ChainId, TokenAmount } from '@fatex-dao/sdk'
import { isAddress } from 'ethers/lib/utils'
import { useGovernanceContract, useUniContract } from '../../hooks/useContract'
import { useSingleCallResult, useSingleContractMultipleData } from '../multicall/hooks'
import { useActiveWeb3React } from '../../hooks'
import { ethers, utils } from 'ethers'
import { calculateGasMargin } from '../../utils'
import { TransactionResponse } from '@ethersproject/providers'
import { useTransactionAdder } from '../transactions/hooks'
import { useCallback, useEffect, useState } from 'react'
import { abi as GOV_ABI } from '../../constants/abis/governor-alpha.json'
import useGovernanceToken from '../../hooks/useGovernanceToken'

interface ProposalDetail {
  target: string
  functionSig: string
  callData: string
}

export interface ProposalData {
  id: string
  title: string
  description: string
  proposer: string
  status: string
  forCount: number
  againstCount: number
  startBlock: number
  endBlock: number
  details: ProposalDetail[]
}

const enumerateProposalState = (state: number) => {
  const proposalStates = ['pending', 'active', 'canceled', 'defeated', 'succeeded', 'queued', 'expired', 'executed']
  return proposalStates[state]
}

// get count of all proposals made
export function useProposalCount(chainId: ChainId): number | undefined {
  const gov = useGovernanceContract(chainId)
  const res = useSingleCallResult(gov, 'proposalCount')
  if (res.result && !res.loading) {
    return parseInt(res.result[0])
  }
  return undefined
}

/**
 * Need proposal events to get description data emitted from
 * new proposal event.
 */
export function useDataFromEventLogs() {
  const { library, chainId } = useActiveWeb3React()
  const [formattedEvents, setFormattedEvents] = useState<any>()
  const govContract = useGovernanceContract(chainId ?? ChainId.HARMONY_MAINNET)

  // create filter for these specific events
  const filter = {
    ...govContract?.filters?.['ProposalCreated'](),
    // fromBlock: GOVERNANCE_START_BLOCK[chainId ?? ChainId.HARMONY_MAINNET],
    fromBlock: 0,
    toBlock: 'latest'
  }
  const eventParser = new ethers.utils.Interface(GOV_ABI)

  useEffect(() => {
    async function fetchData() {
      const pastEvents = await library?.getLogs(filter)
      // reverse events to get them from newest to oldest
      const formattedEventData = pastEvents
        ?.map(event => {
          const eventParsed = eventParser.parseLog(event).args
          return {
            description: eventParsed.description,
            details: eventParsed.targets.map((target: string, i: number) => {
              const signature = eventParsed.signatures[i]
              const [name, types] = signature.substr(0, signature.length - 1).split('(')

              const calldata = eventParsed.calldatas[i]
              const decoded = utils.defaultAbiCoder.decode(types.split(','), calldata)

              return {
                target,
                functionSig: name,
                callData: decoded.join(', ')
              }
            })
          }
        })
        .reverse()
      setFormattedEvents(formattedEventData)
    }
    if (!formattedEvents) {
      fetchData()
    }
  }, [eventParser, filter, library, formattedEvents])

  return formattedEvents
}

// get data for all past and active proposals
export function useAllProposalData(chainId: ChainId) {
  const proposalCount = useProposalCount(chainId)
  const govContract = useGovernanceContract(chainId)

  const proposalIndexes = []
  for (let i = 1; i <= (proposalCount ?? 0); i++) {
    proposalIndexes.push([i])
  }

  // get metadata from past events
  const formattedEvents = useDataFromEventLogs()

  // get all proposal entities
  const allProposals = useSingleContractMultipleData(govContract, 'proposals', proposalIndexes)

  // get all proposal states
  const allProposalStates = useSingleContractMultipleData(govContract, 'state', proposalIndexes)

  if (formattedEvents && allProposals && allProposalStates) {
    allProposals.reverse()
    allProposalStates.reverse()

    return allProposals
      .filter((p, i) => {
        return Boolean(p.result) && Boolean(allProposalStates[i]?.result) && Boolean(formattedEvents[i])
      })
      .map((p, i) => {
        const description = PRELOADED_PROPOSALS.get(allProposals.length - i - 1) || formattedEvents[i].description
        const formattedProposal: ProposalData = {
          id: allProposals[i]?.result?.id.toString(),
          title: description?.split(/# |\n/g)[1] || 'Untitled',
          description: description || 'No description.',
          proposer: allProposals[i]?.result?.proposer,
          status: enumerateProposalState(allProposalStates[i]?.result?.[0]) ?? 'Undetermined',
          forCount: parseFloat(ethers.utils.formatUnits(allProposals[i]?.result?.forVotes.toString(), 18)),
          againstCount: parseFloat(ethers.utils.formatUnits(allProposals[i]?.result?.againstVotes.toString(), 18)),
          startBlock: parseInt(allProposals[i]?.result?.startBlock?.toString()),
          endBlock: parseInt(allProposals[i]?.result?.endBlock?.toString()),
          details: formattedEvents[i].details
        }
        return formattedProposal
      })
  } else {
    return []
  }
}

export function useProposalData(id: string, chainId: ChainId): ProposalData | undefined {
  const allProposalData = useAllProposalData(chainId)
  return allProposalData?.find(p => p.id === id)
}

// get the users delegatee if it exists
export function useUserDelegatee(): string {
  const { account } = useActiveWeb3React()
  const uniContract = useUniContract()
  const { result } = useSingleCallResult(uniContract, 'delegates', [account ?? undefined])
  return result?.[0] ?? undefined
}

export function useQuorum(): TokenAmount | undefined {
  const { chainId } = useActiveWeb3React()
  const contract = useGovernanceContract(chainId ?? ChainId.HARMONY_MAINNET)
  const govToken = useGovernanceToken()
  const quorum = useSingleCallResult(contract, 'quorumVotes', [])?.result?.[0]
  return govToken && quorum ? new TokenAmount(govToken, quorum) : undefined
}

export function useProposalThreshold(): TokenAmount | undefined {
  const { chainId } = useActiveWeb3React()
  const contract = useGovernanceContract(chainId ?? ChainId.HARMONY_MAINNET)
  const govToken = useGovernanceToken()
  const quorum = useSingleCallResult(contract, 'proposalThreshold', [])?.result?.[0]
  return govToken && quorum ? new TokenAmount(govToken, quorum) : undefined
}

// gets the users current votes
export function useUserVotes(): TokenAmount | undefined {
  const { account } = useActiveWeb3React()
  const uniContract = useUniContract()

  // check for available votes
  const govToken = useGovernanceToken()
  const votes = useSingleCallResult(uniContract, 'getCurrentVotes', [account ?? undefined])?.result?.[0]
  return votes && govToken ? new TokenAmount(govToken, votes) : undefined
}

// fetch available votes as of block (usually proposal start block)
export function useUserVotesAsOfBlock(block: number | undefined): TokenAmount | undefined {
  const { account } = useActiveWeb3React()
  const uniContract = useUniContract()

  // check for available votes
  const govToken = useGovernanceToken()
  const votes = useSingleCallResult(uniContract, 'getPriorVotes', [account ?? undefined, block ?? undefined])
    ?.result?.[0]
  return votes && govToken ? new TokenAmount(govToken, votes) : undefined
}

export function useDelegateCallback(): (delegatee: string | undefined) => undefined | Promise<string> {
  const { account, chainId, library } = useActiveWeb3React()
  const addTransaction = useTransactionAdder()

  const uniContract = useUniContract()

  return useCallback(
    (delegatee: string | undefined) => {
      if (!library || !chainId || !account || !isAddress(delegatee ?? '')) return undefined
      const args = [delegatee]
      if (!uniContract) throw new Error('No governance token contract!')
      return uniContract.estimateGas.delegate(...args, {}).then(estimatedGasLimit => {
        return uniContract
          .delegate(...args, { value: null, gasLimit: calculateGasMargin(estimatedGasLimit) })
          .then((response: TransactionResponse) => {
            addTransaction(response, {
              summary: `Delegated votes`
            })
            return response.hash
          })
      })
    },
    [account, addTransaction, chainId, library, uniContract]
  )
}

export function useVoteCallback(): {
  voteCallback: (proposalId: string | undefined, support: boolean) => undefined | Promise<string>
} {
  const { account, chainId } = useActiveWeb3React()

  const govContract = useGovernanceContract(chainId ?? ChainId.MAINNET)
  const addTransaction = useTransactionAdder()

  const voteCallback = useCallback(
    (proposalId: string | undefined, support: boolean) => {
      if (!account || !govContract || !proposalId) return
      const args = [proposalId, support]
      return govContract.estimateGas.castVote(...args, {}).then(estimatedGasLimit => {
        return govContract
          .castVote(...args, { value: null, gasLimit: calculateGasMargin(estimatedGasLimit) })
          .then((response: TransactionResponse) => {
            addTransaction(response, {
              summary: `Voted ${support ? 'for ' : 'against'} proposal ${proposalId}`
            })
            return response.hash
          })
      })
    },
    [account, addTransaction, govContract]
  )
  return { voteCallback }
}
