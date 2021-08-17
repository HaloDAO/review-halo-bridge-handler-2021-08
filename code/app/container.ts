import { createContainer, asClass } from 'awilix'

/** Repositories */
import BridgeContractRepository from './repositories/BridgeContractRepository'
import DepositRepository from './repositories/DepositRepository'
import MintRequestRepository from './repositories/MintRequestRepository'
import BurnRepository from './repositories/BurnRepository'
import RedeemRequestRepository from './repositories/RedeemRequestRepository'
import WebhookTriggerRepository from './repositories/WebhookTriggerRepository'

/** External Services */
import SQSService from './external-services/SQSService'
import SecretsManagerService from './external-services/SecretsManagerService'

/** Services */
import PrimaryBridgeService from './services/PrimaryBridgeService'
import SecondaryBridgeService from './services/SecondaryBridgeService'
import MintRequestService from './services/MintRequestService'
import RedeemRequestService from './services/RedeemRequestService'
import DepositService from './services/DepositService'
import BurnService from './services/BurnService'

type TypeName =
	| 'PrimaryBridgeService'
	| 'SecondaryBridgeService'
	| 'MintRequestService'
	| 'RedeemRequestService'
	| 'DepositService'
	| 'BurnService'

type ServiceType<T> = T extends 'PrimaryBridgeService'
	? PrimaryBridgeService
	: T extends 'SecondaryBridgeService'
	? SecondaryBridgeService
	: T extends 'MintRequestService'
	? MintRequestService
	: T extends 'RedeemRequestService'
	? RedeemRequestService
	: T extends 'DepositService'
	? DepositService
	: T extends 'BurnService'
	? BurnService
	: never

const container = createContainer()

/** Repositories */
container.register({
	BridgeContractRepository: asClass(BridgeContractRepository).singleton(),
	DepositRepository: asClass(DepositRepository).singleton(),
	MintRequestRepository: asClass(MintRequestRepository).singleton(),
	BurnRepository: asClass(BurnRepository).singleton(),
	RedeemRequestRepository: asClass(RedeemRequestRepository).singleton(),
	WebhookTriggerRepository: asClass(WebhookTriggerRepository).singleton(),
})

/** External Services */
container.register({
	SQSService: asClass(SQSService).singleton(),
	SecretsManagerService: asClass(SecretsManagerService).singleton(),
})

/** Services */
container.register({
	PrimaryBridgeService: asClass(PrimaryBridgeService).singleton(),
	SecondaryBridgeService: asClass(SecondaryBridgeService).singleton(),
	MintRequestService: asClass(MintRequestService).singleton(),
	RedeemRequestService: asClass(RedeemRequestService).singleton(),
	DepositService: asClass(DepositService).singleton(),
	BurnService: asClass(BurnService).singleton(),
})

export function resolve<T extends TypeName>(service: T): ServiceType<T> {
	return container.resolve(service) as ServiceType<T>
}

export default container
