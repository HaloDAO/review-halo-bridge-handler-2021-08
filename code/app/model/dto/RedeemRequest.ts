export interface IRedeemRequestDto {
	bridgeContractAddress: string
	burnTxId: string
	account: string
	amount: number
	chainIdOrigin: number
	chainIdDestination: number
	nonce?: number
	signedTx: string
	txReceipt?: string
	retryCount?: number
	isSuccessful?: boolean
	createdAt?: string
	dateArchived?: string
	archived?: boolean
}
