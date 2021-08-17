import BaseRepository from './BaseRepository'
import { IWebhookTrigger } from 'app/model/dto/WebhookTrigger'

export default class WebhookTriggerRepository extends BaseRepository<IWebhookTrigger> {
	constructor() {
		super(process.env.WEBHOOK_TRIGGERS_TABLE)
	}
}
