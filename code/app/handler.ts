import { Handler } from 'aws-lambda'
import './env'

import {
	handleReceiveDepositCallback,
	processBurnSQSMessage,
	handleReleaseTxVerification,
} from './handlers/PrimaryBridgeHandler'
import {
	handleMintTxVerification,
	processDepositSQSMessage,
	handleReceiveBurnCallback,
} from './handlers/SecondaryBridgeHandler'
import { retrieveListOfMintRequests } from './handlers/MintRequestHandler'
import { retrieveListOfRedeemRequests } from './handlers/RedeemRequestHandler'
import { retrieveListOfDeposits } from './handlers/DepositHandler'
import { retrieveListOfBurns } from './handlers/BurnHandler'

export const receiveDepositCallback: Handler = handleReceiveDepositCallback

export const processDeposit: Handler = processDepositSQSMessage

export const verifyMintTx: Handler = handleMintTxVerification

export const receiveBurnCallback: Handler = handleReceiveBurnCallback

export const processBurn: Handler = processBurnSQSMessage

export const verifyReleaseTx: Handler = handleReleaseTxVerification

export const getListOfDeposits: Handler = retrieveListOfDeposits

export const getListOfBurns: Handler = retrieveListOfBurns

export const getListOfMintRequests: Handler = retrieveListOfMintRequests

export const getListOfRedeemRequests: Handler = retrieveListOfRedeemRequests
