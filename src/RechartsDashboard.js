import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,Cell, ResponsiveContainer } from "recharts";

const DEFAULT_COLORS = {
    raindex: '#000000',    // Black for Raindex
    external: '#404040',   // Dark gray for external
    
    tokens: {
      TFT: '#000000',      // Black for TFT
      BUSD: '#404040',     // Dark gray for BUSD
      USDC: '#808080'      // Medium gray for USDC
    },
    
    palettes: {
      orders: ['#000000', '#1A1A1A', '#333333', '#4D4D4D', '#666666'],
      pools: ['#000000', '#404040'],
      utilization: ['#000000', '#404040'],
      historical: ['#000000', '#1A1A1A', '#333333']
    },
    
    volumeDistribution: {
      internal: '#1A1A1A',
      external: '#000000',
      other: '#404040'
    }
  };

const RechartsDashboard = ({ markdownData }) => {

    const mergedColors = {
        ...DEFAULT_COLORS,
        tokens: { ...DEFAULT_COLORS.tokens},
        palettes: { ...DEFAULT_COLORS.palettes},
        volumeDistribution: { ...DEFAULT_COLORS.volumeDistribution}
      };
      console.log('mergedColors : ', mergedColors)
      console.log('here : ', mergedColors.palettes.orders[0])
    
      const currentTimestamp = new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

    // Main dashboard data
    const tradeData = [
  { name: "Trades", Raindex: 52, External: 1756, total: 1808 }
];
const tradeStats = [
  { name: "Raindex", value: "52", percentage: "2.88", color: mergedColors.palettes.orders[0]},
  { name: "External", value: "1756", percentage: "97.12", color: mergedColors.palettes.orders[1] }
];

const volumeData = [
  { name: "Volume", Raindex: 5219.98, External: 206877.23, total: 212097.21 }
];
const volumeStats = [
  { name: "Raindex", value: "$5,219.98", percentage: "2.46", color: mergedColors.volumeDistribution.internal },
  { name: "External", value: "$206,877.23", percentage: "97.54", color: mergedColors.volumeDistribution.external }
];

const orderVolumeData = [
  {
    name: "Volume",
    "0x15c2...bca1": 9738.13,
    "0x09dd...f2af": 573.18,
    "Others": 0,
    total: 10311.31
  }
];
const orderVolumeStats = [
  { name: "0x15c2...bca1", value: "$9,738.13", percentage: "94.44", color: mergedColors.palettes.orders[1] },
  { name: "0x09dd...f2af", value: "$573.18", percentage: "5.56", color: mergedColors.palettes.orders[2] },
  { name: "Others", value: "$0.00", percentage: "0.00", color: mergedColors.palettes.orders[3] }
];

const poolData = [
  { name: "Pool Size", "Liquidity Pool": 212097.21, "Other Pools": 0, total: 212097.21 }
];
const poolStats = [
  { name: "Liquidity Pool", value: "$212,097.21", percentage: "100.00", color: mergedColors.palettes.pools[0] },
  { name: "Other Pools", value: "$0.00", percentage: "0.00", color: mergedColors.palettes.pools[1] }
];

const vaultData = [
  { name: "Balance", KIMA: 106729.31, USDT: 6768.09, total: 113497.39 }
];
const vaultStats = [
  { name: "KIMA", value: "$106,729.31", percentage: "94.04", color: mergedColors.tokens.KIMA },
  { name: "USDT", value: "$6,768.09", percentage: "5.96", color: mergedColors.tokens.USDT }
];

const vaultUtilizationData = [
  { name: "Balance", "Used (24h)": 5219.98, "Unused": 113497.39 - 5219.98, total: 113497.39 }
];
const vaultUtilizationStats = [
  { name: "Used (24h)", value: "$5,219.98", percentage: "4.60", color: mergedColors.palettes.utilization[0] },
  { name: "Unused", value: "$108,277.41", percentage: "95.40", color: mergedColors.palettes.utilization[1] }
];

const historicalTradeData = [
  { name: "All Time", value: 61, timeframe: "All Time" },
  { name: "Last 24 Hours", value: 52, timeframe: "24 Hours" }
];

const historicalVolumeData = [
  { name: "All Time", value: 212097.21, timeframe: "All Time" },
  { name: "Last 24 Hours", value: 5219.98, timeframe: "24 Hours" }
];

const renderBarChart = (data, title, total, yAxisLabel, stats, colorKeys, subtitle) => (
    <div className="px-2"> {/* Removed w-1/3 */}
      <h3 className="text-center text-lg font-semibold mb-1">{title}</h3>
      <p className="text-center text-xs text-gray-600 mb-1">{total}</p>
      {subtitle && <p className="text-center text-xs text-gray-500 mb-2">{subtitle}</p>}
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 5, right: 5, bottom: 20, left: 25 }}>
          <XAxis dataKey="name" tick={{ fontSize: 20 }} />
          <YAxis
            label={{
              value: yAxisLabel,
              angle: -90,
              position: 'insideLeft',
              style: { fontSize: '20px' },
            }}
            tick={{ fontSize: 10 }}
          />
          <Tooltip />
          {colorKeys.map((key, index) => (
            <Bar key={key} dataKey={key} stackId="a" fill={stats[index].color} />
          ))}
        </BarChart>
      </ResponsiveContainer>
      <div className="text-center text-xs mt-2">
        {stats.map((stat, index) => (
          <div key={index} className="mb-1">
            <span style={{ color: stat.color }} className="font-semibold">
              {stat.name}:{' '}
            </span>
            <span>
              {stat.value} ({stat.percentage}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
  

// const renderBarChart = (data, title, total, yAxisLabel, stats, colorKeys, subtitle) => (
// <div className="w-1/3 px-2">
//     <h3 className="text-center text-lg font-semibold mb-1">{title}</h3>
//     <p className="text-center text-xs text-gray-600 mb-1">{total}</p>
//     {subtitle && <p className="text-center text-xs text-gray-500 mb-2">{subtitle}</p>}
//     <ResponsiveContainer width="100%" height={200}>
//     <BarChart data={data} margin={{ top: 5, right: 5, bottom: 20, left: 25 }}>
//         <XAxis dataKey="name" tick={{ fontSize: 20 }} />
//         <YAxis 
//         label={{ 
//             value: yAxisLabel, 
//             angle: -90, 
//             position: 'insideLeft',
//             style: { fontSize: '20px' }
//         }} 
//         tick={{ fontSize: 10 }}
//         />
//         <Tooltip />
//         {colorKeys.map((key, index) => (
//         <Bar key={key} dataKey={key} stackId="a" fill={stats[index].color} />
//         ))}
//     </BarChart>
//     </ResponsiveContainer>
//     <div className="text-center text-xs mt-2">
//     {stats.map((stat, index) => (
//         <div key={index} className="mb-1">
//         <span style={{color: stat.color}} className="font-semibold">{stat.name}: </span>
//         <span>{stat.value} ({stat.percentage}%)</span>
//         </div>
//     ))}
//     </div>
// </div>
// );
    
      const renderHistoricalChart = (data, title, yAxisLabel) => (
        <div className="w-1/2 px-2 mb-4">
          <h3 className="text-center text-lg font-semibold mb-1">{title}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} margin={{ top: 5, right: 5, bottom: 20, left: 25 }}>
              <XAxis dataKey="name" tick={{ fontSize: 20 }} />
              <YAxis 
                label={{ 
                  value: yAxisLabel, 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { fontSize: '20px' }
                }} 
                tick={{ fontSize: 10 }}
              />
              <Tooltip 
                formatter={(value, name, props) => [
                  yAxisLabel === "USD" ? `$${value.toLocaleString()}` : value.toLocaleString(),
                  props.payload.timeframe
                ]}
              />
              <Bar dataKey="value">
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={mergedColors.palettes.historical[index]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    
      return (
        <div className="max-w-6xl mx-auto p-4 bg-white rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">TFT Market Analysis Report</h1>
            <p className="text-gray-600">
              {currentTimestamp}
            </p>
          </div>
          
          <div className="space-y-3 mb-6">
            <p className="text-gray-800 text-sm">
              TFT has a monthly volume of $302,399.50, with $33,475.87 in Raindex volume and $268,923.63 in external volume. 
              The platform has 9 active and 14 inactive orders from 10 owners, with the latest order from December 22, 2024. 
              No new orders were added this month.
            </p>
            <p className="text-gray-800 text-sm">
              In the last month, Raindex accounts for 16.54% of market trades (298 of 1,802 total trades) and 11.07% of trading volume. 
              The vault balance utilization is 132% of the total $25,374.89 balance.
            </p>
          </div>
    
          {/* <div className="flex flex-wrap mb-4">
            {renderBarChart(tradeData, "Trade Distribution", "Total Trades: 1,802 (Last Month)", "Trades", tradeStats, ['Raindex', 'External'],'')}
            {renderBarChart(volumeData, "Volume Distribution", "Total Volume: $302,399.50 (Last Month)", "USD", volumeStats, ['Raindex', 'External'],'')}
            {renderBarChart(orderVolumeData, "Volume by Order", "Total Volume: $33,475.87 (Last Month)", "USD", orderVolumeStats, 
              orderVolumeStats.map(item => item.name),'')}
          </div> */}

{/* 
<div className="container mx-auto">
<div className="grid grid-cols-3 lg:grid-cols-1 gap-4 mb-4">
<div className="flex flex-wrap justify-center">
    {renderBarChart(
        tradeData,
        "Trade Distribution",
        "Total Trades: 1,802 (Last Month)",
        "Trades",
        tradeStats,
        ["Raindex", "External"],
        ""
    )}
    {renderBarChart(
        volumeData,
        "Volume Distribution",
        "Total Volume: $302,399.50 (Last Month)",
        "USD",
        volumeStats,
        ["Raindex", "External"],
        ""
    )}
    {renderBarChart(
        orderVolumeData,
        "Volume by Order",
        "Total Volume: $33,475.87 (Last Month)",
        "USD",
        orderVolumeStats,
        orderVolumeStats.map((item) => item.name),
        ""
    )}
  </div>
</div>
</div> */}

    {/* <div className="container mx-auto">
      <div className="grid grid-cols-3 gap-4 mb-4 lg:grid-cols-1">
        {renderBarChart(
          tradeData,
          "Trade Distribution",
          "Total Trades: 1,802 (Last Month)",
          "Trades",
          tradeStats,
          ["Raindex", "External"],
          ""
        )}

   
      </div>
      <div className="grid grid-cols-3 gap-4 mb-4 lg:grid-cols-1">
        {renderBarChart(
          volumeData,
          "Volume Distribution",
          "Total Volume: $302,399.50 (Last Month)",
          "USD",
          volumeStats,
          ["Raindex", "External"],
          ""
        )}

      </div>
      <div className="grid grid-cols-3 gap-4 mb-4 lg:grid-cols-1">
        {renderBarChart(
          orderVolumeData,
          "Volume by Order",
          "Total Volume: $33,475.87 (Last Month)",
          "USD",
          orderVolumeStats,
          orderVolumeStats.map((item) => item.name),
          ""
        )}
      </div>
    </div> */}

    
<div className="container mx-auto">
  {/* All charts in one grid */}
  <div className="grid grid-cols-3 gap-4 mb-4 lg:grid-cols-1">
    {/* Trade Distribution */}
    {renderBarChart(
      tradeData,
      "Trade Distribution",
      "Total Trades: 1,802 (Last Month)",
      "Trades",
      tradeStats,
      ["Raindex", "External"],
      ""
    )}

    {/* Volume Distribution */}
    {renderBarChart(
      volumeData,
      "Volume Distribution",
      "Total Volume: $302,399.50 (Last Month)",
      "USD",
      volumeStats,
      ["Raindex", "External"],
      ""
    )}

    {/* Volume by Order */}
    {renderBarChart(
      orderVolumeData,
      "Volume by Order",
      "Total Volume: $33,475.87 (Last Month)",
      "USD",
      orderVolumeStats,
      orderVolumeStats.map((item) => item.name),
      ""
    )}
  </div>
</div>





<div className="container mx-auto">
          <div className="flex flex-wrap mb-4">
            {renderBarChart(
              poolData, 
              "Pool Size Distribution", 
              "Total Pool Size: $302,399.50", 
              "USD", 
              poolStats, 
              poolStats.map(item => item.name),
              `Snapshot at ${currentTimestamp}`
            )}
            {renderBarChart(
              vaultData, 
              "Vault Distribution", 
              "Total Value: $25,084.49", 
              "USD", 
              vaultStats, 
              vaultStats.map(item => item.name),
              `Snapshot at ${currentTimestamp}`
            )}
            {renderBarChart(
              vaultUtilizationData, 
              "Vault Utilization", 
              "Total Balance: $25,374.89", 
              "USD", 
              vaultUtilizationStats, 
              vaultUtilizationStats.map(item => item.name),
              "Last Month"
            )}
          </div>
          </div>
          <div className="border-t mt-6 pt-6">
            <h2 className="text-xl font-bold mb-4 text-center">Historical Performance</h2>
            <div className="flex flex-wrap justify-center">
              {renderHistoricalChart(historicalTradeData, "Historical Trades", "Trades")}
              {renderHistoricalChart(historicalVolumeData, "Historical Volume", "USD")}
            </div>
            <div className="text-xs text-gray-500 text-center mt-2">
              Note: Monthly data is included in all-time figures
            </div>
          </div>
        </div>
      );
  };
  
  export default RechartsDashboard;

