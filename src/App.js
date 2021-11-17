import twitterLogo from './assets/twitter-logo.svg';
import { useEffect , useState } from "react";
import './App.css';
import { Connection, PublicKey, clusterApiUrl} from '@solana/web3.js';
import {
  Program, Provider, web3
} from '@project-serum/anchor';
import kp from './keypair.json'
import idl from './idl.json';

const { SystemProgram, Keypair } = web3; // Let the code know what the sys program is

const programID = new PublicKey(idl.metadata.address); // finds our programId

const network = clusterApiUrl('devnet'); // make sure to reference programId on the devnet

const opts = {
  preflightCommitment: "processed"
}
// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const TEST_GIFS = [
  'https://i.giphy.com/media/eIG0HfouRQJQr1wBzz/giphy.webp',
  'https://media3.giphy.com/media/L71a8LW2UrKwPaWNYM/giphy.gif?cid=ecf05e47rr9qizx2msjucl1xyvuu47d7kf25tqt2lvo024uo&rid=giphy.gif&ct=g',
  'https://media4.giphy.com/media/AeFmQjHMtEySooOc8K/giphy.gif?cid=ecf05e47qdzhdma2y3ugn32lkgi972z9mpfzocjj6z1ro4ec&rid=giphy.gif&ct=g',
  'https://i.giphy.com/media/PAqjdPkJLDsmBRSYUp/giphy.webp'
]

// State
const App = () => {
  const [walletAddress , setWalletAddress] = useState(null);
  const [inputValue , setInputValue] = useState('');
  const [gifList , setGifList] = useState([]);

  const arr = Object.values(kp._keypair.secretKey)
  const secret = new Uint8Array(arr)
  const baseAccount = web3.Keypair.fromSecretKey(secret)

  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      console.log("ping")
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      });
      console.log("created a new baseAccount w/ address: ", baseAccount.publicKey.toString())
      await getGifList();

    } catch(error) {
      console.log("Error creating baseAccount: ", error)
    }
  }

  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;

      if (solana) {
        if (solana.isPhantom) {
          console.log("Phantom has been found !");
          const response = await solana.connect({ onlyIfTrusted: true});
          console.log(
              'connected with Public Key',
              response.publicKey.toString()
          );
          setWalletAddress(response.publicKey.toString());
          console.log(response.publicKey.toString())

        }

      } else {
          alert("Phantom not found :( ");
        }
      } catch (error) {
          console.error(error)
        }
      }

      const connectWallet = async () => {
        const { solana } = window;
        console.log("connect prompted")

        if (solana) {
          const response = await solana.connect();
          console.log('Connected with pubkey:' , response.publicKey.toString());
          setWalletAddress(response.publicKey.toString());
        }

      };

      const onInputChange = (event) => {
        const { value } = event.target;
        setInputValue(value);
      }

      const getProvider = () => {
        const connection = new Connection(network, opts.preflightCommitment);
        const provider = new Provider(
           connection, window.solana, opts.preflightCommitment,
           );
         return provider;
      }

      const sendGif = async () => {
        if (inputValue.length === 0) {
          console.log("No gif link provided !")
          return
        }
        try {
          const provider = getProvider();
          const program = new Program(idl, programID, provider);

          await program.rpc.addGif(inputValue, {
            accounts: {
              baseAccount: baseAccount.publicKey,
              user: provider.wallet.publicKey,

            },
          });
          console.log('Gif successfully sent:', inputValue);

          await getGifList();
        } catch(error) {
          console.log("error", error)
        }
        };
      const renderNotConnectedContainer = () => (
          <button
              className="cta-button connect-wallet-button"
              onClick={ connectWallet }
          >
            Connect to Wallet
          </button>
      );

      const renderConnectedContainer = () => {
        if (gifList === null) {
          return (
            <div className="connected-container">
              <button className="cta-button submit-gif-button" onClick={createGifAccount}>
              Do One-Time Initialization for GIF Program accounts
              </button>
            </div>
            )
        } else {
          return (
            <div className="connected-container">
             <form
                onSubmit={(event) => {
                  event.preventDefault();
                  sendGif();
                }}
              >
              <input
                type="text"
                placeholder="Enter gif link!"
                value={inputValue}
                onChange={onInputChange}
              />
              <button type="submit" className="cta-button submit-gif-button">
                Submit
              </button>
            </form>
            <div className="gif-grid">
             {gifList.map((item, index) => (
              <div className="gif-item" key="{index}"> 
                <img src={item.gifLink} />
              </div>
              ))}
            </div>
          </div>
            )
        }

      };

useEffect(() => {
  const onLoad = async () => {
    await checkIfWalletIsConnected();
  };
  window.addEventListener('load', onLoad)

}, []);

const getGifList = async() => {
  try {
    const provider = getProvider();
    const program = new Program(idl, programID, provider);
    const account = await program.account.baseAccount.fetch(baseAccount.publicKey);

    console.log("Got the account:", account)
    setGifList(account.gifList)

  } catch (error) {
    console.log("Error in getGifList: ", error)
    setGifList(null);
  }
}
useEffect(() => {
  if (walletAddress) {
    console.log('Fetching GIF urls...')
    getGifList()
  }
}, [walletAddress]);

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header">🖼 Star Trek Portal</p>
          <p className="sub-text">
            View your GIF collection on the USS ✨
          </p>
          {!walletAddress && renderNotConnectedContainer()}
          {walletAddress && renderConnectedContainer()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
