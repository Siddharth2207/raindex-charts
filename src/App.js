import React, { useState } from 'react';
import DepthChart from './DepthChart';
import axios from 'axios';
import { ethers } from 'ethers';

const IO = "(address token, uint8 decimals, uint256 vaultId)";
const EvaluableV3 = "(address interpreter, address store, bytes bytecode)";
const SignedContextV1 = "(address signer, uint256[] context, bytes signature)";
const OrderV3 = `(address owner, ${EvaluableV3} evaluable, ${IO}[] validInputs, ${IO}[] validOutputs, bytes32 nonce)`;
const TakeOrderConfigV3 = `(${OrderV3} order, uint256 inputIOIndex, uint256 outputIOIndex, ${SignedContextV1}[] signedContext)`;
const QuoteConfig = TakeOrderConfigV3;

// Configuration for networks and subgraphs
const config = {
  networks: {
    flare: { rpc: 'https://rpc.ankr.com/flare', chainId: 14, currency: 'FLR' },
    base: { rpc: 'https://mainnet.base.org', chainId: 8453, currency: 'ETH' },
    sepolia: { rpc: 'https://1rpc.io/sepolia', chainId: 11155111, currency: 'ETH' },
    polygon: { rpc: 'https://rpc.ankr.com/polygon', chainId: 137, currency: 'POL' },
    arbitrum: { rpc: 'https://rpc.ankr.com/arbitrum', chainId: 42161, currency: 'ETH' },
    matchain: { rpc: 'https://rpc.matchain.io', chainId: 698, currency: 'BNB' },
    bsc: { rpc: 'https://rpc.ankr.com/bsc', chainId: 56, currency: 'BNB' },
    linea: { rpc: 'https://rpc.linea.build', chainId: 59144, currency: 'ETH' },
    mainnet: { rpc: 'https://rpc.ankr.com/eth', chainId: 1, currency: 'ETH' },
  },
  subgraphs: {
    flare: 'https://api.goldsky.com/api/public/project_clv14x04y9kzi01saerx7bxpg/subgraphs/ob4-flare/0.8/gn',
    base: 'https://api.goldsky.com/api/public/project_clv14x04y9kzi01saerx7bxpg/subgraphs/ob4-base/0.9/gn',
    polygon: 'https://api.goldsky.com/api/public/project_clv14x04y9kzi01saerx7bxpg/subgraphs/ob4-polygon/0.6/gn',
    arbitrum: 'https://api.goldsky.com/api/public/project_clv14x04y9kzi01saerx7bxpg/subgraphs/ob4-arbitrum/0.2/gn',
    bsc: 'https://api.goldsky.com/api/public/project_clv14x04y9kzi01saerx7bxpg/subgraphs/ob4-bsc/2024-10-14-63f4/gn',
    linea: 'https://api.goldsky.com/api/public/project_clv14x04y9kzi01saerx7bxpg/subgraphs/ob4-linea/2024-10-14-12fc/gn',
    mainnet: 'https://api.goldsky.com/api/public/project_clv14x04y9kzi01saerx7bxpg/subgraphs/ob4-mainnet/2024-10-25-af6a/gn',
  },
};


const orderbookAbi = [
  `function quote(${QuoteConfig} calldata quoteConfig) external view returns (bool exists, uint256 outputMax, uint256 ioRatio)`
];

const orderQuery = `query OrdersListQuery($skip: Int = 0, $first: Int = 1000) {
  orders(
    orderBy: timestampAdded
    orderDirection: desc
    skip: $skip
    first: $first
    where: {active: true}
  ) {
    orderHash
    owner
    orderBytes
    outputs {
      id
      token {
        id
        address
        name
        symbol
        decimals
      }
      balance
      vaultId
    }
    inputs {
      id
      token {
        id
        address
        name
        symbol
        decimals
      }
      balance
      vaultId
    }
    orderbook {
      id
    }
    active
    timestampAdded
  }
}`;

