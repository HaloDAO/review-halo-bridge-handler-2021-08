import { omit } from 'lodash'
import log from '../utils/Logger'

import WebhookTriggerRepository from '../repositories/WebhookTriggerRepository'
import DepositRepository from '../repositories/DepositRepository'
import BurnRepository from '../repositories/BurnRepository'
import BridgeContractRepository from '../repositories/BridgeContractRepository'
import MintRequestRepository from '../repositories/MintRequestRepository'
import SQSService from '../external-services/SQSService'
import ChainProvider from '../factories/ChainProvider'
import SecondaryBridge from '../factories/SecondaryBridge'
import PrimaryBridge from '../factories/PrimaryBridge'
import SecretsManagerService from '../external-services/SecretsManagerService'

import { IBridgeContract } from '../model/dto/BridgeContract'
import { IMintRequestDto, ISignedMintTx } from '../model/dto/MintRequest'
import { TransactionReceipt } from '../model/dto/Transaction'
import { IBurnDto } from '../model/dto/Burn'

import { getBridgeRedeemFee } from '../utils/FeeCalculator'

const TAG = '[MintRequestService]'

export default class MintRequestService {
	private readonly _webhookTriggerRepository: WebhookTriggerRepository
	private readonly _depositRepository: DepositRepository
	private readonly _burnRepository: BurnRepository
	private readonly _bridgeContractRepository: BridgeContractRepository
	private readonly _mintRequestRepository: MintRequestRepository
	private readonly _sqsService: SQSService
	private readonly _secretManagerService: SecretsManagerService

	constructor({
		WebhookTriggerRepository,
		DepositRepository,
		BurnRepository,
		BridgeContractRepository,
		MintRequestRepository,
		SQSService,
		SecretsManagerService,
	}) {
		this._webhookTriggerRepository = WebhookTriggerRepository
		this._depositRepository = DepositRepository
		this._burnRepository = BurnRepository
		this._bridgeContractRepository = BridgeContractRepository
		this._mintRequestRepository = MintRequestRepository
		this._sqsService = SQSService
		this._secretManagerService = SecretsManagerService
	}

