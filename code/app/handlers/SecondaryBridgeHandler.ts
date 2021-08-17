import { SQSEvent, APIGatewayEvent, Context } from 'aws-lambda'
import { resolve } from '../container'
import log from '../utils/Logger'
import { MessageUtil } from '../utils/Message'

import { ISignedMintTx } from '../model/dto/MintRequest'

export const processDepositSQSMessage = async (
	event: SQSEvent,
	context: Context,
): Promise<MessageUtil> => {
	let result
	try {
		const sqsMessage = JSON.parse(event.Records[0].body) as ISignedMintTx
		result = await resolve('SecondaryBridgeService').processDeposit(sqsMessage)
	} catch (err) {
		log.error(err)
		return MessageUtil.error(err.code, err.message)
	}
	return MessageUtil.success(201, result)
}

export const handleMintTxVerification = async (
	event: SQSEvent,
	context: Context,
): Promise<MessageUtil> => {
	let result
	try {
		const sqsMessage = JSON.parse(event.Records[0].body)
		result = await resolve('SecondaryBridgeService').verifyMintTx(sqsMessage)
	} catch (err) {
		log.error(err)
		return MessageUtil.error(400, err.message)
	}
	return MessageUtil.success(201, result)
}

export const handleReceiveBurnCallback = async (
	event: APIGatewayEvent,
	context: Context,
): Promise<MessageUtil> => {
	const parsedPayload = JSON.parse(event.body)
	let result
	try {
		result = await resolve('SecondaryBridgeService').handleReceiveBurnCallback(
			parsedPayload,
		)
	} catch (err) {
		return MessageUtil.error(400, err.message)
	}

	return MessageUtil.success(201, result)
}
