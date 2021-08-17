export interface IBridgeContract {
	chainId: number
	txFee: number
	parentBridgeContractAddress?: string
	bridgeContractAddress: string
	tokenContractAddress: string
	wrappedTokenContractAddress?: string
	adminKeyName: string
}
