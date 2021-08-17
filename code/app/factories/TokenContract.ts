import * as ethers from 'ethers'

import { ERC20 } from '../../token-bridge/typechain/ERC20'
import ERC20Contract from '../../token-bridge/artifacts/contracts/MockToken.sol/MockToken.json'
export default class TokenContract {
	public readonly provider = new ethers.providers.JsonRpcProvider(
		process.env.MORALIS_NODE_URL,
	)
	public readonly wallet: ethers.Wallet

	public readonly tokenAddress
	public readonly tokenName
	public readonly tokenContract: ERC20

	constructor(tokenAddress, tokenName, walletMnemonic) {
		this.tokenAddress = tokenAddress
		this.tokenName = tokenName

		this.wallet = ethers.Wallet.fromMnemonic(walletMnemonic).connect(
			this.provider,
		)
		this.tokenContract = new ethers.Contract(
			tokenAddress,
			ERC20Contract.abi,
			this.wallet,
		) as ERC20
	}
}
