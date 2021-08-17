import BaseRepository from './BaseRepository'
import { IDepositDto } from 'app/model/dto/Deposit'

export default class DepositRepository extends BaseRepository<IDepositDto> {
	constructor() {
		super(process.env.DEPOSIT_TABLE)
	}
}
