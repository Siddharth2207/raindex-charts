import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList
} from "recharts";
import React, { useState, useEffect } from "react";
import {analyzeLiquidity,fetchAndFilterOrders,tokenMetrics, orderMetrics,calculateCombinedVaultBalance,volumeMetrics,tokenConfig, networkConfig} from "raindex-reports"
import { useParams } from "react-router-dom";
import { PieChart, Pie, Cell } from 'recharts';
import { ethers } from "ethers";

function generateColorPalette(numColors) {
  const colors = [];

  // Base hue for blue
  const baseHue = 210; // Hue value for blue (210° in HSL)

  // Define the range for lightness (avoid too dark or too light)
  const minLightness = 15; // Minimum lightness (darker blue)
  const maxLightness = 50; // Maximum lightness (medium blue)

  // Loop through and generate shades within the specified range
  for (let i = 0; i < numColors; i++) {
    // Evenly distribute lightness within the range
    const lightness = minLightness + (i * ((maxLightness - minLightness) / (numColors - 1)));

    // Push the generated color to the array
    colors.push(hslToHex(baseHue, 70, lightness));
  }

  return colors;
}

function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(Math.min(k(n) - 3, 9 - k(n), 1), -1);
  const toHex = (x) => Math.round(x * 255).toString(16).padStart(2, "0");
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

export { generateColorPalette, hslToHex };

