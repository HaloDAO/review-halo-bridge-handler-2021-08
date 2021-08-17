import * as ethers from 'ethers'
import ParentBridge from './ParentBridge'

import log from '../utils/Logger'
import { SecondaryBridge as Bridge } from '../../token-bridge/typechain/SecondaryBridge'
import SecondaryBridgeInterface from '../../token-bridge/artifacts/contracts/SecondaryBridge.sol/SecondaryBridge.json'

import { ISignedMintTx } from '../model/dto/MintRequest'

const TAG = '[SecondaryBridge]'

export default class SecondaryBridge extends ParentBridge {
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
			SecondaryBridgeInterface.abi,
			this.wallet,
		) as Bridge
	}

	public async mintToOpposingChain(
		recipientAddress: string,
		amount: number,
	): Promise<ISignedMintTx> {
		const METHOD = '[mintToOpposingChain]'
		log.info(`${TAG} ${this.chainId} ${this.bridgeContractAddress} - ${METHOD}`)

		let result

		try {
			result = await this.bridgeContract.populateTransaction.mint(
				recipientAddress,
				amount,
			)
		} catch (BridgeError) {
			log.error(BridgeError)
			throw new Error(BridgeError)
		}

		return result
	}
}
