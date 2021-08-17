export interface IMintRequestDto {
	bridgeContractAddress: string
	depositTxId: string
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

export interface ISignedMintTx {
	data: string
	to: string
	from: string
	depositTxId?: string
	adminKeyName?: string
}
