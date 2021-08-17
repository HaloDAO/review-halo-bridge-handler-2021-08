import * as ethers from 'ethers'
import ParentBridge from './ParentBridge'

import log from '../utils/Logger'
import { PrimaryBridge as Bridge } from '../../token-bridge/typechain/PrimaryBridge'
import PrimaryBridgeInterface from '../../token-bridge/artifacts/contracts/PrimaryBridge.sol/PrimaryBridge.json'

const TAG = '[PrimaryBridge]'

export default class PrimaryBridge extends ParentBridge {
	public readonly bridgeContract: Bridge

	constructor(
		bridgeContractAddress: string,
		tokenContractAddress: string,
		chainId: number,
		adminWalletKey: string,
	) {
		super(bridgeContractAddress, tokenContractAddress, chainId)

		this.wallet = ethers.Wallet.fromMnemonic(adminWalletKey).connect(
			this.provider,
		)

		this.bridgeContract = new ethers.Contract(
			bridgeContractAddress,
			PrimaryBridgeInterface.abi,
			this.wallet,
		) as Bridge
	}

	public async release(
		amount: number,
		to: string,
		chainId: number,
	): Promise<any> {
		const METHOD = '[release]'
		log.info(`${TAG} ${METHOD}`)

		let releaseTx
		try {
			releaseTx = await this.bridgeContract.populateTransaction.release(
				amount,
				to,
				chainId,
			)
		} catch (ReleaseError) {
			log.error(ReleaseError)
			throw new Error(ReleaseError)
		}

		return releaseTx
	}
}
