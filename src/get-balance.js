import {selectWallet} from "./utils.js";

const wallet = await selectWallet()

console.log(wallet.balance())
