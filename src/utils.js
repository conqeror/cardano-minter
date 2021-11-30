import config from "./config.js";
import enquirer from "enquirer";
import {readdirSync} from "fs";
import cardano from "./cardano.js";


export const selectWallet = async () => {
    const wallets = readdirSync(`${config.tmpDirLocation}/priv/wallet`)

    if (wallets.length === 0) {
        throw new Error('No wallet created!')
    }

    if (wallets.length === 1) {
        return Promise.resolve(cardano.wallet(wallets[0]))
    }

    const {wallet} =  await enquirer.prompt({
        type: 'select',
        name: 'wallet',
        message: 'Pick a wallet',
        choices: wallets
    })

    return cardano.wallet(wallet)
}

export const buildTransaction = (tx) => {
    const raw = cardano.transactionBuildRaw(tx)
    const fee = cardano.transactionCalculateMinFee({
        ...tx,
        txBody: raw
    })

    tx.txOut[0].value.lovelace -= fee

    return cardano.transactionBuildRaw({ ...tx, fee })
}



export const signTransaction = (wallet, tx) => {
    return cardano.transactionSign({
        signingKeys: [wallet.payment.skey, wallet.payment.skey],
        txBody: tx
    })
}
