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
                    Daniel Luca
               </span><br />
               <span class="contact">@cleanunicorn</span>
               <br />
               <span class="details-value">
                    Andrei Simion
               </span><br />
               <span class="contact">@andreiashu</span>
          </div>
    </div>
</div>


## Table of Contents
 - [Details](#details)
 - [Issues Summary](#issues-summary)
 - [Executive summary](#executive-summary)
     - [Review progress and strategy](#review-progress-and-strategy)
 - [Trust model](#trust-model)
     - [Reliance on an external party for safety of transactions and funds](#reliance-on-an-external-party-for-safety-of-transactions-and-funds)
     - [Centralised control of smart contracts and transfer handling scripts](#centralised-control-of-smart-contracts-and-transfer-handling-scripts)
 - [Scope](#scope)
 - [Recommendations](#recommendations)
 - [Issues](#issues)
     - [Minting to opposing chain leads to loss of/stuck funds](#minting-to-opposing-chain-leads-to-loss-ofstuck-funds)
     - [HAL service might cause a double-spend in the Bridge - leads to loss of funds](#hal-service-might-cause-a-double-spend-in-the-bridge---leads-to-loss-of-funds)
 - [Artifacts](#artifacts)
     - [Surya](#surya)
     - [Coverage](#coverage)
     - [Tests](#tests)
 - [License](#license)


## Details

- **Client** HaloDAO
- **Date** August 2021
- **Lead reviewer** Daniel Luca ([@cleanunicorn](https://twitter.com/cleanunicorn))
- **Reviewers** Daniel Luca ([@cleanunicorn](https://twitter.com/cleanunicorn)), Andrei Simion ([@andreiashu](https://twitter.com/andreiashu))
- **Repository**: [HaloDAO Bridge Handler](git@github.com:HaloDAO/serverless-bridge-handler.git)
- **Commit hash** `2c54d69a75fddaabc97eb140509c112ec8575828`
- **Technologies**
  - Solidity
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

The review is part of a wider one, which includes several other components from the HaloDAO ecosystem: (Halo Rewards, Halo AMM, Halo Bridge, Halo Bridge Handler). It was conducted over the course of **2 weeks** from **16th of August to 27th of August, 2021**. A total of **20 person-days** were spent reviewing the code.

### Review progress and strategy

The HaloDAO Bridge sits between Ethereum mainnet and any other EVM compatible chain - Polygon being the first Layer 2 chain targeted for implementation.

We started by going through the Solidity smart contracts inside the HaloDAO Token Bridge repository as well as reading the TypeScript code within the HaloDAO Bridge Handler repository. In order to process transfers from Chain A to Chain B (eg. Ethereum mainnet to Polygon), the Bridge Handler uses a service ([HAL](https://www.hal.xyz/)) that helps pass Events from a chain to a webhook endpoint. Specifically, when a `DepositReceived` Event is emitted from the `PrimaryBridge` smart contract, the HAL service will call the HaloDAO Bridge Handler endpoint. From here the Bridge Handler script calls `mint` function on the `SecondaryBridge` smart contract in order to create the respective tokens on the destination chain.

Because of the nature of decentralized blockchains, it is critical that the code that interactions with any of the chains involved in the transfer process are aware of [_chain reorganisation_ (or _reorg_)](https://learnmeabitcoin.com/technical/chain-reorganisation).

While discussing with the team it became clear early on that the HAL service waits for 3 block confirmations before it considers a block as finalized. This is nowhere near the desired safety level for a cross-chain Bridge: for example, centralised exchanges use a minimum of 10 confirmations for any Ethereum / ERC20 transfer (we detailed this in issue #1).

The next question we asked ourselves was what should be a safe amount of block confirmations to consider a block as finalized for each of the chains involved. The Polygon chain has much faster block times and therefore requires a higher number of confirmations. We detailed our findings about this in issue #1.

We continued to review the code, while creating an overview of the architecture to help us have a better understanding of its trust model.

## Trust model

We identified a few important parts of the system that hold increased trust and are critical to the system's correctness and well behavior.

### Reliance on an external party for safety of transactions and funds

In its current form, the HAL service has full control over funds on all chains supported by the HaloDAO Bridge. For example, if HAL is compromised, an attacker __is able to drain funds__ out of the Ethereum mainnet `PrimaryBridge` contract. 

### Centralised control of smart contracts and transfer handling scripts

Currently both the blockchain smart contracts and the HaloDAO Bridge Handler scripts are controlled by the HaloDAO team. If the (multisig) account that controls the smart contracts is compromised, user funds are at risk.

The Bridge Handler will have to run on a server (AWS infrastructure), therefore the cloud account(s) that have access to these scripts are vulnerable to an attack as well.


## Scope

The initial review focused on the [HaloDAO Bridge Handler](git@github.com:HaloDAO/serverless-bridge-handler.git) repository, identified by the commit hash `2c54d69a75fddaabc97eb140509c112ec8575828`.

<!-- We focused on manually reviewing the codebase, searching for security issues such as, but not limited to, re-entrancy problems, transaction ordering, block timestamp dependency, exception handling, call stack depth limitation, integer overflow/underflow, self-destructible contracts, unsecured balance, use of origin, costly gas patterns, architectural problems, code readability. -->

**Includes:**
- GoodContract.sol

**Excludes:**
- BadContract.sol

## Recommendations

We identified a few possible general improvements that are not security issues during the review, which will bring value to the developers and the community reviewing and using the product.

<!-- ### Increase the number of tests

A good rule of thumb is to have 100% test coverage. This does not guarantee the lack of security problems, but it means that the desired functionality behaves as intended. The negative tests also bring a lot of value because not allowing some actions to happen is also part of the desired behavior.

-->

<!-- ### Set up Continuous Integration

Use one of the platforms that offer Continuous Integration services and implement a list of actions that compile, test, run coverage and create alerts when the pipeline fails.

Because the repository is hosted on GitHub, the most painless way to set up the Continuous Integration is through [GitHub Actions](https://docs.github.com/en/free-pro-team@latest/actions).

Setting up the workflow can start based on this example template.


```yml
name: Continuous Integration

on:
  push:
    branches: [master]
  pull_request:
    branches: [master]

jobs:
  build:
    name: Build and test
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [12.x]
    steps:
    - uses: actions/checkout@v2
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v1
      with:
        node-version: ${{ matrix.node-version }}
    - run: npm ci
    - run: cp ./config.sample.js ./config.js
    - run: npm test

  coverage:
    name: Coverage
    needs: build
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [12.x]
    steps:
    - uses: actions/checkout@v2
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v1
      with:
        node-version: ${{ matrix.node-version }}
    - run: npm ci
    - run: cp ./config.sample.js ./config.js
    - run: npm run coverage
    - uses: actions/upload-artifact@v2
      with:
        name: Coverage ${{ matrix.node-version }}
        path: |
          coverage/
```

This CI template activates on pushes and pull requests on the **master** branch.

```yml
on:
  push:
    branches: [master]
  pull_request:
    branches: [master]
```

It uses an [Ubuntu Docker](https://hub.docker.com/_/ubuntu) image as a base for setting up the project.

```yml
    runs-on: ubuntu-latest
```

Multiple Node.js versions can be used to check integration. However, because this is not primarily a Node.js project, multiple versions don't provide added value.

```yml
    strategy:
      matrix:
        node-version: [12.x]
```

A script item should be added in the `scripts` section of [package.json](./code/package.json) that runs all tests.

```json
{
   "script": {
      "test": "buidler test"
   }
}
```

This can then be called by running `npm test` after setting up the dependencies with `npm ci`.

If any hidden variables need to be defined, you can set them up in a local version of `./config.sample.js` (locally named `./config.js`). If you decide to do that, you should also add `./config.js` in `.gitignore` to make sure no hidden variables are pushed to the public repository. The sample config file `./config.sample.js` should be sufficient to pass the test suite.

```yml
    steps:
    - uses: actions/checkout@v2
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v1
      with:
        node-version: ${{ matrix.node-version }}
    - run: npm ci
    - run: cp ./config.sample.js ./config.js
    - run: npm test
```

You can also choose to run coverage and upload the generated artifacts.

```yml
    - run: npm run coverage
    - uses: actions/upload-artifact@v2
      with:
        name: Coverage ${{ matrix.node-version }}
        path: |
          coverage/
```

At the moment, checking the artifacts is not [that](https://github.community/t/browsing-artifacts/16954) [easy](https://github.community/t/need-clarification-on-github-actions/16027/2), because one needs to download the zip archive, unpack it and check it. However, the coverage can be checked in the **Actions** section once it's set up.

-->

<!-- ### Contract size

The contracts are dangerously close to the hard limit defined by [EIP-170](https://eips.ethereum.org/EIPS/eip-170), specifically **24676 bytes**.

Depending on the Solidity compiler version and the optimization runs, the contract size might increase over the hard limit. As stated in [the Solidity documentation](https://solidity.readthedocs.io/en/latest/using-the-compiler.html#using-the-commandline-compiler), increasing the number of optimizer runs increases the contract size.

> If you want the initial contract deployment to be cheaper and the later function executions to be more expensive, set it to `--optimize-runs=1`. If you expect many transactions and do not care for higher deployment cost and output size, set `--optimize-runs` to a high number.

Even if you remove the unused internal functions, it will not reduce the contract size because the Solidity compiler shakes that unused code out of the generated bytecode.

#### DELEGATECALL approach

Another way to improve contract size is by breaking them into multiple smaller contracts, grouped by functionality and using `DELEGATECALL` to execute that code. A standard that defines code splitting and selective code upgrade is the [EIP-2535 Diamond Standard](https://eips.ethereum.org/EIPS/eip-2535), which is an extension of [Transparent Contract Standard](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1538.md). A detailed explanation, documentation and implementations can be found in the [EIP-2535](https://eips.ethereum.org/EIPS/eip-2535). However, the current EIP is in **Draft** status, which means the interface, implementation, and overall architecture might change. Another thing to keep in mind is that using this pattern increases the gas cost. -->

## Issues


### [Minting to opposing chain leads to loss of/stuck funds](https://github.com/monoceros-alpha/review-halo-bridge-handler-2021-08/issues/2)
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


### [HAL service might cause a double-spend in the Bridge - leads to loss of funds](https://github.com/monoceros-alpha/review-halo-bridge-handler-2021-08/issues/1)
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


## Artifacts

### Surya

Sūrya is a utility tool for smart contract systems. It provides a number of visual outputs and information about the structure of smart contracts. It also supports querying the function call graph in multiple ways to aid in the manual inspection and control flow analysis of contracts.

<!-- **Contracts Description Table**

```text
surya mdreport report.md Contract.sol
```

-->

#### Graphs

<!-- ***Contract***

```text
surya graph Contract.sol | dot -Tpng > ./static/Contract_graph.png
```

![Contract Graph](./static/Contract_graph.png)

```text
surya inheritance Contract.sol | dot -Tpng > ./static/Contract_inheritance.png
```

![Contract Inheritance](./static/Contract_inheritance.png)

```text
Use Solidity Visual Auditor
```

![Contract UML](./static/Contract_uml.png) -->

#### Describe

<!-- ```text
$ npx surya describe ./Contract.sol
``` -->

### Coverage

<!-- ```text
$ npm run coverage
``` -->

### Tests

<!-- ```text
$ npx buidler test
``` -->

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
