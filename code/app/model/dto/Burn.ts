export interface IBurnDto {
	bridgeContractAddress: string
	tokenContractAddress: string
	account: string
	amount: number
	token: string
	block: number
	chainIdOrigin: number
	chainIdDestination: number
	txReceipt: string
	createdAt?: string
	dateArchived?: string
	archived?: boolean
}
