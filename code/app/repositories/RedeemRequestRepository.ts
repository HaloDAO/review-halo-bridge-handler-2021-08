import BaseRepository from './BaseRepository'
import { IRedeemRequestDto } from 'app/model/dto/RedeemRequest'

export default class RedeemRequestRepository extends BaseRepository<IRedeemRequestDto> {
	constructor() {
		super(process.env.REDEEM_REQUEST_TABLE)
	}
}
