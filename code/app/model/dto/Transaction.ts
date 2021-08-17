export interface TransactionReceipt {
	nonce: number
	gasPrice: {
		type: string
		hex: string
	}
	gasLimit: {
		type: string
		hex: string
	}
	to: string
	value: {
		type: string
		hex: string
	}
	data: string
	chainId: number
	v: number
	r: string
	s: string
	from: string
	hash: string
}
