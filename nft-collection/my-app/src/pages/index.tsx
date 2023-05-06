import { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import { abi, NFT_CONTRACT_ADDRESS } from "../contracts";
import { BigNumber, Contract, providers, utils } from "ethers";
import { TransactionResponse } from "@ethersproject/providers";
import styles from "../styles/Home.module.css";
import Head from "next/head";

export default function Home() {

  const [walletConnected, setWalletConnected] = useState(false);
  const [presaleStarted, setPresaleStarted] = useState(false);
  const [presaleEnded, setPresaleEnded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [tokenIdsMinted, setTokenIdsMinted] = useState("0");
  const web3ModalRef = useRef<Web3Modal | null>();

  const getProvider = async (): Promise<providers.Web3Provider> => {
    const provider = await web3ModalRef.current?.connect();
    const web3Provider = new providers.Web3Provider(provider);
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 11155111) {
      window.alert("Change the network to Sepolia");
      throw new Error("Change the network to Sepolia");
    }
    return web3Provider;
  };

  const getSigner = async (): Promise<providers.JsonRpcSigner> => {
    return getProvider().then((provider) => provider.getSigner());
  };

  const connectWallet = async () => {
    try {
      await getProvider();
      setWalletConnected(true);
    } catch (e: any) {
      console.error(e.message);
    }
  };

  const getNftContract = async (provider: providers.Web3Provider | providers.JsonRpcSigner) => {
    try {
      return new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
    } catch (e: any) {
      console.error(e.message);
      throw new Error(e.message);
    }
  };

  const getOwner = async () => {
    try {
      const provider = await getProvider();
      const nftContract = await getNftContract(provider);
      const owner = await nftContract.owner() as string;
      const signer = await getSigner();
      const address = await signer.getAddress();
      if (address.toLowerCase() !== owner.toLowerCase()) setIsOwner(true);
    } catch (e: any) {
      console.error(e.message);
    }
  };

  const startPresale = async () => {
    try {
      const signer = await getSigner();
      const nftContract = await getNftContract(signer);
      console.log("Invoke 'startPresale'");
      const tx = await nftContract.startPresale();
      setLoading(true);
      console.log("Tx executed");
      await tx.wait();
      setLoading(false);
      console.log("Tx has been mined");
      await checkIfPresaleStarted();
    } catch (e: any) {
      console.error(e.message);
    }
  };

  const checkIfPresaleStarted = async () => {
    try {
      const provider = await getProvider();
      const nftContract = await getNftContract(provider);
      const _presaleStarted = await nftContract.presaleStarted();
      if (!_presaleStarted) await getOwner();
      setPresaleStarted(_presaleStarted);
      return _presaleStarted;
    } catch (e: any) {
      console.error(e.message);
      return false;
    }
  };

  const checkIfPresaleEnded = async () => {
    try {
      const provider = await getProvider();
      const nftContract = await getNftContract(provider);
      const _presaleEnded = await nftContract.presaleEnded() as BigNumber;
      const hasEnded = _presaleEnded.lt(Math.floor(Date.now() / 1000));
      setPresaleEnded(hasEnded);
      return hasEnded;
    } catch (e: any) {
      console.error(e.message);
      return false;
    }
  };

  const getTokenIdsMinted = async () => {
    try {
      const provider = await getProvider();
      const nftContract = await getNftContract(provider);
      const _tokenIds = await nftContract.tokenIds() as BigNumber;
      setTokenIdsMinted(_tokenIds.toString());
    } catch (e: any) {
      console.error(e.message);
    }
  };

  const presaleMint = async () => {
    try {
      const signer = await getSigner();
      const nftContract = await getNftContract(signer);
      const tx = nftContract.presaleMint({ value: utils.parseEther("0.01") }) as TransactionResponse;
      setLoading(true);
      await tx.wait();
      setLoading(false);
      window.alert("You successfully minted a Crypto Dev!");
    } catch (e: any) {
      console.error(e.message);
    }
  };

  const publicMint = async () => {
    try {
      const signer = await getSigner();
      const nftContract = await getNftContract(signer);
      const tx = await nftContract.mint({
        value: utils.parseEther("0.01")
      }) as TransactionResponse;
      setLoading(true);
      await tx.wait();
      setLoading(false);
      window.alert("You successfully minted a Crypto Dev!");
    } catch (e: any) {
      console.error(e.message);
    }
  };

  useEffect(() => {
    // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
    if (!walletConnected) {
      // Assign the Web3Modal class to the reference object by setting it's `current` value
      // The `current` value is persisted throughout as long as this page is open
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();

      // Check if presale has started and ended
      checkIfPresaleStarted()
        .then((_presaleStarted) => { if (_presaleStarted) checkIfPresaleEnded(); });

      getTokenIdsMinted();

      // Set an interval which gets called every 5 seconds to check presale has ended
      const presaleEndedInterval = setInterval(async function () {
        const _presaleStarted = await checkIfPresaleStarted();
        if (_presaleStarted) {
          const _presaleEnded = await checkIfPresaleEnded();
          if (_presaleEnded) {
            clearInterval(presaleEndedInterval);
          }
        }
      }, 5 * 1000);

      // set an interval to get the number of token Ids minted every 5 seconds
      setInterval(async function () {
        await getTokenIdsMinted();
      }, 5 * 1000);
    }
  }, [walletConnected]);

  const renderButton = () => {
    // If wallet is not connected, return a button which allows them to connect their wallet
    if (!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect your wallet
        </button>
      );
    }

    // If we are currently waiting for something, return a loading button
    if (loading) {
      return <button className={styles.button}>Loading...</button>;
    }

    // If connected user is the owner, and presale hasn't started yet, allow them to start the presale
    if (isOwner && !presaleStarted) {
      return (
        <button className={styles.button} onClick={startPresale}>
          Start Presale!
        </button>
      );
    }

    // If connected user is not the owner but presale hasn't started yet, tell them that
    if (!presaleStarted) {
      return (
        <div>
          <div className={styles.description}>Presale hasn&#39;t started!</div>
        </div>
      );
    }

    // If presale started, but hasn't ended yet, allow for minting during the presale period
    if (presaleStarted && !presaleEnded) {
      return (
        <div>
          <div className={styles.description}>
            Presale has started!!! If your address is whitelisted, Mint a Crypto
            Dev 🥳
          </div>
          <button className={styles.button} onClick={presaleMint}>
            Presale Mint 🚀
          </button>
        </div>
      );
    }

    // If presale started and has ended, it's time for public minting
    if (presaleStarted && presaleEnded) {
      return (
        <button className={styles.button} onClick={publicMint}>
          Public Mint 🚀
        </button>
      );
    }
  };

  return (
    <div>
      <Head>
        <title>Crypto Devs</title>
        <meta name="description" content="Whitelist-Dapp"/>
        <link rel="icon" href="/favicon.ico"/>
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs!</h1>
          <div className={styles.description}>
            It&#39;s an NFT collection for developers in Crypto.
          </div>
          <div className={styles.description}>
            {tokenIdsMinted}/20 have been minted
          </div>
          {renderButton()}
        </div>
        <div>
          <img className={styles.image} src="/cryptodevs/0.svg"/>
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  );
}
