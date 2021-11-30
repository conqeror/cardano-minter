import cardano from './cardano.js'
import {selectWallet} from "./utils.js";
import enquirer from "enquirer";

const sender = await selectWallet()

const tokens = Object.keys(sender.balance().value).filter((token) => token !== 'lovelace')

const {tokensToSend} = await enquirer.prompt({
    type: 'multiselect',
    name: 'tokensToSend',
    message: 'Pick tokens to send',
    choices: tokens,
})

const {receiver} = await enquirer.prompt({
    type: 'input',
    name: 'receiver',
    message: 'Enter receiver address'
})

const adaToSend = 1.5*tokensToSend.length

const txInfo = {
    txIn: cardano.queryUtxo(sender.paymentAddr),
    txOut: [
        {
            address: sender.paymentAddr,
            value: {
                ...sender.balance().value,
                ...Object.fromEntries(tokensToSend.map(asset => [asset, 0])),
                lovelace: sender.balance().value.lovelace - cardano.toLovelace(adaToSend)
            }
        },
        {
            address: receiver,
            value: {
                lovelace: cardano.toLovelace(adaToSend),
                ...Object.fromEntries(tokensToSend.map(asset => [asset, 1])),
            }
        }
    ]
}

const raw = cardano.transactionBuildRaw(txInfo)

const fee = cardano.transactionCalculateMinFee({
    ...txInfo,
    txBody: raw,
    witnessCount: 1
})

txInfo.txOut[0].value.lovelace -= fee

const tx = cardano.transactionBuildRaw({ ...txInfo, fee })

const txSigned = cardano.transactionSign({
    txBody: tx,
    signingKeys: [sender.payment.skey]
})

const txHash = cardano.transactionSubmit(txSigned)

console.log(txHash)