	public async processDeposit(populatedMintTx: ISignedMintTx): Promise<any> {
		const METHOD = '[processDeposit]'
		log.info(`${TAG} ${METHOD}`)

		let depositTx
		try {
			depositTx = await this._depositRepository.findOneByCondition({
				txReceipt: populatedMintTx.depositTxId,
			})
		} catch (DBError) {
			log.error(DBError)
			await this._sqsService.sendMessage(
				process.env.ERROR_SQS_URL,
				DBError.message,
			)
			throw new Error('Please contact support. Transaction failed.')
		}

		const existingMintTx = await this._mintRequestRepository.findOneByCondition(
			{ depositTxId: populatedMintTx.depositTxId },
		)

		if (existingMintTx && existingMintTx.isSuccessful) return

		const walletMnemonic = await this._secretManagerService.getSecret(
			'WALLET_MNEMONIC',
			populatedMintTx.adminKeyName,
		)

		const bridgeContract = new SecondaryBridge(
			depositTx.bridgeContractAddress,
			depositTx.token,
			depositTx.chainIdDestination,
			walletMnemonic,
		)

		let mintTx
		try {
			mintTx = await bridgeContract.sendTransaction(
				omit(populatedMintTx, ['depositTxId', 'adminKeyName']),
			)
		} catch (ChainError) {
			log.error(ChainError)
			await this._sqsService.sendMessage(
				process.env.ERROR_SQS_URL,
				ChainError.message,
			)
			throw new Error('Please contact support. Transaction failed.')
		}

		if (!existingMintTx) {
			const mintRequest: IMintRequestDto = {
				bridgeContractAddress: depositTx.bridgeContractAddress,
				account: depositTx.account,
				chainIdOrigin: depositTx.chainIdOrigin,
				chainIdDestination: depositTx.chainIdDestination,
				amount: Number(depositTx.amount),
				depositTxId: depositTx.txReceipt,
				signedTx: populatedMintTx.data,
				nonce: mintTx.nonce,
				txReceipt: mintTx.hash,
			}

			await this._mintRequestRepository.insert(mintRequest)
		}
		let result
		try {
			result = await this._sqsService.sendMessage(
				process.env.MINT_SQS_URL,
				mintTx,
				Number(process.env.MINT_TX_CONFIRMATION_PERIOD),
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

	public async verifyMintTx(mintTx: TransactionReceipt): Promise<any> {
		const METHOD = '[verifyMintTx]'
		log.info(`${TAG} ${METHOD}`)

		let result

		/** Verify based on chain ID */
		const txReceipt = await new ChainProvider(
			mintTx.chainId,
		).getTransactionReceipt(mintTx.hash)

		try {
			/** Transaction has been mined */
			if (txReceipt && txReceipt.status === 1) {
				await this._mintRequestRepository.updateOneByCondition(
					{ txReceipt: mintTx.hash },
					{ isSuccessful: true },
				)
				result = txReceipt
				log.info('Transaction is successful')
			} else {
				/** Transaction has not been mined */
				log.error('Transaction is not sucessful')
				const tx = await this._mintRequestRepository.findOneByCondition({
					txReceipt: mintTx.hash,
				})
				log.info(`${tx.txReceipt} - retry: ${tx.retryCount}`)
				if (tx.retryCount >= 5) {
					let bridgeRecord: IBridgeContract
					try {
						bridgeRecord =
							await this._bridgeContractRepository.findOneByCondition({
								bridgeContractAddress: mintTx.to,
								chainId: mintTx.chainId,
							})
					} catch (RetryError) {
						log.error(RetryError)
						await this._sqsService.sendMessage(
							process.env.ERROR_SQS_URL,
							RetryError.message,
						)
						throw new Error('Please contact support. Transaction failed.')
					}

					const walletMnemonic = await this._secretManagerService.getSecret(
						'WALLET_MNEMONIC',
						bridgeRecord.adminKeyName,
					)

					const bridgeContract = new SecondaryBridge(
						bridgeRecord.bridgeContractAddress,
						bridgeRecord.wrappedTokenContractAddress,
						mintTx.chainId,
						walletMnemonic,
					)

					/** If tx was not sucessful, populate transaction */
					const populatedMintTx: ISignedMintTx =
						await bridgeContract.mintToOpposingChain(tx.account, tx.amount)
					populatedMintTx.depositTxId = tx.depositTxId

					await this._mintRequestRepository.deleteOneByCondition({
						depositTxId: tx.depositTxId,
					})

					/** Send to Deposit Queue again to be processed */
					result = await this._sqsService.sendMessage(
						process.env.DEPOSIT_SQS_URL,
						populatedMintTx,
					)
				} else {
					await this._mintRequestRepository.updateOneByCondition(
						{ depositTxId: tx.depositTxId },
						{ retryCount: tx.retryCount + 1 },
					)
					/** Send to Mint SQS again to verify again. NOTE: Consider incrementing delay time as retry count increases */
					result = await this._sqsService.sendMessage(
						process.env.MINT_SQS_URL,
						mintTx,
						tx.retryCount++ * Number(process.env.MINT_TX_CONFIRMATION_PERIOD),
					)
				}
			}
		} catch (ChainError) {
			log.error(ChainError)
			await this._sqsService.sendMessage(
				process.env.ERROR_SQS_URL,
				ChainError.message,
			)
			throw new Error('Please contact support. Transaction failed.')
		}

		return result
	}

	public async handleReceiveBurnCallback(burnCallback): Promise<any> {
		const METHOD = '[handleReceiveBurnCallback]'
		log.info(`${TAG} ${METHOD}`)

		const { amount, chainId, timestamp, from } =
			burnCallback.EventData.EventParameters

		const burnTxReceipt = burnCallback.Transaction.Hash

		let webhookTrigger
		try {
			webhookTrigger = await this._webhookTriggerRepository.findOneByCondition({
				eventBrokerTriggerId: burnCallback.TriggerUUID,
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
				burnTxReceipt,
			))
		)
			throw new Error('Burn transaction does not exist.')

		let bridgeContract
		try {
			bridgeContract = await this._bridgeContractRepository.findOneByCondition({
				chainId: Number(chainId),
				bridgeContractAddress: burnCallback.ContractAdd,
			})
		} catch (DBError) {
			log.error(DBError)
			await this._sqsService.sendMessage(
				process.env.ERROR_SQS_URL,
				DBError.message,
			)
			throw new Error('Invalid Bridge Contract.')
		}

		let parentBridgeContract
		try {
			parentBridgeContract =
				await this._bridgeContractRepository.findOneByCondition({
					bridgeContractAddress: bridgeContract.parentBridgeContractAddress,
				})
		} catch (DBError) {
			log.error(DBError)
			await this._sqsService.sendMessage(
				process.env.ERROR_SQS_URL,
				DBError.message,
			)
			throw new Error('Invalid Bridge Contract.')
		}

		const burnTx: IBurnDto = {
			bridgeContractAddress: bridgeContract.parentBridgeContractAddress,
			tokenContractAddress: bridgeContract.tokenContractAddress,
			amount,
			account: from,
			block: timestamp,
			chainIdDestination: Number(parentBridgeContract.chainId),
			chainIdOrigin: Number(bridgeContract.chainId),
			token: bridgeContract.tokenContractAddress,
			txReceipt: burnTxReceipt,
		}

		try {
			await this._burnRepository.insert(burnTx)
		} catch (DBError) {
			log.error(DBError)
			await this._sqsService.sendMessage(
				process.env.ERROR_SQS_URL,
				DBError.message,
			)
			throw new Error('Please contact support. Transaction failed.')
		}

		const walletMnemonic = await this._secretManagerService.getSecret(
			'WALLET_MNEMONIC',
			bridgeContract.adminKeyName,
		)

		const netFee = getBridgeRedeemFee(amount, bridgeContract.txFee)

		bridgeContract = new PrimaryBridge(
			bridgeContract.parentBridgeContractAddress,
			bridgeContract.tokenContractAddress,
			chainId,
			walletMnemonic,
		)

		let populatedReleaseTx
		try {
			populatedReleaseTx = await bridgeContract.release(netFee, from, chainId)
		} catch (PopulateError) {
			log.error(PopulateError)
			await this._sqsService.sendMessage(
				process.env.ERROR_SQS_URL,
				PopulateError.message,
			)
			throw new Error('Please contact support. Transaction failed.')
		}

		populatedReleaseTx.burnTxId = burnCallback.Transaction.Hash

		let result

		try {
			result = await this._sqsService.sendMessage(
				process.env.BURN_SQS_URL,
				populatedReleaseTx,
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
}
