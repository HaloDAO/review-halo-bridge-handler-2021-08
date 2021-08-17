export const getBridgeMintFee = (
	amount: number,
	feePercentage: number,
): string => `${amount * Number(1 - Number(feePercentage))}`

export const getBridgeRedeemFee = (
	amount: number,
	feePercentage: number,
): string => `${amount * Number(1 - Number(feePercentage))}`
