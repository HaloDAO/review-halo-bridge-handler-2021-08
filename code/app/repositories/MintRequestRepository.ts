import BaseRepository from './BaseRepository'
import { IMintRequestDto } from 'app/model/dto/MintRequest'

export default class MintRequestRepository extends BaseRepository<IMintRequestDto> {
	constructor() {
		super(process.env.MINT_REQUESTS_TABLE)
	}
}
