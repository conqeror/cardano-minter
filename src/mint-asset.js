import cardano from './cardano.js'
import config from './config.js'
import enquirer from "enquirer"
import {buildTransaction, selectWallet, signTransaction} from "./utils.js";

function chunkSubstr(str, size) {
    const numChunks = Math.ceil(str.length / size)
    const chunks = new Array(numChunks)

    for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
        chunks[i] = str.substr(o, size)
    }

    return chunks
}

const wallet = await selectWallet()

const invalidAfter = cardano.queryTip().slot + config.numOfSlots

const mintScript = {
    type: "all",
    scripts: [
        {
            keyHash: cardano.addressKeyHash(wallet.name),
            type: "sig"
        },
        {
            "type": "before",
            "slot": invalidAfter
        },
    ]
}

const policyId = cardano.transactionPolicyid(mintScript)


const {includeRoyalty} = await enquirer.prompt({
    type: 'confirm',
    name: 'includeRoyalty',
    message: 'Do you want to include royalty?'
})

if (includeRoyalty) {
    const {royaltyInfo: {rate, address}} = await enquirer.prompt({
        type: 'form',
        message: 'Royalty info:',
        name: 'royaltyInfo',
        choices: [
            {name: 'rate', message: 'Rate (0.0 - 1.0)', initial: '0.1'},
            {name: 'address', message: 'Address'}
        ]
    })

    const royaltyMetadata = {
        777: {
            "rate": rate,
            "address": chunkSubstr(address, 64),
        }
    }

    const royaltyTx = {
        txIn: wallet.balance().utxo,
        txOut: [{
            address: wallet.paymentAddr,
            value: { ...wallet.balance().value, [policyId]: 1 }
        }],
        mint: [{
            action: "mint", quantity: 1, asset: policyId, script: mintScript
        }],
        metadata: royaltyMetadata,
        witnessCount: 2,
        invalidAfter
    }

    const rawRoyalty = buildTransaction(royaltyTx)
    const signedRoyalty = signTransaction(wallet, rawRoyalty)
    const royaltyTxHash = cardano.transactionSubmit(signedRoyalty)
    console.log("Royalty txHash:", royaltyTxHash)

    console.log("WAITING FOR TX TO GO THROUGH");
    await new Promise(resolve => setTimeout(resolve, 20000));
}

const {assetName: assetNameBase} = await enquirer.prompt({
    type: 'input',
    name: 'assetName',
    message: 'Asset name'
})

const {numOfNfts} = await enquirer.prompt({
    type: 'input',
    name: 'numOfNfts',
    message: 'Number of NFTs',
    initial: '1',
})

const assetNames = [...Array(Number(numOfNfts)).keys()].map(i => `${assetNameBase}${i}`)

const metadata = {
    721: {
        [policyId]: {
            ...Object.fromEntries(assetNames.map(assetName => [assetName, {
                name: assetName,
                image: "ipfs://QmQqzMTavQgT4f4T5v6PWBp7XNKtoPmC9jvn12WPT3gkSE",
                description: "Super Fancy Berry Space Green NFT",
                type: "image/png",
                author: "Samko",
            }]))
        }
    }
}

const mint = assetNames.map(assetName => ({
    action: "mint",
    quantity: 1,
    asset: `${policyId}.${assetName}`,
    script: mintScript
}))

const tx = {
    txIn: wallet.balance().utxo,
    txOut: [{
        address: wallet.paymentAddr,
        value: {
            ...wallet.balance().value,
            ...Object.fromEntries(assetNames.map(assetName => [`${policyId}.${assetName}`, 1])),
        }
    }],
    mint,
    metadata,
    witnessCount: 2,
    invalidAfter
}

const raw = buildTransaction(tx)
const signed = signTransaction(wallet, raw)
const txHash = cardano.transactionSubmit(signed)

console.log("NFT txHash:", txHash)
