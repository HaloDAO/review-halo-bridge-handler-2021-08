import log from '../utils/Logger'
import { omit } from 'lodash'

import ChainProvider from '../factories/ChainProvider'
import WebhookTriggerRepository from '../repositories/WebhookTriggerRepository'
import BridgeContractRepository from '../repositories/BridgeContractRepository'
import DepositRepository from '../repositories/DepositRepository'
import BurnRepository from '../repositories/BurnRepository'
import RedeemRequestRepository from '../repositories/RedeemRequestRepository'
import SQSService from '../external-services/SQSService'
import SecondaryBridge from '../factories/SecondaryBridge'
import PrimaryBridge from '../factories/PrimaryBridge'
import SecretsManagerService from '../external-services/SecretsManagerService'

import { IDepositDto } from '../model/dto/Deposit'
import { IRedeemRequestDto } from '../model/dto/RedeemRequest'
import { TransactionReceipt } from '../model/dto/Transaction'

import { getBridgeMintFee } from '../utils/FeeCalculator'

const TAG = '[DepositService]'
export default class DepositService {
	private readonly _webhookTriggerRepository: WebhookTriggerRepository
	private readonly _bridgeContractRepository: BridgeContractRepository
	private readonly _depositRepository: DepositRepository
	private readonly _burnRepository: BurnRepository
	private readonly _redeemRequestRepository: RedeemRequestRepository
	private readonly _sqsService: SQSService
	private readonly _secretManagerService: SecretsManagerService

	constructor({
		WebhookTriggerRepository,
		BridgeContractRepository,
		DepositRepository,
		BurnRepository,
		RedeemRequestRepository,
		SQSService,
		SecretsManagerService,
	}) {
		this._webhookTriggerRepository = WebhookTriggerRepository
		this._bridgeContractRepository = BridgeContractRepository
		this._depositRepository = DepositRepository
		this._burnRepository = BurnRepository
		this._redeemRequestRepository = RedeemRequestRepository
		this._sqsService = SQSService
		this._secretManagerService = SecretsManagerService
	}

	public async handleReceiveDepositCallback(depositCallback): Promise<any> {
		const METHOD = '[handleReceiveDepositCallback]'
		log.info(`${TAG} ${METHOD}`)

		const { amount, chainId, from, timestamp } =
			depositCallback.EventData.EventParameters
		const depositTxReceipt = depositCallback.Transaction.Hash

		let webhookTrigger
		try {
			webhookTrigger = await this._webhookTriggerRepository.findOneByCondition({
				eventBrokerTriggerId: depositCallback.TriggerUUID,
			})
		} catch (DBError) {
			log.error(DBError)
			await this._sqsService.sendMessage(
				process.env.ERROR_SQS_URL,
				DBError.message,
			)
			throw new Error('Invalid Bridge Contract.')
		}

		if (!webhookTrigger) throw new Error('No webhook trigger found.')
		if (
			!(await new ChainProvider(webhookTrigger.chainIdOrigin).verifyTransaction(
				depositTxReceipt,
			))
		)
			throw new Error('Deposit transaction does not exist.')

		let bridgeContract
		try {
			bridgeContract = await this._bridgeContractRepository.findOneByCondition({
				chainId,
				tokenContractAddress: webhookTrigger.tokenContractAddress,
			})
		} catch (DBError) {
			log.error(DBError)
			await this._sqsService.sendMessage(
				process.env.ERROR_SQS_URL,
				DBError.message,
			)
			throw new Error('Invalid Bridge Contract.')
		}

		const depositTx: IDepositDto = {
			bridgeContractAddress: bridgeContract.bridgeContractAddress,
			tokenContractAddress: bridgeContract.tokenContractAddress,
			amount,
			account: from,
			block: timestamp,
			chainIdDestination: Number(chainId),
			chainIdOrigin: Number(bridgeContract.chainId),
			token: bridgeContract.tokenContractAddress,
			txReceipt: depositTxReceipt,
		}

		try {
			await this._depositRepository.insert(depositTx)
		} catch (DBError) {
			log.error(DBError)
			await this._sqsService.sendMessage(
				process.env.ERROR_SQS_URL,
				DBError.message,
			)
			throw new Error('Please contact support. Transaction failed.')
		}

		const adminKeyName = bridgeContract.adminKeyName

		const walletMnemonic = await this._secretManagerService.getSecret(
			'WALLET_MNEMONIC',
			adminKeyName,
		)

		const netAmount = getBridgeMintFee(amount, bridgeContract.txFee)

		bridgeContract = new SecondaryBridge(
			bridgeContract.bridgeContractAddress,
			bridgeContract.wrappedTokenContractAddress,
			chainId,
			walletMnemonic,
		)

		let populatedMintTx
		try {
			populatedMintTx = await bridgeContract.mintToOpposingChain(
				depositTx.account,
				netAmount,
			)
		} catch (SignError) {
			log.error(SignError)
			await this._sqsService.sendMessage(
				process.env.ERROR_SQS_URL,
				SignError.message,
			)
			throw new Error('Please contact support. Transaction failed.')
		}

		populatedMintTx.depositTxId = depositCallback.Transaction.Hash
		populatedMintTx.adminKeyName = adminKeyName

		let result

		try {
			result = await this._sqsService.sendMessage(
				process.env.DEPOSIT_SQS_URL,
				populatedMintTx,
			)
		} catch (QueueError) {
			log.error(QueueError)
			await this._sqsService.sendMessage(
				process.env.ERROR_SQS_URL,
				QueueError.message,
			)
			throw new Error('Please contact support. Transaction failed.')
		}
		return result
	}

