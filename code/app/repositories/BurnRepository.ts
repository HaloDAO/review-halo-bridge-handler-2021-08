import BaseRepository from './BaseRepository'
import { IBurnDto } from 'app/model/dto/Burn'

export default class BurnRepository extends BaseRepository<IBurnDto> {
	constructor() {
		super(process.env.BURN_TABLE)
	}
}
