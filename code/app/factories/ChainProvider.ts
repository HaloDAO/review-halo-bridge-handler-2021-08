import * as ethers from 'ethers'
import { TransactionReceipt } from '@ethersproject/abstract-provider'

import log from '../utils/Logger'

export default class ChainProvider {
	public readonly provider
	public readonly chainId: number
	public readonly rpcUrl: string

	constructor(chainId: number) {
		switch (chainId) {
			case 137:
				this.rpcUrl = process.env.POLYGON_RPC_URL
				break
			case 100:
				this.rpcUrl = process.env.XDAI_RPC_URL
				break
		}

		this.provider = new ethers.providers.JsonRpcProvider(this.rpcUrl)
	}

	public async getTransactionReceipt(
		txHash: string,
	): Promise<TransactionReceipt> {
		let txReceipt

		try {
			txReceipt = await this.provider.getTransactionReceipt(txHash)
		} catch (Error) {
			log.error(Error)
		}

		return txReceipt
	}

	public async verifyTransaction(txHash: string): Promise<boolean> {
		const txReceipt = await this.getTransactionReceipt(txHash)
		return txReceipt && txReceipt.status === 1
	}
}