	public async processBurn(populatedBurnTx): Promise<any> {
		const METHOD = '[processBurn]'
		log.info(`${TAG} ${METHOD}`)

		let burnTx
		try {
			burnTx = await this._burnRepository.findOneByCondition({
				txReceipt: populatedBurnTx.burnTxId,
			})
		} catch (DBError) {
			log.error(DBError)
			await this._sqsService.sendMessage(
				process.env.ERROR_SQS_URL,
				DBError.message,
			)
			throw new Error('Please contact support. Transaction failed.')
		}

		const existingRedeemTx =
			await this._redeemRequestRepository.findOneByCondition({
				burnTxId: populatedBurnTx.burnTxId,
			})

		if (existingRedeemTx && existingRedeemTx.isSuccessful) return

		let parentBridgeContract
		try {
			parentBridgeContract =
				await this._bridgeContractRepository.findOneByCondition({
					bridgeContractAddress: burnTx.bridgeContractAddress,
				})
		} catch (DBError) {
			log.error(DBError)
			await this._sqsService.sendMessage(
				process.env.ERROR_SQS_URL,
				DBError.message,
			)
			throw new Error('Invalid Bridge Contract.')
		}

		const walletMnemonic = await this._secretManagerService.getSecret(
			'WALLET_MNEMONIC',
			parentBridgeContract.adminKeyName,
		)

		const bridgeContract = new PrimaryBridge(
			burnTx.bridgeContractAddress,
			burnTx.tokenContractAddress,
			burnTx.chainIdDestination,
			walletMnemonic,
		)

		let releaseTx
		try {
			releaseTx = await bridgeContract.sendTransaction(
				omit(populatedBurnTx, 'burnTxId') as any,
			)
		} catch (ChainError) {
			log.error(ChainError)
			await this._sqsService.sendMessage(
				process.env.ERROR_SQS_URL,
				ChainError.message,
			)

			await this._sqsService.sendMessage(
				process.env.BURN_SQS_URL,
				populatedBurnTx,
			)

			throw new Error('Please contact support. Transaction failed.')
		}

		if (!existingRedeemTx) {
			const redeemRequest: IRedeemRequestDto = {
				bridgeContractAddress: burnTx.bridgeContractAddress,
				account: burnTx.account,
				chainIdOrigin: burnTx.chainIdOrigin,
				chainIdDestination: burnTx.chainIdDestination,
				amount: Number(burnTx.amount),
				burnTxId: burnTx.txReceipt,
				signedTx: populatedBurnTx.data,
				nonce: releaseTx.nonce,
				txReceipt: releaseTx.hash,
			}

			await this._redeemRequestRepository.insert(redeemRequest)
		}

		let result
		try {
			result = await this._sqsService.sendMessage(
				process.env.REDEEM_SQS_URL,
				releaseTx,
				Number(process.env.RELEASE_TX_CONFIRMATION_PERIOD),
			)
		} catch (QueueError) {
			log.error(QueueError)
			await this._sqsService.sendMessage(
				process.env.ERROR_SQS_URL,
				QueueError.message,
			)
			throw new Error('Please contact support. Transaction failed.')
		}
		return result
	}

	public async verifyReleaseTx(releaseTx: TransactionReceipt): Promise<any> {
		const METHOD = '[verifyReleaseTx]'
		log.info(`${TAG} ${METHOD}`)

		let result

		const txReceipt = await new ChainProvider(
			releaseTx.chainId,
		).getTransactionReceipt(releaseTx.hash)

		console.log('txReceipt:', txReceipt)

		try {
			/** Transaction has been mined */
			if (txReceipt && txReceipt.status === 1) {
				await this._redeemRequestRepository.updateOneByCondition(
					{ txReceipt: releaseTx.hash },
					{ isSuccessful: true },
				)
				result = txReceipt
				log.info(`Transaction is sucessful`)
			} else {
				/** Transaction has not been confirmed */
				log.error('Transaction is not sucessful')
				const tx = await this._redeemRequestRepository.findOneByCondition({
					txReceipt: releaseTx.hash,
				})
				log.info(`${tx.txReceipt} - retry: ${tx.retryCount}`)
				if (tx.retryCount >= 5) {
					const bridgeRecord =
						await this._bridgeContractRepository.findOneByCondition({
							parentBridgeContractAddress: releaseTx.to,
						})

					const walletMnemonic = await this._secretManagerService.getSecret(
						'WALLET_MNEMONIC',
						bridgeRecord.adminKeyName,
					)

					const bridgeContract = new PrimaryBridge(
						bridgeRecord.bridgeContractAddress,
						bridgeRecord.tokenContractAddress,
						bridgeRecord.chainId,
						walletMnemonic,
					)

					/** Populate transaction */
					const populatedReleaseTx = await bridgeContract.release(
						tx.amount,
						tx.account,
						tx.chainIdDestination,
					)

					populatedReleaseTx.burnTxId = tx.burnTxId

					/** Send to Burn Queue again to be processed */
					result = await this._sqsService.sendMessage(
						process.env.BURN_SQS_URL,
						populatedReleaseTx,
					)
				} else {
					await this._redeemRequestRepository.updateOneByCondition(
						{ burnTxId: tx.burnTxId },
						{ retryCount: tx.retryCount + 1 },
					)

					/** Send to Redeem SQS again to verify again. NOTE: Consider incrementing delay time as retry count increases */
					result = await this._sqsService.sendMessage(
						process.env.REDEEM_SQS_URL,
						releaseTx,
						tx.retryCount++ *
							Number(process.env.RELEASE_TX_CONFIRMATION_PERIOD),
					)
				}
			}
		} catch (ArbitraryError) {
			log.error(ArbitraryError)
			await this._sqsService.sendMessage(
				process.env.ERROR_SQS_URL,
				ArbitraryError.message,
			)
			throw new Error('Please contact support. Transaction failed.')
		}

		return result
	}
}
