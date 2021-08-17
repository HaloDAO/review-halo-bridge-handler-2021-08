import BaseRepository from './BaseRepository'
import { IBridgeContract } from 'app/model/dto/BridgeContract'

export default class BridgeContractRepository extends BaseRepository<IBridgeContract> {
	constructor() {
		super(process.env.BRIDGE_CONTRACTS_TABLE)
	}
}
