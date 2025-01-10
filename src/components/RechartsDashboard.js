import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import React, { useState, useEffect } from "react";
import {analyzeLiquidity,fetchAndFilterOrders,tokenMetrics,calculateCombinedVaultBalance,volumeMetrics,tokenConfig} from "raindex-reports"
import { useParams } from "react-router-dom";


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
        const allOrders = filteredActiveOrders.concat(filteredInActiveOrders);
        const {tokenVaultSummary} = await tokenMetrics(filteredActiveOrders);
        const {vaultData, vaultStats} = prepareVaultDataAndStats(tokenVaultSummary);

        setVaultData(vaultData)
        setVaultStats(vaultStats)

        const {
          totalTokenExternalVolForDurationUsd,
          totalTokenExternalTradesForDuration,
        } = await analyzeLiquidity(network,token,durationInSeconds);
        const {
          tradesLastForDuration: totalRaindexTradesForDuration,
          aggregatedResults,
          volumeDistributionForDuration
        } = await volumeMetrics(network, allOrders, durationInSeconds, token);
        const {tradeData, tradeStats, volumeData, volumeStats} = prepareTradeAndVolumeStats(token,totalRaindexTradesForDuration,aggregatedResults,totalTokenExternalVolForDurationUsd,totalTokenExternalTradesForDuration);
        setTradeData(tradeData)
        setTradeStats(tradeStats)
        setVolumeData(volumeData)
        setVolumeStats(volumeStats) 
        const { orderVolumeData, orderVolumeStats } = prepareOrderVolumeData(volumeDistributionForDuration)
        setOrderVolumeData(orderVolumeData)
        setOrderVolumeStats(orderVolumeStats)

        const combinedBalance = await calculateCombinedVaultBalance(allOrders);
        const {vaultUtilizationData, vaultUtilizationStats} = prepareVaultUtilizationData(
          token,
          aggregatedResults,
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
        value: `$${token.totalTokenBalanceUsd.toLocaleString()}`,
        percentage: percentage,
      };
    });
  
    return { vaultData, vaultStats };
  };

  const prepareTradeAndVolumeStats = 
    (token,totalRaindexTradesForDuration,aggregatedResults,totalTokenExternalVolForDurationUsd,totalTokenExternalTradesForDuration) => {
        const tokenAddress = tokenConfig[token]?.address.toLowerCase();
        const totalRaindexVolumeUsd = Number(
            aggregatedResults?.find((e) => e.address.toLowerCase() === tokenAddress)
                ?.totalVolumeForDurationUsd || 0,
        );

        const totalExternalTrades =
            totalTokenExternalTradesForDuration - totalRaindexTradesForDuration;
        const totalExternalVolumeUsd = totalTokenExternalVolForDurationUsd - totalRaindexVolumeUsd;

        const totalExternalTradesPercentage = ((totalExternalTrades / totalTokenExternalTradesForDuration) * 100).toFixed(2);
        const totalRaindexTradesPercentage = ((totalRaindexTradesForDuration / totalTokenExternalTradesForDuration) * 100).toFixed(2);
        const totalExternalVolumePercentage = ((totalExternalVolumeUsd / totalTokenExternalVolForDurationUsd) * 100).toFixed(2);
        const totalRaindexVolumePercentage = ((totalRaindexVolumeUsd / totalTokenExternalVolForDurationUsd) * 100).toFixed(2);


        const tradeData = [
          { name: "Trades", Raindex: totalRaindexTradesForDuration, External: totalExternalTrades, total: totalTokenExternalTradesForDuration },
        ];
        const tradeStats = [
          { name: "Raindex", value: `${totalRaindexTradesForDuration}`, percentage: `${totalRaindexTradesPercentage}` },
          { name: "External", value: `${totalExternalTrades}`, percentage: `${totalExternalTradesPercentage}` },
        ];
      
        const volumeData = [
          { name: "Volume", Raindex: totalRaindexVolumeUsd, External: totalExternalVolumeUsd, total: totalTokenExternalVolForDurationUsd },
        ];
        const volumeStats = [
          { name: "Raindex", value: `$${totalRaindexVolumeUsd}`, percentage: `${totalRaindexVolumePercentage}` },
          { name: "External", value: `$${totalExternalVolumeUsd}`, percentage: `${totalExternalVolumePercentage}` },
        ];

        return {tradeData, tradeStats, volumeData, volumeStats}
        
  }

  const prepareOrderVolumeData = (volumeDistributionForDuration) => {
    const orderVolumeData = [];
    const orderVolumeStats = [];
    let totalVolume = 0;
  
    // Calculate total volume and prepare stats
    volumeDistributionForDuration.forEach((entry) => {
      const volume = parseFloat(entry.totalVolumeUsd);
      totalVolume += volume;
  
      if (volume > 0) {
        orderVolumeStats.push({
          name: abbreviateHash(entry.orderHash),
          value: `$${volume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          percentage: entry.volumePercentage,
        });
      }
    });
  
    // Handle "Others" category
    const othersVolume = volumeDistributionForDuration
      .filter((entry) => parseFloat(entry.totalVolumeUsd) === 0)
      .reduce((sum, entry) => sum + parseFloat(entry.totalVolumeUsd), 0);
  
    orderVolumeStats.push({
      name: "Others",
      value: `$${othersVolume.toFixed(2)}`,
      percentage: ((othersVolume / totalVolume) * 100).toFixed(2),
    });
  
    // Prepare orderVolumeData
    const volumeData = volumeDistributionForDuration.reduce((result, entry) => {
      const volume = parseFloat(entry.totalVolumeUsd);
  
      if (volume > 0) {
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
  }

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
        "Used Balance": usedVaultBalance,
        Unused: unusedVaultBalance,
        total: combinedBalance,
      },
    ];
    const usedPercentage =  ((usedVaultBalance / combinedBalance) * 100).toFixed(2);
    const unusedPercentage =  (((unusedVaultBalance) / combinedBalance) * 100).toFixed(2);

    const vaultUtilizationStats = [
      { name: "Used", value: `$${usedVaultBalance}`, percentage: `${usedPercentage}` },
      { name: "Unused", value: `$${(unusedVaultBalance)}`, percentage: `${unusedPercentage}` },
    ];

    return {vaultUtilizationData, vaultUtilizationStats}

  }
  
  // Helper function to abbreviate order hashes
  function abbreviateHash(hash) {
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  }
  
  const currentTimestamp = new Date()

  const renderBarChart = (data, title, yAxisLabel, stats, colorKeys, subtitle) => {
    const bluePalette = generateColorPalette(colorKeys.length); // Assume this function generates colors dynamically.
  
    return (
      <div className="bg-white rounded-lg shadow-lg p-5 flex flex-col justify-between">
        {/* Chart Title */}
        <h3 className="text-lg font-semibold text-center mb-2 text-gray-800">{title}</h3>
        {subtitle && <p className="text-sm text-center text-gray-600 mb-4">{subtitle}</p>}
  
        {/* Chart Container */}
        <ResponsiveContainer width="100%" height={200}>
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
              }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip />
            {colorKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                stackId="a"
                fill={bluePalette[index]} // Dynamic color assignment
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
  
        {/* Stats Section */}
        <div className="grid grid-cols-2 gap-1 mt-4 text-center text-base">
          {stats.map((stat, index) => (
            <div key={index} className="flex justify-between">
              <span style={{ color: bluePalette[index] }} className="font-semibold">
                {stat.name}:
              </span>{" "}
              <span>
                {stat.value} ({stat.percentage}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

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
        {tradeData.length > 0 &&
          tradeStats.length > 0 &&
          renderBarChart(
            tradeData,
            "Trade Distribution",
            "Trades",
            tradeStats,
            tradeStats.map((item) => item.name),
            ``
          )}
        {volumeData.length > 0 &&
          volumeStats.length > 0 &&
          renderBarChart(
            volumeData,
            "Volume Distribution",
            "Trades",
            volumeStats,
            volumeStats.map((item) => item.name),
            ``
          )}
        {orderVolumeData.length > 0 &&
          orderVolumeStats.length > 0 &&
          renderBarChart(
            orderVolumeData,
            "Volume by Order",
            "USD",
            orderVolumeStats,
            orderVolumeStats.map((item) => item.name),
            ``
          )}
        {vaultData.length > 0 &&
          vaultStats.length > 0 &&
          renderBarChart(
            vaultData,
            "Vault Distribution",
            "USD",
            vaultStats,
            vaultStats.map((item) => item.name),
            ``
          )}
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
      </div>
    </div>
  );
};

export default RechartsDashboard;
