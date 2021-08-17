const { MINT_REQUESTS_TABLE } = process.env

import { map, camelCase, some, transform, has, omit } from 'lodash'

import log from '../utils/Logger'
import { getOrderByQuery } from '../utils/RepositoryQueryUtil'

import RedeemRequestRepository from '../repositories/RedeemRequestRepository'
import SQSService from '../external-services/SQSService'

import { IGetRequestQueryVo } from '../model/vo/apiQueryVo'
import { IMintRequestDto } from '../model/dto/MintRequest'

const TAG = '[RedeemRequestService]'

export default class RedeemRequestService {
	private readonly _redeemRequestRepository: RedeemRequestRepository
	private readonly _sqsService: SQSService

	constructor({ RedeemRequestRepository, SQSService }) {
		this._redeemRequestRepository = RedeemRequestRepository
		this._sqsService = SQSService
	}

	public async retrieveListOfRedeemRequests(
		condition: IGetRequestQueryVo,
	): Promise<IMintRequestDto[] | void> {
		const METHOD = '[retrieveListOfRedeemRequests]'
		log.info(`${TAG} ${METHOD}`)

		const whereField = has(condition, 'whereField')
			? condition.whereField
			: null
		const whereValue = has(condition, 'whereValue')
			? condition.whereValue
			: null
		const perPage = has(condition, 'perPage') ? condition.perPage : 5
		const page = has(condition, 'page') ? condition.page : 1
		const orderBy = has(condition, 'orderBy') ? condition.orderBy : null

		const querableCols = [
			`${MINT_REQUESTS_TABLE}.index`,
			`${MINT_REQUESTS_TABLE}.created_at`,
			`${MINT_REQUESTS_TABLE}.chain_id_origin`,
			`${MINT_REQUESTS_TABLE}.chain_id_destination`,
			`${MINT_REQUESTS_TABLE}.nonce`,
			`${MINT_REQUESTS_TABLE}.retry_count`,
		]

		const actualCols = map(querableCols, (r) => {
			const col = r.split('.')[1]
			return { table: MINT_REQUESTS_TABLE, col, name: camelCase(col) }
		})

		const offset = page === 1 ? 0 : (page - 1) * perPage
		const limit = page === 1 ? perPage * page : perPage
		const pagination = {
			limit: Number(limit) || 0,
			offset: Number(offset) || 0,
		}

		let orderQuery

		if (orderBy) orderQuery = getOrderByQuery(orderBy, actualCols)

		if (orderQuery) {
			const hasInvalidCols = some(
				orderQuery,
				({ column }) => !querableCols.includes(column),
			)
			if (hasInvalidCols) {
				throw new Error('Invalid column name in "orderBy"')
			}
		}

		let result
		try {
			const decoded = transform(
				omit(condition, [
					'whereField',
					'whereValue',
					'perPage',
					'page',
					'orderBy',
				]),
				(result: any, value, key) => {
					return (result[key] = decodeURI(decodeURIComponent(value)))
				},
				{},
			)
			const condQuery = { ...decoded }
			if (whereField && whereValue) condQuery[whereField] = whereValue

			result = await this._redeemRequestRepository.findWithMultipleQueries(
				condQuery,
				pagination,
				orderQuery,
			)
		} catch (DBError) {
			log.error(DBError)
			await this._sqsService.sendMessage(
				process.env.ERROR_SQS_URL,
				DBError.message,
			)
			throw new Error('Cannot query data store at this point.')
		}

		return result
	}
}