function App() {
  const [orders, setOrders] = useState([]);
  const [network, setNetwork] = useState();
  const [networkProvider, setNetworkProvider] = useState(); 
  const [networkEndpoint, setNetworkEndpoint] = useState(); 
  const [baseToken, setBaseToken] = useState();
  const [quoteToken, setQuoteToken] = useState();
   

  async function getCombinedOrders(orders, baseToken, quoteToken) {
    let combinedOrders = [];
    
  
    for (let i = 0; i < orders.length; i++) {
      let currentOrder = orders[i];
      const currentDecodedOrder = ethers.utils.defaultAbiCoder.decode([OrderV3], currentOrder.orderBytes)[0];

      // Process Buy Orders
      let isBuyInput = false, isBuyOutput = false;
      let buyInputIndex, buyOutputIndex;
  
      for (let j = 0; j < currentDecodedOrder.validInputs.length; j++) {
        let inputVault = currentDecodedOrder.validInputs[j];
        if (inputVault.token.toLowerCase() === baseToken.toLowerCase()) {
          isBuyInput = true;
          buyInputIndex = j;
        }
      }
      for (let j = 0; j < currentDecodedOrder.validOutputs.length; j++) {
        let outputVault = currentDecodedOrder.validOutputs[j];
        if (outputVault.token.toLowerCase() === quoteToken.toLowerCase()) {
          isBuyOutput = true;
          buyOutputIndex = j;
        }
      }
  
      if (isBuyInput && isBuyOutput) {
        try{
          const orderbookAddress = currentOrder.orderbook.id;
          const orderBookContract = new ethers.Contract(orderbookAddress, orderbookAbi, networkProvider);
    
          const buyOrderQuote = await networkProvider.call({
            to: orderbookAddress,
            from: ethers.Wallet.createRandom().address,
            data: orderBookContract.interface.encodeFunctionData("quote", [{
              order: currentDecodedOrder,
              inputIOIndex: buyInputIndex,
              outputIOIndex: buyOutputIndex,
              signedContext: []
            }])
          });
    
          const decodedBuyQuote = ethers.utils.defaultAbiCoder.decode(
            ["bool", "uint256", "uint256"],
            buyOrderQuote
          );
    
          const buyAmount = decodedBuyQuote[1].toString() / 1e18;
          const buyOrderRatio = decodedBuyQuote[2].toString() / 1e18;
    
          combinedOrders.push({
            orderHash: currentOrder.orderHash,
            side: 'buy',
            ioRatio: 1 / buyOrderRatio,
            outputAmount: buyAmount * buyOrderRatio
          });
        }catch{
          console.log("Error getting quote for order : ", currentOrder.orderHash)
        }
        
      }
  
      // Process Sell Orders
      let isSellInput = false, isSellOutput = false;
      let sellInputIndex, sellOutputIndex;
  
      for (let j = 0; j < currentDecodedOrder.validInputs.length; j++) {
        let inputVault = currentDecodedOrder.validInputs[j];
        if (inputVault.token.toLowerCase() === quoteToken.toLowerCase()) {
          isSellInput = true;
          sellInputIndex = j;
        }
      }
      for (let j = 0; j < currentDecodedOrder.validOutputs.length; j++) {
        let outputVault = currentDecodedOrder.validOutputs[j];
        if (outputVault.token.toLowerCase() === baseToken.toLowerCase()) {
          isSellOutput = true;
          sellOutputIndex = j;
        }
      }
  
      if (isSellInput && isSellOutput) {
        try{
          const orderbookAddress = currentOrder.orderbook.id;
          const orderBookContract = new ethers.Contract(orderbookAddress, orderbookAbi, networkProvider);
          const sellOrderQuote = await networkProvider.call({
            to: orderbookAddress,
            from: ethers.Wallet.createRandom().address,
            data: orderBookContract.interface.encodeFunctionData("quote", [{
              order: currentDecodedOrder,
              inputIOIndex: sellInputIndex,
              outputIOIndex: sellOutputIndex,
              signedContext: []
            }])
          });
          const decodedSellQuote = ethers.utils.defaultAbiCoder.decode(
            ["bool", "uint256", "uint256"],
            sellOrderQuote
          );
    
          const sellAmount = decodedSellQuote[1].toString() / 1e18;
          const sellOrderRatio = decodedSellQuote[2].toString() / 1e18;
    
          combinedOrders.push({
            orderHash: currentOrder.orderHash,
            side: 'sell',
            ioRatio: sellOrderRatio,
            outputAmount: sellAmount
          });

        }catch(error){
          console.log("Error getting quote for order : ", currentOrder.orderHash)
        }
        
      }
    }
  
    return combinedOrders.filter(order => {return order.outputAmount > 0});
  }

  async function fetchOrders() { 

    console.log("network : ", network)
    console.log("baseToken : ", baseToken)
    console.log("quoteToken : ", quoteToken)

    
    try {
      // Fetch order data via GraphQL
      const queryResult = await axios.post(networkEndpoint, { query: orderQuery });
      const orders = queryResult.data.data.orders;
      const sampleOrders = await getCombinedOrders(orders, baseToken, quoteToken);

      console.log(JSON.stringify(sampleOrders,null,2))
      
      setOrders(sampleOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  }
   // Update provider and endpoint when network changes
  const handleNetworkChange = (newNetwork) => {
    setNetwork(newNetwork);
    setNetworkProvider(new ethers.providers.JsonRpcProvider(config.networks[newNetwork].rpc));
    setNetworkEndpoint(config.subgraphs[newNetwork]);
  };

  return (
    <div style={{ width: '600px', margin: '0 auto', padding: '20px' }}>
      <h2>Market Depth Chart</h2>
      <div style={{ marginBottom: '10px' }}>
        <label>
          Network:
          <select
            value={network}
            onChange={(e) => handleNetworkChange(e.target.value)}
            style={{ marginLeft: '10px', width: '300px' }}
          >
            {/* Dropdown options for networks */}
            <option value="flare">Flare</option>
            <option value="base">Base</option>
            <option value="sepolia">Sepolia</option>
            <option value="polygon">Polygon</option>
            <option value="arbitrum">Arbitrum</option>
            <option value="matchain">Matchain</option>
            <option value="bsc">BSC</option>
            <option value="linea">Linea</option>
            <option value="mainnet">Mainnet</option>
          </select>
        </label>
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label>
          Base Token Address:
          <input
            type="text"
            value={baseToken}
            onChange={(e) => setBaseToken(e.target.value)}
            style={{ marginLeft: '10px', width: '300px' }}
          />
        </label>
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label>
          Quote Token Address:
          <input
            type="text"
            value={quoteToken}
            onChange={(e) => setQuoteToken(e.target.value)}
            style={{ marginLeft: '10px', width: '300px' }}
          />
        </label>
      </div>

      <button onClick={fetchOrders}>Generate Depth Chart</button>
      {orders.length === 0 ? (
        <p>No orders loaded. Click "Generate Depth Chart" to load data.</p>
      ) : (
        <DepthChart orders={orders} />
      )}
    </div>
  );
}

export default App;
