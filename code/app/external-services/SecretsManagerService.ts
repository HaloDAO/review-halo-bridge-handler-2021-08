import { SecretsManager } from 'aws-sdk'

import log from '../utils/Logger'

const TAG = '[SecretsManagerService]'

export default class SecretsManagerService {
	private readonly secretsManager: SecretsManager

	constructor() {
		this.secretsManager = new SecretsManager({
			apiVersion:
				(process.env.SECRET_MANAGER_API_VERSION as string) || '2017-10-17',
		})
	}

	public async getSecret(secretId: string, key): Promise<any> {
		const METHOD = '[getSecret]'
		log.info(`${TAG} ${METHOD}`)

		let result: SecretsManager.GetSecretValueResponse
		try {
			result = await this.secretsManager
				.getSecretValue({ SecretId: secretId })
				.promise()
		} catch (SecretManagerError) {
			log.error(SecretManagerError)
			throw new Error(SecretManagerError)
		}

		return JSON.parse(result.SecretString)[key]
	}
}
