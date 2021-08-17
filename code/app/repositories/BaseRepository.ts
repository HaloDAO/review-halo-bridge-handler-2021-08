import knex, { QueryBuilder } from 'knex'
import { mapKeys, isNil, map } from 'lodash'

import decamelize from 'decamelize-keys'
import camelize from 'camelcase-keys'

const knexConfig = {
	client: 'postgres',
	connection: {
		host: process.env.DB_ENDPOINT,
		port: process.env.DB_PORT,
		user: process.env.DATABASE_USER,
		password: process.env.DATABASE_PASSWORD,
		database: process.env.DATABASE_NAME,
	},
}

export default abstract class<T> {
	public table: string
	public manager: knex

	/**
	 *
	 * @param table - MySQL table name of repository
	 */
	constructor(table: string) {
		this.table = table
		this.manager = knex(knexConfig)
	}

	public async insert(data: T): Promise<any> {
		try {
			return this.manager(this.table).insert(decamelize(data))
		} catch (SQLError) {
			throw new Error(SQLError)
		}
	}

	public async insertMany(data: T[]): Promise<any> {
		try {
			const decamlizedArray = data.map((element) => decamelize(element))
			return this.manager(this.table).insert(decamlizedArray)
		} catch (SQLError) {
			throw new Error(SQLError)
		}
	}

	public async findOneByCondition(condition): Promise<T> {
		try {
			return camelize(
				await this.manager(this.table)
					.where(decamelize(condition))
					.select()
					.first(),
			)
		} catch (SQLError) {
			throw new Error(SQLError)
		}
	}

	public async findManyByCondition(condition?): Promise<T[]> {
		try {
			if (condition) {
				return map(
					await this.manager(this.table).where(decamelize(condition)).select(),
					(item) => camelize(item),
				)
			}
			return this.manager(this.table).select()
		} catch (SQLError) {
			throw new Error(SQLError)
		}
	}

	public async checkValueExists(condition) {
		try {
			const record = await this.manager(this.table)
				.where(decamelize(condition))
				.select()
			if (record.length > 0) return true
		} catch (SQLError) {
			throw new Error(SQLError)
		}
		return false
	}

	public async deleteOneByCondition(condition): Promise<boolean> {
		try {
			return this.manager(this.table).where(decamelize(condition)).del()
		} catch (SQLError) {
			throw new Error(SQLError)
		}
	}

	public async updateOneByCondition(condition, updateValues): Promise<any> {
		try {
			return this.manager(this.table)
				.where(decamelize(condition))
				.update(decamelize(updateValues))
		} catch (SQLError) {
			throw new Error(SQLError)
		}
	}

	public async findWithMultipleQueries(
		condition?,
		pagination?,
		order?,
		populate?,
	): Promise<any> {
		let result
		let totalCount = null
		const tableName = this.table
		const conditionsWithTable = mapKeys(
			decamelize(condition),
			function (_, key) {
				return `${tableName}.${key}`
			},
		)

		try {
			const query = this.manager(this.table).select()

			if (condition) {
				query.andWhere((builder) => {
					builder.where(conditionsWithTable)
				})
			}

			let queryClone = query.clone()

			if (populate && populate.length > 0) {
				populate.forEach((value) => {
					const firstTable = value.firstTable || this.table
					const valTableName = value.alias
						? `${value.table} as ${value.alias}`
						: value.table
					query.leftJoin(
						valTableName,
						`${firstTable}.${value.firstTableProp}`,
						`${value.alias || value.table}.${value.secondTableProp}`,
					)
				})
				const tablesData = await Promise.all(
					populate.map(async (data) => ({
						...data,
						columns: Object.keys(await this.manager(data.table).columnInfo()),
					})),
				)
				const populateData = tablesData.map(
					({ table, nameAs, columns, alias, isMany = false }) => {
						const columnsDetails = columns
							.map((column) => `"${column}", ${alias || table}.${column}`)
							.join(', ')
						return this.manager.raw(
							`${
								isMany ? 'JSON_ARRAYAGG' : ''
							}(JSON_OBJECT(${columnsDetails})) as ${nameAs}`,
						)
					},
				)
				queryClone = query.clone()

				query.select([`${this.table}.*`, ...populateData])
			}

			if (
				pagination &&
				(!isNil(pagination.limit) || !isNil(pagination.offset))
			) {
				const { limit, offset } = pagination
				const counts = await queryClone
					.count(`* as totalCount`)
					.groupBy(`${this.table}.index`)
				totalCount = { totalCount: counts.length }
				// console.log('counts.length:', counts.length)
				// console.log('offset:', offset)
				const finalOffset = counts.length <= offset ? 0 : offset
				query.limit(limit || null).offset(finalOffset)
			}
			if (order) {
				result = await query.orderBy(order)
			} else {
				result = await query
			}
		} catch (SQLError) {
			throw new Error(SQLError)
		}

		if (totalCount !== null) {
			return {
				...totalCount,
				data: map(result, camelize),
			}
		}

		return result
	}
}
