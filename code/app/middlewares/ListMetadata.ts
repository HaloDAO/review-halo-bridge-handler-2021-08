import { URL } from 'url'
import { has } from 'lodash'

const buildUrl = (path, queries, editPageValue) => {
	const url = new URL(`${path}`)
	for (const query in queries) {
		if (query === 'page') {
			if (editPageValue) url.searchParams.append(query, `${editPageValue}`)
		} else {
			url.searchParams.append(query, queries[query])
		}
	}
	return url.toString()
}

export default (queryParams, route, total, data): any => {
	const limit = has(queryParams, 'perPage') ? queryParams.perPage : 5
	const page = has(queryParams, 'page') ? queryParams.page : 1
	const lastPage = Math.ceil(Number(total) / Number(limit))
	const currentPage = page ? page : 1
	const path = `${process.env.API_DOMAIN}${route}`

	const result = {
		data,
		_links: {
			first: buildUrl(path, queryParams, 1),
			last: buildUrl(path, queryParams, lastPage),
			prev:
				currentPage <= 1 ? null : buildUrl(path, queryParams, currentPage - 1),
			next:
				currentPage >= lastPage
					? null
					: buildUrl(path, queryParams, currentPage + 1),
		},
		meta: {
			total: total,
			length: data.length,
			currentPage: currentPage > lastPage ? lastPage : currentPage,
			startPage: 1,
			lastPage: lastPage,
			perPage: limit,
			path,
		},
	}

	return result
}
