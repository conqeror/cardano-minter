import CardanoCliJs from "cardanocli-js"
import config from "./config.js";

const cardanoCliJs = new CardanoCliJs({
  network: config.network === 'testnet' ? 'testnet-magic 1097911063' : 'mainnet',
  dir: config.tmpDirLocation,
  shelleyGenesisPath: config.shelleyGenesisPath,
});

export default cardanoCliJs
