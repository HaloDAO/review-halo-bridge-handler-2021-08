export interface IWebhookTrigger {
	eventBrokerTriggerId: string
	eventName: string
	chainIdOrigin: number
	contractAddressOrigin: string
	tokenContractAddress: string
}
