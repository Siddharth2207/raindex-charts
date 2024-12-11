import React, { useState } from 'react';
import { SciChartSurface, NumericAxis, FastLineRenderableSeries, XyDataSeries, EAutoRange } from 'scichart';
import axios from 'axios';
import { ethers } from 'ethers';
import './App.css';

SciChartSurface.loadWasmFromCDN();

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
    try {
      // Fetch orders from GraphQL
      const queryResult = await axios.post(networkEndpoint, { query: orderQuery });
      const orders = queryResult.data.data.orders;
      const sampleOrders = await getCombinedOrders(orders, baseToken, quoteToken);

      setOrders(sampleOrders);
      renderDepthChart(sampleOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  }

  async function renderDepthChart(orders) {
  
    console.log(JSON.stringify(orders,null,2))

    const { sciChartSurface, wasmContext } = await SciChartSurface.create('scichart-root');

    // Add X and Y axes
    sciChartSurface.xAxes.add(
      new NumericAxis(wasmContext, {
        axisTitle: 'Price',
        autoRange: EAutoRange.Always,
        labelPrecision: 6,
      })
    );
    sciChartSurface.yAxes.add(
      new NumericAxis(wasmContext, {
        axisTitle: 'Cumulative Quantity',
        autoRange: EAutoRange.Always,
        labelPrecision: 6,
      })
    );

    // Separate and sort buy and sell orders
    const buyOrders = orders
      .filter((o) => o.side === 'buy' && o.outputAmount > 0)
      .sort((a, b) => b.ioRatio - a.ioRatio); // Descending order for buy orders
    const sellOrders = orders
      .filter((o) => o.side === 'sell' && o.outputAmount > 0)
      .sort((a, b) => a.ioRatio - b.ioRatio); // Ascending order for sell orders

    console.log(JSON.stringify(buyOrders,null,2))
    console.log(JSON.stringify(sellOrders,null,2))



    // Compute cumulative volumes for buy and sell orders
    let cumulativeBuy = 0;
    const buyDepthData = buyOrders.map((order) => {
      cumulativeBuy += order.outputAmount;
      return { x: order.ioRatio, y: cumulativeBuy };
    });

    let cumulativeSell = 0;
    const sellDepthData = sellOrders.map((order) => {
      cumulativeSell += order.outputAmount;
      return { x: order.ioRatio, y: cumulativeSell };
    });

    console.log(JSON.stringify(buyDepthData,null,2))
    console.log(JSON.stringify(cumulativeSell,null,2))



    // Add buy depth series
    const buySeries = new FastLineRenderableSeries(wasmContext, {
      dataSeries: new XyDataSeries(wasmContext, {
        xValues: buyDepthData.map((point) => point.x),
        yValues: buyDepthData.map((point) => point.y),
      }),
      stroke: 'green',
      strokeThickness: 2,
      isDigitalLine: true, // Ensures stepped lines for depth chart
    });

    // Add sell depth series
    const sellSeries = new FastLineRenderableSeries(wasmContext, {
      dataSeries: new XyDataSeries(wasmContext, {
        xValues: sellDepthData.map((point) => point.x),
        yValues: sellDepthData.map((point) => point.y),
      }),
      stroke: 'red',
      strokeThickness: 2,
      isDigitalLine: true, // Ensures stepped lines for depth chart
    });

    // Add the series to the SciChart surface
    sciChartSurface.renderableSeries.add(buySeries, sellSeries);

  }

  const handleNetworkChange = (newNetwork) => {
    setNetwork(newNetwork);
    setNetworkProvider(new ethers.providers.JsonRpcProvider(config.networks[newNetwork].rpc));
    setNetworkEndpoint(config.subgraphs[newNetwork]);
  };

  return (
    <div className="container">
      <h2 className="header">Market Depth Chart</h2>
      <div className="form-group">
        <label className="form-label">
          Network : 
          <select
            value={network || ''}
            onChange={(e) => handleNetworkChange(e.target.value)}
            className="form-select"
          >
            <option value="" disabled>
              Select a Network
            </option>
            {Object.keys(config.networks).map((key) => (
              <option key={key} value={key}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="form-group">
        <label className="form-label">
          Base Token Address:
          <input
            type="text"
            value={baseToken}
            onChange={(e) => setBaseToken(e.target.value)}
            className="form-input"
          />
        </label>
      </div>
      <div className="form-group">
        <label className="form-label">
          Quote Token Address:
          <input
            type="text"
            value={quoteToken}
            onChange={(e) => setQuoteToken(e.target.value)}
            className="form-input"
          />
        </label>
      </div>
      <button className="btn" onClick={fetchOrders}>
        Generate Depth Chart
      </button>
      <div id="scichart-root" className="chart-container" />
    </div>
  );
  
}

export default App;
