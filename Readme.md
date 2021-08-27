<div id="splash">
    <div id="project">
          <span class="splash-title">
               Project
          </span>
          <br />
          <span id="project-value">
               HaloDAO Bridge Handler
          </span>
    </div>
     <div id="details">
          <div id="left">
               <span class="splash-title">
                    Client
               </span>
               <br />
               <span class="details-value">
                    HaloDAO
               </span>
               <br />
               <span class="splash-title">
                    Date
               </span>
               <br />
               <span class="details-value">
                    August 2021
               </span>
          </div>
          <div id="right">
               <span class="splash-title">
                    Reviewers
               </span>
               <br />
               <span class="details-value">
                    Andrei Simion
               </span><br />
               <span class="contact">@andreiashu</span>
               <br />
               <span class="details-value">
                    Daniel Luca
               </span><br />
               <span class="contact">@cleanunicorn</span>
          </div>
    </div>
</div>


## Table of Contents
 - [Details](#details)
 - [Issues Summary](#issues-summary)
 - [Executive summary](#executive-summary)
     - [Review progress and strategy](#review-progress-and-strategy)
 - [Trust model](#trust-model)
     - [Reliance on an external party for the safety of transactions and funds](#reliance-on-an-external-party-for-the-safety-of-transactions-and-funds)
     - [Centralised control of smart contracts and transfer handling scripts](#centralised-control-of-smart-contracts-and-transfer-handling-scripts)
 - [Scope](#scope)
 - [Issues](#issues)
     - [Minting to opposing chain can lead to loss of funds](#minting-to-opposing-chain-can-lead-to-loss-of-funds)
     - [HAL service might cause a double-spend in the Bridge - can lead to loss of funds](#hal-service-might-cause-a-double-spend-in-the-bridge---can-lead-to-loss-of-funds)
 - [License](#license)


## Details

- **Client** HaloDAO
- **Date** August 2021
- **Lead reviewer** Andrei Simion ([@andreiashu](https://twitter.com/andreiashu))
- **Reviewers** Daniel Luca ([@cleanunicorn](https://twitter.com/cleanunicorn)), Andrei Simion ([@andreiashu](https://twitter.com/andreiashu))
- **Repository**: [HaloDAO Bridge Handler](git@github.com:HaloDAO/serverless-bridge-handler.git)
- **Commit hash** `2c54d69a75fddaabc97eb140509c112ec8575828`
- **Technologies**
  - TypeScript

## Issues Summary

| SEVERITY       |    OPEN    |    CLOSED    |
|----------------|:----------:|:------------:|
|  Informational  |  0  |  0  |
|  Minor  |  0  |  0  |
|  Medium  |  0  |  0  |
|  Major  |  2  |  0  |

## Executive summary

This report represents the results of the engagement with **HaloDAO** to review **HaloDAO Bridge Handler**.

The review is part of a broader engagement with HaloDAO that includes several other components from the HaloDAO ecosystem (Halo Rewards, Halo AMM, Halo Bridge, Halo Bridge Handler).

The full review (across above-mentioned repositories) was conducted over the course of **2 weeks** from **16th of August to 27th of August, 2021**. We spent a total of **20 person-days** reviewing the code.


### Review progress and strategy

The HaloDAO Bridge sits between Ethereum mainnet and any other EVM compatible chain - Polygon being the first Layer 2 chain targeted for implementation.

We started by going through the Solidity smart contracts inside the HaloDAO Token Bridge repository and reading the TypeScript code within the HaloDAO Bridge Handler repository. To process transfers from Chain A to Chain B (e.g. Ethereum mainnet to Polygon), the Bridge Handler uses a service ([HAL](https://www.hal.xyz/)) that helps pass Events from a chain to a webhook endpoint. Specifically, when a `DepositReceived` Event is emitted from the `PrimaryBridge` smart contract, the HAL service will call the HaloDAO Bridge Handler endpoint. The Bridge Handler script calls the `mint` function on the `SecondaryBridge` smart contract to create the respective tokens on the destination chain.

Because of the nature of decentralized blockchains, it is critical that the code that interacts with any of the chains involved in the transfer process are aware of [_chain reorganization_ (or _reorg_)](https://learnmeabitcoin.com/technical/chain-reorganisation).

While discussing with the team, it became clear that the HAL service waits for three block confirmations before it considers a block as finalized. This is nowhere near the desired safety level for a cross-chain Bridge. For example, centralized exchanges use a minimum of 10 confirmations for any Ethereum / ERC20 transfer (we provide more details in #1).

The next question we asked ourselves was what should be a safe amount of block confirmations to consider a block as finalized for each of the chains involved. The Polygon chain has much faster block times and therefore requires a higher number of confirmations. We detailed our findings in issue #2.

We continued to review the code and communicate with the team while creating an overview of the architecture to help us better understand its trust model.

## Trust model

We identified a few essential parts of the system that hold increased trust and are critical to the system's correctness and well behavior.

### Reliance on an external party for the safety of transactions and funds

The HAL service has complete control over funds on all chains supported by the HaloDAO Bridge. For example, if HAL is compromised, an attacker __can drain funds__ out of the Ethereum mainnet `PrimaryBridge` contract. 

### Centralised control of smart contracts and transfer handling scripts

Currently, both the blockchain smart contracts and the HaloDAO Bridge Handler scripts are controlled by the HaloDAO team. If the (multi-sig) account that controls the smart contracts is compromised, user funds are at risk.

The Bridge Handler will have to run on a server (AWS infrastructure). Therefore, the cloud account(s) that have access to these scripts are also vulnerable to an attack.


## Scope

The initial review focused on the [HaloDAO Bridge Handler](git@github.com:HaloDAO/serverless-bridge-handler.git) repository, identified by the commit hash `2c54d69a75fddaabc97eb140509c112ec8575828`.

**Includes:**

- code/database/migrations/20210709195024_bridge_contracts.ts
- code/database/migrations/20210713001648_mint_requests.ts
- code/database/migrations/20210721125855_burns.ts
- code/database/migrations/20210721130355_redeem_requests.ts
- code/database/migrations/20210729010706_webhook_triggers.ts
- code/database/migrations/20210706173702_deposits.ts
- code/database/knex.ts
- code/database/seeds/bridge_contracts.ts
- code/database/seeds/webhook_triggers.ts
- code/app/middlewares/ListMetadata.ts
- code/app/utils/FeeCalculator.ts
- code/app/utils/logger.ts
- code/app/utils/message.ts
- code/app/utils/RepositoryQueryUtil.ts
- code/app/repositories/WebhookTriggerRepository.ts
- code/app/repositories/MintRequestRepository.ts
- code/app/repositories/DepositRepository.ts
- code/app/repositories/BaseRepository.ts
- code/app/repositories/RedeemRequestRepository.ts
- code/app/repositories/BurnRepository.ts
- code/app/repositories/BridgeContractRepository.ts
- code/app/external-services/SQSService.ts
- code/app/external-services/SecretsManagerService.ts
- code/app/container.ts
- code/app/factories/ParentBridge.ts
- code/app/factories/SecondaryBridge.ts
- code/app/factories/PrimaryBridge.ts
- code/app/factories/ChainProvider.ts
- code/app/factories/TokenContract.ts
- code/app/model/dto/MintRequest.ts
- code/app/model/dto/BridgeContract.ts
- code/app/model/dto/WebhookTrigger.ts
- code/app/model/dto/Burn.ts
- code/app/model/dto/Transaction.ts
- code/app/model/dto/Deposit.ts
- code/app/model/dto/RedeemRequest.ts
- code/app/model/vo/responseVo.ts
- code/app/model/vo/apiQueryVo.ts
- code/app/handler.ts
- code/app/env.ts
- code/app/handlers/SecondaryBridgeHandler.ts
- code/app/handlers/DepositHandler.ts
- code/app/handlers/MintRequestHandler.ts
- code/app/handlers/BurnHandler.ts
- code/app/handlers/RedeemRequestHandler.ts
- code/app/handlers/PrimaryBridgeHandler.ts
- code/app/services/SecondaryBridgeService.ts
- code/app/services/BurnService.ts
- code/app/services/RedeemRequestService.ts
- code/app/services/MintRequestService.ts
- code/app/services/DepositService.ts
- code/app/services/PrimaryBridgeService.ts
- code/tsconfig.json


## Issues


### [Minting to opposing chain can lead to loss of funds](https://github.com/monoceros-alpha/review-halo-bridge-handler-2021-08/issues/2)
![Issue status: Open](https://img.shields.io/static/v1?label=Status&message=Open&color=5856D6&style=flat-square) ![Major](https://img.shields.io/static/v1?label=Severity&message=Major&color=ff3b30&style=flat-square)

**Description**

A Bridge token transfer happens between two EVM compatible blockchains, each having its own [finality](https://medium.com/mechanism-labs/finality-in-blockchain-consensus-d1f83c120a9a) properties.

When the Bridge Handler is notified of a new transfer from the _source_ chain, it will issue a mint call on the _opposing chain_:


[code/app/factories/SecondaryBridge.ts#L34-L48](https://github.com/monoceros-alpha/review-halo-bridge-handler-2021-08/blob/4f5ebacbe26a36b4c1e92b43b38a977947b827b5/code/app/factories/SecondaryBridge.ts#L34-L48)
```
	public async mintToOpposingChain(
		recipientAddress: string,
		amount: number,
	): Promise<ISignedMintTx> {
		const METHOD = '[mintToOpposingChain]'
		log.info(`${TAG} ${this.chainId} ${this.bridgeContractAddress} - ${METHOD}`)

		let result

		try {
			result = await this.bridgeContract.populateTransaction.mint(
				recipientAddress,
				amount,
			)
		} catch (BridgeError) {
```

The issue with this approach is that the code above assumes that the write operation on the _opposing chain_ if confirmed, is also finalized. This is not the case. For example, when the opposing chain is Polygon, reorgs happen very frequently (and with high reorg depth, below we can see a 44 depth):

<img width="1396" alt="Block forks on Polygon" src="https://user-images.githubusercontent.com/342638/129652615-b7b8d4ff-73cd-44e2-b07f-c4077bc67b69.png">

**Recommendation**

Ensure that code that writes to the opposing chain is aware of the difference between a transaction that has been confirmed and one that can be considered finalized.

Regarding how many confirmations to wait before a block should be considered finalized, it's best to err on the side of caution. We recommend finding out what other bridge platforms or centralized exchanges that work with each of the opposing chains do.

The [Matic/Polygon Bridge](https://wallet.matic.network/login) will wait for up to 8 minutes before minting a transfer from Ethereum mainnet to Polygon chain - given that the average block time on Polygon is around [2.5 seconds](https://polygonscan.com/chart/blocktime) this would mean waiting for a **minimum of 192 blocks depth** before considering a transaction in it as finalized.

<img width="580" alt="Polygon Bridge: Ethereum to Polygon transfer times" src="https://user-images.githubusercontent.com/342638/129828771-9ea10b8c-367f-4c80-9c0c-82967df10042.png">

**References**

* [Polygon Blocks Forked](https://polygonscan.com/blocks_forked) 
* [Reorgs and Other Blockchain Quirkiness: Polyroll Update v2.01](https://polyroll.medium.com/reorgs-and-other-blockchain-quirkiness-polyroll-game-update-v2-01-63c12e6829ac)
* [Matic/Polygon Bridge](https://wallet.matic.network/bridge/)
* [Polygon Block Time Chart](https://polygonscan.com/chart/blocktime)

---



### [HAL service might cause a double-spend in the Bridge - can lead to loss of funds](https://github.com/monoceros-alpha/review-halo-bridge-handler-2021-08/issues/1)
![Issue status: Open](https://img.shields.io/static/v1?label=Status&message=Open&color=5856D6&style=flat-square) ![Major](https://img.shields.io/static/v1?label=Severity&message=Major&color=ff3b30&style=flat-square)

**Description**

The HaloDAO bridge uses the [HAL](https://www.hal.xyz/) service in order to initiate a token transfer from the source chain to a destination chain.

When the source chain is Ethereum mainnet, the Halo team informed us that the HAL service uses 3 block confirmations before it fires a notification to the Halo Bridge webhook handler.

The issue here is that 3 confirmations are not nearly enough to consider a block as final. It was trivial to find a block with a [Re-Org depth of 3 blocks](https://etherscan.io/block/12784345/f) within the last 2 months.

Granted, the Ethereum PoW blockchain only gives [Probabilistic Finality](https://medium.com/mechanism-labs/finality-in-blockchain-consensus-d1f83c120a9a) - the probability that a transaction will not be reverted increases as the block which contains that transaction sinks deeper into the chain. Therefore we want to aim for a much higher block confirmation number than what HAL service currently has.

The more general issue is that the HAL service, with its current settings, is targeted more towards end-user and non-critical types of applications, where an extra event fired for a block that does not end up in the main chain, can be handled gracefully/ignored. In the case of a cross-chain bridge, this type of issue can cause a double-spend transaction with the consequence of **loss of funds of its users**.

**Recommendation**

A cross-chain bridge, within the context of block finality, is not different than a centralized exchange: security needs to be paramount.

Therefore block finality should be increased to match what other reputable exchanges use for ERC20 token deposits:

| Coinbase | Kraken | Binance | FTX |
|----------|----------|----------|----------|
| [35](https://help.coinbase.com/en/coinbase/trading-and-funding/cryptocurrency-trading-pairs/uni) | [20](https://support.kraken.com/hc/en-us/articles/203325283-Cryptocurrency-deposit-processing-times) | [12](https://www.binance.com/en/support/announcement/360030775291) | [10](https://help.ftx.com/hc/en-us/articles/360034865571-Blockchain-Deposits-and-Withdrawals)

Additionally, we recommend having a Service Level Agreement (SLA) with a service provider like HAL, that clearly outlines the availability and quality of the service provided. As an example, separate infrastructure from the end-user HAL infrastructure might mean that HALO Bridge is not affected when HAL experiences load from their free / end-user accounts.


**References**

* [Finality in Blockchain Consensus](https://medium.com/mechanism-labs/finality-in-blockchain-consensus-d1f83c120a9a)
* [Re-Org depth of 3 blocks](https://etherscan.io/block/12784345/f)
* [Kraken Cryptocurrency deposit processing times](https://support.kraken.com/hc/en-us/articles/203325283-Cryptocurrency-deposit-processing-times)
* [Coinbase Uniswap deposit processing times](https://help.coinbase.com/en/coinbase/trading-and-funding/cryptocurrency-trading-pairs/uni)
* [Binance Reduces the Number of Confirmations Required for Deposits & Withdrawals on BTC and ETH Networks](https://www.binance.com/en/support/announcement/360030775291)
* [FTX Blockchain Deposits and Withdrawals](https://help.ftx.com/hc/en-us/articles/360034865571-Blockchain-Deposits-and-Withdrawals)

---




## License

This report falls under the terms described in the included [LICENSE](./LICENSE).

<!-- Load highlight.js -->
<link rel="stylesheet"
href="//cdnjs.cloudflare.com/ajax/libs/highlight.js/10.4.1/styles/default.min.css">
<script src="//cdnjs.cloudflare.com/ajax/libs/highlight.js/10.4.1/highlight.min.js"></script>
<script>hljs.initHighlightingOnLoad();</script>
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/highlightjs-solidity@1.0.20/solidity.min.js"></script>
<script type="text/javascript">
    hljs.registerLanguage('solidity', window.hljsDefineSolidity);
    hljs.initHighlightingOnLoad();
</script>
<link rel="stylesheet" href="./style/print.css"/>
