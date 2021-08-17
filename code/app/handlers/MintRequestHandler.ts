import { APIGatewayEvent, Context } from 'aws-lambda'
import { resolve } from '../container'
import { MessageUtil } from '../utils/Message'
import ListMetadata from '../middlewares/ListMetadata'

export const retrieveListOfMintRequests = async (
	event: APIGatewayEvent,
	context: Context,
): Promise<MessageUtil> => {
	const queryParams = event.queryStringParameters
	let result
	try {
		result = await resolve('MintRequestService').retrieveListOfMintRequests(
			queryParams,
		)
	} catch (err) {
		return MessageUtil.error(400, err.message)
	}

	result = ListMetadata(
		queryParams,
		event.resource,
		result.totalCount,
		result.data,
	)

	return MessageUtil.success(200, result)
}
