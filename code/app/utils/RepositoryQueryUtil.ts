import { reject } from 'lodash'

/**
 * Get range query values of given start and end dates
 * @param {Date} startDate
 * @param {Date} endDate
 * @param {string} param
 * @param {string?} table
 *
 * @return {object}
 */
export const getRangeQuery = (startDate, endDate, param, table = null): any => {
	if (startDate || endDate) {
		const pastDatesOnlyCols = ['createdAt', 'startDate']
		const from = new Date(startDate || null)
		let to = null
		if (endDate) {
			to = new Date(endDate)
		} else if (!endDate && pastDatesOnlyCols.includes(param)) {
			to = new Date() // end date is current date
		}
		// precision
		from.setMilliseconds(0)
		if (to) {
			to.setMilliseconds(999)
		}

		if (to < from && pastDatesOnlyCols.includes(param)) {
			throw new Error(`${param} start date cannot be before ${param} end date.`)
		}

		return { param: table ? `${table}.${param}` : param, from, to }
	}
	return null
}

/**
 * Get order by query
 * - parses string, with format 'column_name1 order, column_name2 order, …',
 * to object, in {column, order} format.
 * @param {string} orderBy
 * @param {object} columnEquals
 * @param {string} columnEquals.table - table name
 * @param {string} columnEquals.col - column name
 * @param {string} columnEquals.name - column name in return data
 *
 * @return {object|null}
 */
export const getOrderByQuery = (orderBy, columnEquals = []): any => {
	if (!orderBy) {
		return undefined
	}

	console.log('orderBy:', orderBy)
	const query = orderBy.trim()
	const regex =
		/^\w+(?:\s(\b(asc)\b|\b(desc)\b)?)?(?:,\s\w+(?:\s(\b(asc)\b|\b(desc)\b)?)*)*$/im
	if (!regex.test(query)) {
		throw new Error(
			'Invalid "orderBy" format. Should be (column_name1 order, column_name2 order, ...)',
		)
	}

	const orderQuery = query.split(',').map((data) => {
		const [column, order] = data.trim().split(/\s/g)
		const actualColumn = columnEquals.find(({ name }) => name === column)
		return {
			column: actualColumn
				? `${actualColumn.table}.${actualColumn.col}`
				: column,
			order,
		}
	})
	return reject(orderQuery, { column: '' })
}

export const getSearchQuery = (searchValue, columns, table?): any => {
	if (searchValue) {
		const query = columns
			.map(
				(column) =>
					`${
						table && !column.includes('.') ? `${table}.` : ''
					}${column} like :value`,
			)
			.join(' or ')
		return {
			query,
			bindings: { value: `%${searchValue}%` },
		}
	}
	return {}
}
