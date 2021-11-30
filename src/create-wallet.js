import cardano from './cardano.js'
import enquirer from "enquirer";

const createWallet = (account) => {
  const payment = cardano.addressKeyGen(account);
  const stake = cardano.stakeAddressKeyGen(account);
  cardano.stakeAddressBuild(account);
  cardano.addressBuild(account, {
    paymentVkey: payment.vkey,
    stakeVkey: stake.vkey,
  });
  return cardano.wallet(account);
};

const {walletName} = await enquirer.prompt({
  type: 'input',
  name: 'receiver',
  message: 'Enter wallet name'
})

createWallet(walletName)
