// src/DepthChart.js
import React, { useEffect, useRef } from 'react';
import { Chart } from 'chart.js/auto';

const DepthChart = ({ orders }) => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    // Destroy existing chart instance if present
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    // Separate and sort buy/sell orders
    const buyOrders = orders.filter(o => o.side === 'buy').sort((a, b) => b.ioRatio - a.ioRatio);
    const sellOrders = orders.filter(o => o.side === 'sell').sort((a, b) => a.ioRatio - b.ioRatio);

    // Compute cumulative volumes for buy side
    let cumulative = 0;
    const buyDepthData = buyOrders.map(order => {
      cumulative += order.outputAmount;
      return { x: order.ioRatio, y: cumulative };
    });

    // Compute cumulative volumes for sell side
    cumulative = 0;
    const sellDepthData = sellOrders.map(order => {
      cumulative += order.outputAmount;
      return { x: order.ioRatio, y: cumulative };
    });

    // Create the chart
    chartInstanceRef.current = new Chart(chartRef.current, {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'Buy Depth',
            data: buyDepthData,
            borderColor: 'green',
            stepped: true,
            fill: false
          },
          {
            label: 'Sell Depth',
            data: sellDepthData,
            borderColor: 'red',
            stepped: true,
            fill: false
          }
        ]
      },
      options: {
        scales: {
          x: {
            type: 'linear',
            title: {
              display: true,
              text: 'Price'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Cumulative Quantity'
            }
          }
        }
      }
    });

    // Cleanup on component unmount or updates
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [orders]);

  return <canvas ref={chartRef} />;
};

export default DepthChart;