const RechartsDashboard = () => {

  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null);
  const { reportToken, reportDuration } = useParams();

  const [vaultData, setVaultData] = useState([]);
  const [vaultStats, setVaultStats] = useState([]);
  const [tradeData, setTradeData] = useState([]);
  const [tradeStats, setTradeStats] = useState([]);
  const [volumeData, setVolumeData] = useState([]);
  const [volumeStats, setVolumeStats] = useState([]);
  const [orderVolumeData, setOrderVolumeData] = useState([]);
  const [orderVolumeStats, setOrderVolumeStats] = useState([]);
  const [reportDurationInSeconds, setReportDurationInSeconds] = useState(0);
  const [vaultUtilizationData, setVaultUtilizationData] = useState([]);
  const [vaultUtilizationStats, setVaultUtilizationStats] = useState([]);

  const [totalRaindexTrades, setTotalRaindexTrades] = useState(0);
  const [totalExternalTrades, setTotalExternalTrades] = useState(0);
  const [totalRaindexVolume, setTotalRaindexVolume] = useState(0);
  const [totalExternalVolume, setTotalExternalVolume] = useState(0);

  const [orderMetricsData, setOrderMetricsData] = useState([]);
  const [orderMetricsStats, setOrderMetricsStats] = useState([]);
  const [activeOrders, setOctiveOrders] = useState(null);
  const [allOrders, setAllOrders] = useState(null);

  




  useEffect(() => {
      const setData = async () => {
      try{
        const token = reportToken.toUpperCase()
        const network = tokenConfig[token]?.network
        const durationToSeconds = {
            daily: 24 * 60 * 60,
            weekly: 7 * 24 * 60 * 60,
            monthly: 30 * 24 * 60 * 60,
        };
        const durationInSeconds = durationToSeconds[reportDuration] ?? 0;

        setReportDurationInSeconds(durationInSeconds);
        const { filteredActiveOrders, filteredInActiveOrders } = await fetchAndFilterOrders(
            token,
            network,
        );
        setOctiveOrders(filteredActiveOrders)
        const allOrders = filteredActiveOrders.concat(filteredInActiveOrders);
        setAllOrders(allOrders);
        const currentGracePeriod = 300
        const toTimestamp = Math.floor(new Date().getTime() / 1000) - currentGracePeriod;
        const fromTimestamp = toTimestamp - durationInSeconds;

        const {orderMetricsData: orderMetricsDataRaindex, logMessages: orderMetricsLogs} = await orderMetrics(filteredActiveOrders, filteredInActiveOrders, fromTimestamp, toTimestamp);
        const { chartData: orderMetricsData, stats: orderMetricsStats } = prepareStackedBarChartData(orderMetricsDataRaindex);

        setOrderMetricsData(orderMetricsData)
        setOrderMetricsStats(orderMetricsStats)
        
        const {tokenVaultSummary} = await tokenMetrics(filteredActiveOrders);
        const {vaultData, vaultStats} = prepareVaultDataAndStats(tokenVaultSummary);

        setVaultData(vaultData)
        setVaultStats(vaultStats)

        const {totalTokenVolForDurationUsd,totalTradesForDuration,totalRaindexTrades,aggregatedResultsForToken,volumeDistributionForToken,tradeData, tradeStats, volumeData, volumeStats} = await prepareTradeAndVolumeStats(token,network,allOrders,durationInSeconds);
  

        setTradeData(tradeData)
        setTradeStats(tradeStats)
        setVolumeData(volumeData)
        setVolumeStats(volumeStats) 
        setTotalRaindexTrades(totalRaindexTrades)
        setTotalExternalTrades(totalTradesForDuration - totalRaindexTrades)

        const { orderVolumeData, orderVolumeStats } = prepareOrderVolumeData(volumeDistributionForToken)
        setOrderVolumeData(orderVolumeData)
        setOrderVolumeStats(orderVolumeStats)

        const tokenAddress = tokenConfig[token]?.address.toLowerCase();
        const totalRaindexVolumeUsd = Number(
          aggregatedResultsForToken?.find((e) => e.address.toLowerCase() === tokenAddress)
                ?.totalVolumeForDurationUsd || 0,
        );
        
        setTotalRaindexVolume(totalRaindexVolumeUsd)
        setTotalExternalVolume(totalTokenVolForDurationUsd-totalRaindexVolumeUsd)


        const combinedBalance = await calculateCombinedVaultBalance(allOrders);
        const {vaultUtilizationData, vaultUtilizationStats} = prepareVaultUtilizationData(
          token,
          aggregatedResultsForToken,
          combinedBalance
        );
        setVaultUtilizationData(vaultUtilizationData);
        setVaultUtilizationStats(vaultUtilizationStats);
        setLoading(false);
      }catch(error){
        setError(error)
      }
    }
    setData();
  }, [reportToken,reportDuration]);

  const prepareVaultDataAndStats = (tokenVaultSummary) => {
    if (!tokenVaultSummary || tokenVaultSummary.length === 0) return { vaultData: [], vaultStats: [] };
  
    // Prepare vaultData
    const vaultData = [
      tokenVaultSummary.reduce(
        (result, token) => {
          result[token.symbol] = token.totalTokenBalanceUsd;
          result.total += token.totalTokenBalanceUsd;
          return result;
        },
        { name: "Balance", total: 0 }
      ),
    ];
  
    const totalBalanceUsd = tokenVaultSummary.reduce(
      (sum, token) => sum + token.totalTokenBalanceUsd,
      0
    );
  
    const vaultStats = tokenVaultSummary.map((token) => {
      const percentage = ((token.totalTokenBalanceUsd / totalBalanceUsd) * 100).toFixed(2);
      return {
        name: token.symbol,
        value: `$${token.totalTokenBalanceUsd.toLocaleString()} - ${formatValue(token.totalTokenBalance)} ${token.symbol}`,
        percentage: percentage,
      };
    });
  
    return { vaultData, vaultStats };
  };

  function prepareStackedBarChartData(data) {
    const chartData = [
      {
        name: "Orders",
        Active: data.totalActiveOrders,
        InActive: data.totalInActiveOrders,
        total: data.totalActiveOrders + data.totalInActiveOrders
      }
    ];
  
    const stats = [
      {
        name: "Unique Owners",
        value: data.uniqueOwners
      },
      {
        name: "New Owners for Duration",
        value: data.uniqueOwnersForDuration
      },
      {
        name: "Orders added for the duration",
        value: data.ordersAddedForDuration.length
      },
      {
        name: "Last order added",
        value: data.lastOrderDate
      },
    ];
  
    return { chartData, stats };
  }
  

  const prepareTradeAndVolumeStats = async (token,network,allOrders,durationInSeconds) => {

      let toTimestamp = Math.floor(new Date().getTime() / 1000) - 300;
      let fromTimestamp = toTimestamp - durationInSeconds;
      let tradeData = [[]]
      let volumeData = [[]]
      
      let totalTokenVolForDurationUsd,totalTradesForDuration,totalRaindexTrades,aggregatedResultsForToken,volumeDistributionForToken
      
      for(let i = 0; i < 3; i++){
          const {
            totalTokenExternalVolForDurationUsd,
            totalTokenExternalTradesForDuration,
          } = await analyzeLiquidity(network,token,fromTimestamp,toTimestamp);
          const {
            tradesLastForDuration: totalRaindexTradesForDuration,
            aggregatedResults,
            volumeDistributionForDuration
          } = await volumeMetrics(network, allOrders, fromTimestamp, toTimestamp, token);
          const tokenAddress = tokenConfig[token]?.address.toLowerCase();
          const totalRaindexVolumeUsd = Number(
              aggregatedResults?.find((e) => e.address.toLowerCase() === tokenAddress)
                  ?.totalVolumeForDurationUsd || 0,
          );

          const totalExternalTrades =
              totalTokenExternalTradesForDuration - totalRaindexTradesForDuration;
          const totalExternalVolumeUsd = totalTokenExternalVolForDurationUsd - totalRaindexVolumeUsd;
          
          const formattedDate = (new Date(fromTimestamp*1000)).toLocaleDateString("en-US", {
            day: "2-digit",
            month: "short",
          });
          tradeData[0][i] = {name: `${formattedDate}`, Raindex: totalRaindexTradesForDuration.toFixed(2), External: totalExternalTrades, total: totalTokenExternalTradesForDuration};
          volumeData[0][i] = {name: `${formattedDate}`, Raindex: totalRaindexVolumeUsd.toFixed(2), External: totalExternalVolumeUsd, total: totalTokenExternalVolForDurationUsd};
          toTimestamp = fromTimestamp;
          fromTimestamp = toTimestamp - durationInSeconds;
          if(i == 0){
            totalTokenVolForDurationUsd = totalTokenExternalVolForDurationUsd
            totalTradesForDuration = totalTokenExternalTradesForDuration
            totalRaindexTrades = totalRaindexTradesForDuration
            aggregatedResultsForToken = aggregatedResults
            volumeDistributionForToken = volumeDistributionForDuration
          }
      }

      const tradeStats = [
        { name: "Raindex"},
        { name: "External"},
      ];
    
      const volumeStats = [
        { name: "Raindex"},
        { name: "External"},
      ];

      return {totalTokenVolForDurationUsd,totalTradesForDuration,totalRaindexTrades,aggregatedResultsForToken,volumeDistributionForToken,tradeData, tradeStats, volumeData, volumeStats}
        
  }

  const prepareOrderVolumeData = (volumeDistributionForDuration) => {
    const orderVolumeData = [];
    const orderVolumeStats = [];
    let totalVolume = 0;

      // Parse and sort entries by total volume in descending order
      const sortedEntries = volumeDistributionForDuration
          .map((entry) => ({
              ...entry,
              totalVolumeUsd: parseFloat(entry.totalVolumeUsd),
          }))
          .sort((a, b) => b.totalVolumeUsd - a.totalVolumeUsd);

      // Process the top 5 orders (non-zero values)
      let othersVolume = 0;
      sortedEntries.forEach((entry, index) => {
          const volume = entry.totalVolumeUsd;
          totalVolume += volume;

          if (index < 5 && volume > 0) {
              orderVolumeStats.push({
                  name: abbreviateHash(entry.orderHash),
                  value: `$${volume.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                  })}`,
                  percentage: entry.volumePercentage,
              });
          } else {
              othersVolume += volume;
          }
      });

      // Add "Others" category
      if (othersVolume > 0) {
          orderVolumeStats.push({
              name: "Others",
              value: `$${othersVolume.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
              })}`,
              percentage: ((othersVolume / totalVolume) * 100).toFixed(2),
          });
      }

      // Prepare orderVolumeData
      const volumeData = sortedEntries.reduce((result, entry, index) => {
          const volume = entry.totalVolumeUsd;
          if (index < 5 && volume > 0) {
              result[abbreviateHash(entry.orderHash)] = volume;
          }
          return result;
      }, {});

      orderVolumeData.push({
          name: "Volume",
          ...volumeData,
          Others: othersVolume,
          total: totalVolume,
      });

      return { orderVolumeData, orderVolumeStats };
  };

  const prepareVaultUtilizationData = (
    token,
    aggregatedResults,
    combinedBalance
  ) => {
    const tokenAddress = tokenConfig[token]?.address.toLowerCase();
    const usedVaultBalance = Number(
        aggregatedResults?.find((e) => e.address.toLowerCase() === tokenAddress)
            ?.totalVolumeForDurationUsd || 0,
    );
    
    const unusedVaultBalance = Math.max(combinedBalance - usedVaultBalance, 0);
    const vaultUtilizationData = [
      {
        name: "Balance",
        "Volume": usedVaultBalance,
        "Unused": unusedVaultBalance,
        total: combinedBalance,
      },
    ];
    const usedPercentage =  ((usedVaultBalance / combinedBalance) * 100).toFixed(2);
    const unusedPercentage =  (((unusedVaultBalance) / combinedBalance) * 100).toFixed(2);

    const vaultUtilizationStats = [
      { name: "Volume", value: `$${usedVaultBalance}`, percentage: `${usedPercentage}` },
      { name: "Unused", value: `$${(unusedVaultBalance)}`, percentage: `${unusedPercentage}` },
    ];

    return {vaultUtilizationData, vaultUtilizationStats}

  }
  
  
  function abbreviateHash(hash) {
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  }
  
  const currentTimestamp = new Date()

  const renderBarChart = (data, title, yAxisLabel, stats, colorKeys, subtitle) => {

    // Generate color palette dynamically for the bar chart based on colorKeys length
    const bluePalette = generateColorPalette(colorKeys.length);
  
    return (
      <div className="bg-white rounded-lg shadow-lg p-5 flex flex-col justify-between">
        {/* Chart Title */}
        <h3 className="text-lg font-semibold text-center mb-2 text-gray-800">
          {title}
        </h3>
  
        {/* Subtitle (optional) */}
        {subtitle && (
          <p className="text-sm text-center text-gray-600 mb-4">{subtitle}</p>
        )}
  
        {/* Chart Container */}
        <ResponsiveContainer width="100%" height={250}>
        <BarChart
          data={data}
          margin={{ top: 5, right: 5, bottom: 20, left: 25 }}
        >
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis
            label={{
              value: yAxisLabel,
              angle: -90,
              position: "insideLeft",
              style: { fontSize: "14px" },
              tickFormatter:{formatValue} // Apply formatter for Y-axis ticks
            }}
            tick={{ fontSize: 12 }}
          />
          <Tooltip formatter={formatValue} /> {/* Apply formatter for tooltips */}

          {/* Stacked Bars with Key-Value Labels */}
          {colorKeys.map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              stackId="a"
              fill={bluePalette[index]} // Assign dynamic colors
            >
              {/* Add LabelList with custom formatter */}
              <LabelList
                dataKey={key}
                position="outside"
                formatter={(value) => `${key}: ${formatValue(value)}`} // Key-value format with formatting
                style={{ fill: "#fff", fontSize: 12 }}
              />
            </Bar>
          ))}

          {/* Total Stacked Value Labels */}
          <Bar
            dataKey="total"
            stackId="a"
            fill="transparent" // No actual bar, just for labels
            isAnimationActive={false}
          >
            <LabelList
              dataKey="total"
              position="outside" // Display total at the top of each bar
              style={{ fill: "#333", fontSize: 14, fontWeight: "bold" }}
              formatter={(value) => `Total: ${formatValue(value)}`} // Format for total
            />
          </Bar>
        </BarChart>
        </ResponsiveContainer>
  
        {/* Stats Section */}
        {stats && stats.length > 0 && (
          <div className="mt-4">
            {/* Stats Header */}
            <h4 className="text-lg font-semibold text-gray-800 mb-2">
              Statistics
            </h4>
  
            {/* Stats List */}
            <ul className="list-disc list-inside text-gray-700">
              {stats.map((stat, index) => (
                <li key={index}>
                  {/* Render stat name and value */}
                  {stat.name}: {stat.value}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderVaultList = (orders) => {
    // Extract relevant data for inputs and outputs with zero balance
    const tableData = orders.flatMap((order) => {
      const zeroBalanceInputs = order.inputs
        .filter((input) => parseFloat(input.balance) === 0)
        .map((input) => ({
          owner: abbreviateHash(order.owner),
          orderHash: abbreviateHash(order.orderHash),
          tokenSymbol: input.token.symbol,
          vaultId: input.vaultId,
        }));
  
      const zeroBalanceOutputs = order.outputs
        .filter((output) => parseFloat(output.balance) === 0)
        .map((output) => ({
          owner: abbreviateHash(order.owner),
          orderHash: abbreviateHash(order.orderHash),
          tokenSymbol: output.token.symbol,
          vaultId: output.vaultId,
        }));
  
      return [...zeroBalanceInputs, ...zeroBalanceOutputs];
    });
  
    return (
      <div className="bg-white rounded-lg shadow-lg p-5">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
          Vaults with Zero Balance
        </h3>
        <div className="overflow-x-auto overflow-y-auto max-h-80">
          <table className="table-auto w-full border-collapse border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 border border-gray-300 text-left text-sm font-semibold text-gray-700">
                  Owner
                </th>
                <th className="px-4 py-2 border border-gray-300 text-left text-sm font-semibold text-gray-700">
                  Order Hash
                </th>
                <th className="px-4 py-2 border border-gray-300 text-left text-sm font-semibold text-gray-700">
                  Token Symbol
                </th>
                <th className="px-4 py-2 border border-gray-300 text-left text-sm font-semibold text-gray-700">
                  Vault ID
                </th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, index) => (
                <tr
                  key={index}
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="px-4 py-2 border border-gray-300 text-sm text-gray-700">
                    {row.owner}
                  </td>
                  <td className="px-4 py-2 border border-gray-300 text-sm text-gray-700">
                    {row.orderHash}
                  </td>
                  <td className="px-4 py-2 border border-gray-300 text-sm text-gray-700">
                    {row.tokenSymbol}
                  </td>
                  <td className="px-4 py-2 border border-gray-300 text-sm text-gray-700">
                    {row.vaultId}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderVolBarChart = (dataSets, title, yAxisLabel, colorKeys, subtitles) => {
    // Generate color palette dynamically for the bar chart based on colorKeys length
    const bluePalette = generateColorPalette(colorKeys.length);
  
    return (
      <div className="bg-white rounded-lg shadow-lg p-5 flex flex-col">
        {/* Chart Title */}
        <h3 className="text-lg font-semibold text-center mb-2 text-gray-800">{title}</h3>
  
        {/* Subtitle (optional) */}
        {subtitles && (
          <p className="text-sm text-center text-gray-600 mb-4">{subtitles}</p>
        )}
  
        {/* Chart Container for all bar charts */}
        <div className="space-y-6">
          {dataSets.map((data, index) => (
            <ResponsiveContainer key={index} width="100%" height={250}>
              <BarChart
                data={data}
                margin={{ top: 10, right: 10, bottom: 20, left: 25 }}
              >
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis
                  label={{
                    value: yAxisLabel,
                    angle: -90,
                    position: "insideLeft",
                    style: { fontSize: "14px" },
                  }}
                  tickFormatter={formatValue} // Apply formatter for Y-axis ticks
                  tick={{ fontSize: 12 }}
                />
                <Tooltip formatter={formatValue} /> {/* Apply formatter for tooltips */}
  
                {/* Stacked Bars with Key-Value Labels */}
                {colorKeys.map((key, keyIndex) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    stackId="a"
                    fill={bluePalette[keyIndex]} // Assign dynamic colors
                  >
                    <LabelList
                      dataKey={key}
                      position="outside"
                      formatter={(value) => `${key}: ${formatValue(value)}`} // Key-value format with formatting
                      style={{ fill: "#fff", fontSize: 12 }}
                    />
                  </Bar>
                ))}
  
                {/* Total Stacked Value Labels */}
                <Bar
                  dataKey="total"
                  stackId="a"
                  fill="transparent" // No actual bar, just for labels
                  isAnimationActive={false}
                >
                  <LabelList
                    dataKey="total"
                    position="outside" // Display total at the top of each bar
                    style={{ fill: "#333", fontSize: 14, fontWeight: "bold" }}
                    formatter={(value) => `Total: ${formatValue(value)}`} // Format for total
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ))}
        </div>
      </div>
    );
  };
  

  const formatValue = (value) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    } else {
      return `${(value/1).toFixed(1)}`;
    }
  }; 

  const renderPieChart = ( title, stats, colorKeys, subtitle) => {
   console.log("stats : ", stats)
    const data = stats.map(item => ({
      ...item,
      value: parseFloat(item.value.replace(/[^0-9.-]+/g, "")),
      percentage: parseFloat(item.percentage),
    }));
    console.log(`data :`, JSON.stringify(data,null,2))

    let sumtest = data.reduce((sum, item) => sum + item.value, 0)
    console.log(`sumtest :`, sumtest)

    const totalVaultValue = formatValue(data.reduce((sum, item) => sum + item.value, 0));
    console.log(`totalVaultValue :`, totalVaultValue)
    const COLORS = colorKeys.map((_, index) => generateColorPalette(colorKeys.length)[index]);

  
    return (
      <div className="bg-white rounded-lg shadow-lg p-5 flex flex-col justify-between">
        {/* Chart Title */}
        <h3 className="text-lg font-semibold text-center mb-2 text-gray-800">{title}</h3>
        {subtitle && <p className="text-sm text-center text-gray-600 mb-4">{subtitle}</p>}
  
        {/* Pie Chart */}
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={90}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value"
              label={({ name, value, percentage }) =>
                `${name}: ${(percentage).toFixed(2)}%`
              }
            
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <text x="50%" y="50%" dy={8} textAnchor="middle" fill={"#0A1320"}>
              Total: ${totalVaultValue}
            </text>
            <Tooltip />
            
          </PieChart>
        </ResponsiveContainer>
        
        <div className="space-y-3 mt-4">
          {stats.map((stat, index) => (
            <div key={index}>
              <div className="flex justify-between mb-1">
                <span className="font-bold" style={{ color: COLORS[index] }}>
                  {stat.name}
                </span>
                <span>{stat.value}</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded">
                <div
                  className="h-full rounded"
                  style={{
                    width: `${stat.percentage}%`,
                    backgroundColor: COLORS[index],
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>


   
      </div>
    );
  };

  const renderVaultPieChart = (orders, title, subtitle) => {
    // Prepare data for vault balances
    const vaultBalances = {};
  
    // Aggregate balances from inputs and outputs
    orders.forEach((order) => {
      [...order.inputs, ...order.outputs].forEach((entry) => {
        const vaultId = entry.vaultId;
        const balance = parseFloat(ethers.utils.formatEther(entry.balance,entry.token.decimals));
  
        if (vaultBalances[vaultId]) {
          vaultBalances[vaultId].value += balance;
        } else {
          vaultBalances[vaultId] = {
            name: `Vault ${vaultId.slice(0, 6)}...${vaultId.slice(-4)}`, // Abbreviated vault ID
            value: balance,
          };
        }
      });
    });
  
    // Sort by balance in descending order
    const sortedVaults = Object.values(vaultBalances).sort(
      (a, b) => b.value - a.value
    );
  
    // Keep top 5 vaults and group the rest into "Others"
    const displayedVaults = sortedVaults.slice(0, 5);
    const othersValue = sortedVaults
      .slice(5)
      .reduce((sum, vault) => sum + vault.value, 0);
  
    if (othersValue > 0) {
      displayedVaults.push({ name: "Others", value: othersValue });
    }
  
    // Calculate total value and percentages
    const totalValue = displayedVaults.reduce((sum, vault) => sum + vault.value, 0);
    const data = displayedVaults.map((vault) => ({
      ...vault,
      percentage: (vault.value / totalValue) * 100,
    }));
  
    // Generate colors for the pie chart
    const COLORS = orders.map((_, index) =>
      generateColorPalette(orders.length)[index]
    );
  
    // Render the pie chart
    return (
      <div className="bg-white rounded-lg shadow-lg p-5 flex flex-col justify-between">
        {/* Chart Title */}
        <h3 className="text-lg font-semibold text-center mb-2 text-gray-800">
          {title}
        </h3>
        {subtitle && <p className="text-sm text-center text-gray-600 mb-4">{subtitle}</p>}
  
        {/* Pie Chart */}
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={90}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value"
              label={({ name, percentage }) =>
                `${name}: ${percentage.toFixed(2)}%`
              }
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <text
              x="50%"
              y="50%"
              dy={8}
              textAnchor="middle"
              fill={"#0A1320"}
              style={{ fontSize: "14px", fontWeight: "bold" }}
            >
              Total: {totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </text>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
  
        {/* Legend and Bars */}
        <div className="space-y-3 mt-4">
          {data.map((stat, index) => (
            <div key={index}>
              <div className="flex justify-between mb-1">
                <span className="font-bold" style={{ color: COLORS[index] }}>
                  {stat.name}
                </span>
                <span>{stat.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded">
                <div
                  className="h-full rounded"
                  style={{
                    width: `${stat.percentage}%`,
                    backgroundColor: COLORS[index],
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  
  
  const renderInsights = (totalRaindexTrades, totalExternalTrades, totalRaindexVolume, totalExternalVolume) => {
    
    const totalTrades = totalRaindexTrades + totalExternalTrades
    const totalVolume = totalRaindexVolume + totalExternalVolume

    const pieDataTrades = [
      { name: "Raindex Trades", value: totalRaindexTrades, percentage: ((totalRaindexTrades / totalTrades) * 100).toFixed(1) },
      { name: "External Trades", value: totalExternalTrades, percentage: ((totalExternalTrades / totalTrades) * 100).toFixed(1) },
    ];
  
    const pieDataVolume = [
      { name: "Raindex Volume", value: totalRaindexVolume, percentage: ((totalRaindexVolume / totalVolume) * 100).toFixed(1) },
      { name: "External Volume", value: totalExternalVolume, percentage: ((totalExternalVolume / totalVolume) * 100).toFixed(1) },
    ];
  
    const COLORS = pieDataVolume.map((_, index) => generateColorPalette(2)[index]);

  console.log(`************************** : `, totalVolume)
    
  const formatTotalVolume = formatValue(totalVolume)
  
    return (
      <div className="p-5">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Market Insights</h1>
          <p className="text-gray-600">Daily trading and volume statistics</p>
        </div>
  
        {/* Pie Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Trades Pie Chart */}
          <div className="bg-white shadow-md rounded-lg p-5">
            <h3 className="text-lg font-semibold text-gray-700 text-center mb-4">
              Trades Distribution
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieDataTrades}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                  // label={(entry) => `${entry.name}: ${entry.percentage}%`}
                  // position="top"
                >
                  {pieDataTrades.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <text x="50%" y="50%" dy={8} textAnchor="middle" fill={"#0A1320"}>
                  Total: {totalTrades}
                </text>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 mt-4">
              {pieDataTrades.map((stat, index) => (
                <div key={index}>
                  <div className="flex justify-between mb-1">
                    <span className="font-bold" style={{ color: COLORS[index] }}>
                      {stat.name}
                    </span>
                    <span>{stat.percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded">
                    <div
                      className="h-full rounded"
                      style={{
                        width: `${stat.percentage}%`,
                        backgroundColor: COLORS[index],
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
  
          {/* Volume Pie Chart */}
          <div className="bg-white shadow-md rounded-lg p-5">
            <h3 className="text-lg font-semibold text-gray-700 text-center mb-4">
              Volume Distribution
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieDataVolume}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                  // label={(entry) => `${entry.name}: ${entry.percentage}%`}
                >
                  {pieDataVolume.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <text x="50%" y="50%" dy={8} textAnchor="middle" fill={"#0A1320"}>
                  Total: ${formatTotalVolume.toString()}
                </text>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 mt-4">
              {pieDataVolume.map((stat, index) => (
                <div key={index}>
                  <div className="flex justify-between mb-1">
                    <span className="font-bold" style={{ color: COLORS[index] }}>
                      {stat.name}
                    </span>
                    <span>{stat.percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded">
                    <div
                      className="h-full rounded"
                      style={{
                        width: `${stat.percentage}%`,
                        backgroundColor: COLORS[index],
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );

  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <div className="spinner w-10 h-10 border-4 border-gray-300 border-t-indigo-500 rounded-full animate-spin"></div>
        <p>Loading...</p>
      </div>
    );
  }
  
  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="max-w-screen-3xl mx-auto p-8 bg-gray-100 rounded-lg shadow-lg">
      <div className="p-6 bg-gray-100 border-b border-gray-300">
        <div className="flex justify-between items-start">
          {/* Title Section */}
          <h1 className="text-2xl font-bold text-gray-800">
            {reportToken.toUpperCase()} Market Analysis Report
          </h1>

          {/* Info Section */}
          <div className="text-right space-y-4">
            <div>
              <span className="block font-semibold text-gray-600">Report generated at:</span>
              <p className="text-gray-700">{new Date(currentTimestamp).toLocaleString()}</p>
            </div>
            <div>
              <span className="block font-semibold text-gray-600">Report duration:</span>
              <p className="text-gray-700">
                {new Date(new Date(currentTimestamp) - reportDurationInSeconds * 1000).toLocaleString()} -{" "}
                {new Date(currentTimestamp).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5 md:grid-cols-3 sm:grid-cols-1">
        {
          renderBarChart(
            orderMetricsData,
            "Order Metrics",
            "Orders",
            orderMetricsStats,
            ['Active','InActive'],
            ``
          )
        }
        {tradeData.length > 0 &&
          tradeStats.length > 0 &&
          renderVolBarChart(
            tradeData,
            "Trade Distribution",
            "Trades",
            tradeStats.map((item) => item.name),
            `Trades over time`
        )}
        {volumeData.length > 0 &&
          volumeStats.length > 0 &&
          renderVolBarChart(
            volumeData,
            "Volume Distribution",
            "Volume",
            volumeStats.map((item) => item.name),
            `Volume over time`
        )}
        {
          renderInsights(
            totalRaindexTrades,
            totalExternalTrades,
            totalRaindexVolume,
            totalExternalVolume
          )
        }
        {vaultData.length > 0 &&
          vaultStats.length > 0 &&
          renderPieChart(
            "Vault Distribution",
            vaultStats,
            vaultStats.map((item) => item.name),
            ``
          )
        }
        {vaultUtilizationData.length > 0 &&
          vaultUtilizationStats.length > 0 &&
          renderBarChart(
            vaultUtilizationData,
            "Vault Utilization",
            "USD",
            vaultUtilizationStats,
            vaultUtilizationStats.map((item) => item.name),
            ``
          )}
        {
          orderVolumeData.length > 0 &&
          orderVolumeStats.length > 0 &&
          renderPieChart(
            "Volume by Order",
            orderVolumeStats,
            orderVolumeStats.map((item) => item.name),
            ``
          )
        }
        {
          activeOrders.length > 0 &&
          renderVaultList(
            activeOrders
          )
        }

        {
          allOrders &&
          allOrders.length > 0 &&
          renderVaultPieChart(
            allOrders,
            `${tokenConfig[reportToken.toUpperCase()].symbol} Vaults`,
            ``
          )
        }
      </div>
      <div className="mt-8 bg-gray-100 text-gray-700 text-base p-6 rounded-lg">
        <h3 className="text-left font-semibold text-lg mb-4">Data Sources</h3>
        <ul className="list-disc list-inside space-y-2">
          <li>
            <a
              href="https://docs.envio.dev/docs/HyperSync/overview"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              HyperSync Documentation
            </a>
          </li>
          <li>
            <a
              href={networkConfig[tokenConfig[reportToken.toUpperCase()]?.network].subgraphUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Raindex Subgraph API
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default RechartsDashboard;
