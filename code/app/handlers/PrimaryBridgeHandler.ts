import { APIGatewayEvent, SQSEvent, Context } from 'aws-lambda'
import { resolve } from '../container'
import { MessageUtil } from '../utils/Message'
import log from '../utils/Logger'

export const handleReceiveDepositCallback = async (
	event: APIGatewayEvent,
	context: Context,
): Promise<MessageUtil> => {
	const parsedPayload = JSON.parse(event.body)
	let result
	try {
		result = await resolve('PrimaryBridgeService').handleReceiveDepositCallback(
			parsedPayload,
		)
	} catch (err) {
		log.error(err)
		return MessageUtil.error(400, err.message)
	}

	return MessageUtil.success(201, result)
}

export const processBurnSQSMessage = async (
	event: SQSEvent,
	context: Context,
): Promise<MessageUtil> => {
	let result
	try {
		const sqsMessage = JSON.parse(event.Records[0].body)
		result = await resolve('PrimaryBridgeService').processBurn(sqsMessage)
	} catch (err) {
		log.error(err)
		return MessageUtil.error(400, err.message)
	}
	return MessageUtil.success(201, result)
}

export const handleReleaseTxVerification = async (
	event: SQSEvent,
	context: Context,
): Promise<MessageUtil> => {
	let result
	try {
		const sqsMessage = JSON.parse(event.Records[0].body)
		result = await resolve('PrimaryBridgeService').verifyReleaseTx(sqsMessage)
	} catch (err) {
		log.error(err)
		return MessageUtil.error(400, err.message)
	}
	return MessageUtil.success(201, result)
}
