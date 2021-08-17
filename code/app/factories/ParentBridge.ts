import { TransactionReceipt } from '@ethersproject/abstract-provider'

import ChainProvider from './ChainProvider'
import log from '../utils/Logger'
import { ISignedMintTx } from '../model/dto/MintRequest'

export default abstract class ParentBridge extends ChainProvider {
	public wallet

	public readonly bridgeContractAddress: string
	public readonly tokenContractAddress: string

	constructor(
		bridgeContractAddress: string,
		tokenContractAddress: string,
		chainId: number,
	) {
		super(chainId)

		this.bridgeContractAddress = bridgeContractAddress
		this.tokenContractAddress = tokenContractAddress
	}

	public async sendTransaction(
		signedTx: ISignedMintTx,
	): Promise<TransactionReceipt> {
		let result

		try {
			result = await this.wallet.sendTransaction(signedTx)
		} catch (ChainError) {
			log.error(ChainError)
		}

		return result
	}
}
