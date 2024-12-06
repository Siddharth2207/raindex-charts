import React, { useState } from 'react';
import DepthChart from './DepthChart';
import axios from 'axios';
import { ethers } from 'ethers';

function App() {
  const [orders, setOrders] = useState([]);

  async function fetchOrders() {
    const IO = "(address token, uint8 decimals, uint256 vaultId)";
    const EvaluableV3 = "(address interpreter, address store, bytes bytecode)";
    const SignedContextV1 = "(address signer, uint256[] context, bytes signature)";
    const OrderV3 = `(address owner, ${EvaluableV3} evaluable, ${IO}[] validInputs, ${IO}[] validOutputs, bytes32 nonce)`;
    const TakeOrderConfigV3 = `(${OrderV3} order, uint256 inputIOIndex, uint256 outputIOIndex, ${SignedContextV1}[] signedContext)`;
    const QuoteConfig = TakeOrderConfigV3;

    const orderbookAbi = [
      `function quote(${QuoteConfig} calldata quoteConfig) external view returns (bool exists, uint256 outputMax, uint256 ioRatio)`
    ];

    const orderQuery = `query OrdersListQuery($skip: Int = 0, $first: Int = 1000) {
      orders(
        orderBy: timestampAdded
        orderDirection: desc
        skip: $skip
        first: $first
        where: {active: true, orderHash: "0x14b8aaa91680d0b0d5c0f7df77956ed7e160331f8397ef9130357cc2ea085ca5"}
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

    const wallet = ethers.Wallet.createRandom();
    const endpoint = "https://api.goldsky.com/api/public/project_clv14x04y9kzi01saerx7bxpg/subgraphs/ob4-polygon/0.6/gn";
    const polygonProvider = new ethers.providers.JsonRpcProvider('https://rpc.ankr.com/polygon');

    // Fetch order data via GraphQL
    const queryResult = await axios.post(endpoint, { query: orderQuery });
    const ioenOrderData = queryResult.data.data.orders[0];
    const orderbookAddress = ioenOrderData.orderbook.id;
    const orderBookContract = new ethers.Contract(orderbookAddress, orderbookAbi, polygonProvider);
    const ioenOrder = ethers.utils.defaultAbiCoder.decode([OrderV3], ioenOrderData.orderBytes);

    // Quote for "sell" scenario (input is at index 0, output is at index 1)
    const sellIoenQuoteRaw = await polygonProvider.call({
      to: orderbookAddress,
      from: wallet.address,
      data: orderBookContract.interface.encodeFunctionData("quote", [{
        order: ioenOrder[0],
        inputIOIndex: 0,
        outputIOIndex: 1,
        signedContext: []
      }])
    });
    const decodedSellQuote = ethers.utils.defaultAbiCoder.decode(
      ["bool", "uint256", "uint256"],
      sellIoenQuoteRaw
    );
    const sellIoenAmount = decodedSellQuote[1].toString() / 1e18;
    const sellIoenOrderRatio = decodedSellQuote[2].toString() / 1e18;

    // Quote for "buy" scenario (input is at index 1, output is at index 0)
    const buyIoenQuoteRaw = await polygonProvider.call({
      to: orderbookAddress,
      from: wallet.address,
      data: orderBookContract.interface.encodeFunctionData("quote", [{
        order: ioenOrder[0],
        inputIOIndex: 1,
        outputIOIndex: 0,
        signedContext: []
      }])
    });
    const decodedBuyQuote = ethers.utils.defaultAbiCoder.decode(
      ["bool", "uint256", "uint256"],
      buyIoenQuoteRaw
    );
    const buyIoenAmount = decodedBuyQuote[1].toString() / 1e18;
    const buyIoenOrderRatio = decodedBuyQuote[2].toString() / 1e18;

    const fetchedOrders = [
      { side: 'buy', ioRatio: 1 / buyIoenOrderRatio, outputAmount: buyIoenAmount * buyIoenOrderRatio },
      { side: 'sell', ioRatio: sellIoenOrderRatio, outputAmount: sellIoenAmount }
    ];

    setOrders(fetchedOrders);
  }

  return (
    <div style={{ width: '600px', margin: '0 auto', padding: '20px' }}>
      <h2>Market Depth Chart</h2>
      <button onClick={fetchOrders}>Fetch Orders</button>
      {orders.length === 0 ? (
        <p>No orders loaded. Click "Fetch Orders" to load data.</p>
      ) : (
        <DepthChart orders={orders} />
      )}
    </div>
  );
}

export default App;
