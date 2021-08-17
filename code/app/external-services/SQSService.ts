import {
	SQSClient,
	SendMessageCommand,
	SendMessageCommandInput,
	SendMessageCommandOutput,
} from '@aws-sdk/client-sqs'
import { isString } from 'lodash'

import log from '../utils/Logger'

const TAG = '[SQSService]'
export default class SQSService {
	private _sqsClient: SQSClient

	constructor() {
		this._sqsClient = new SQSClient({
			region: (process.env.AWS_REGION as string) || 'us-east-1',
		})
	}

	public async sendMessage(
		queueUrl: string,
		data: any,
		msDelay?: number,
	): Promise<SendMessageCommandOutput> {
		const METHOD = '[sendMessage]'
		log.info(`${TAG} ${METHOD} @ ${queueUrl}`)

		const payload = isString(data) ? data : JSON.stringify(data)
		const result = await this._sendMessage(queueUrl, payload, msDelay)

		return result
	}

	private async _sendMessage(
		queueUrl: string,
		data: any,
		msDelay?: number,
	): Promise<SendMessageCommandOutput> {
		let result: SendMessageCommandOutput
		try {
			const payload: SendMessageCommandInput = {
				QueueUrl: queueUrl,
				MessageBody: data,
				DelaySeconds: msDelay,
			}

			const command = new SendMessageCommand(payload)

			result = await this._sqsClient.send(command)
		} catch (QueueError) {
			throw new Error(QueueError)
		}
		return result
	}
}
