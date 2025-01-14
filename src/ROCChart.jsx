import {useEffect, useRef, useState} from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import './ROCChart.css';

Chart.register(...registerables);

const ROCChart = () => {
    const [dataPoints, setDataPoints] = useState([]);
    const [rocData, setRocData] = useState({ labels: [], datasets: [] });
    const [auc, setAuc] = useState(0);

    const calculateROC = (points) => {
        const sortedPoints = points.sort((a, b) => a[0] - b[0]);
        const totalPositive = points.filter(point => point[1] === 1).length;
        const totalNegative = points.length - totalPositive;
        let tpr = [0];
        let fpr = [0];

        const thresholds = [...new Set(sortedPoints.map(point => point[0]))];
        thresholds.forEach((threshold) => {
            let truePositiveRate = 0;
            let falsePositiveRate = 0;
            sortedPoints.forEach((point) => {
                if (point[0] > threshold && point[1] === 1) {
                    truePositiveRate++;
                } else if (point[0] > threshold && point[1] === 0)
                {
                    falsePositiveRate++;
                }
            })

            tpr.push(truePositiveRate / totalPositive);
            fpr.push(falsePositiveRate / totalNegative);
        });

        fpr.push(1)
        tpr.push(1)
        console.log(fpr.join(' '));
        console.log(tpr.join(' '));

        let combined = fpr.map((x, index) => ({ x, y: tpr[index] }));

        combined.sort((a, b) => {
            if (a.x === b.x) {
                return a.y - b.y;
            }
            return a.x - b.x;
        });


        fpr = combined.map(item => item.x);
        tpr = combined.map(item => item.y);
        console.log(fpr.join(' '));
        console.log(tpr.join(' '));
        // Вычисляем AUC
        const aucValue = calculateAUC(fpr, tpr);
        setAuc(aucValue);
        const uniqueFPR = [...new Set(fpr)];
        return {
            labels: uniqueFPR.map((x) => x),
            datasets: [
                {
                    label: 'ROC Curve',
                    data: tpr.map((tprValue, idx) => ({ x: fpr[idx], y: tprValue })),
                    borderColor: 'rgba(75, 192, 192, 1)',
                    fill: false,
                },
            ],
        };
    };

    const calculateAUC = (fpr, tpr) => {
        let area = 0;
        for (let i = 0; i < fpr.length - 1; i++) {
            area += (fpr[i + 1] - fpr[i]) * (tpr[i + 1] + tpr[i]) / 2;
        }
        return area;
    };

    const RangeSlider = () => {
        const [value, setValue] = useState(50); // Default value

        const handleChange = (event) => {
            setValue(event.target.value);
        };

        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '30px' }}>
                <h3 style={{ marginBottom: '10px' }}>Threshold slider</h3>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={value}
                    onChange={handleChange}
                    style={{ width: '500px' }}
                />
                <p style={{ marginTop: '10px' }}>threshold: {value / 100}</p>
            </div>
        );
    };
    const [points, setPoints] = useState([]);
    const canvasRef = useRef(null);
    const [pointColor, setPointColor] = useState('red'); // Initial color for points
    const lineStartX = 50; // Start X position of the line
    const lineEndX = 550;
    const CanvasComponent = () => {
        const lineY = 100; // Y position of the line

        const drawLine = (ctx) => {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // Clear the canvas
            ctx.beginPath();
            ctx.moveTo(lineStartX, lineY);
            ctx.lineTo(lineEndX, lineY);
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.closePath();
        };

        const drawPoints = (ctx) => {
            points.forEach(({ x, color }) => {
                ctx.fillStyle = color; // Set the point color
                ctx.beginPath();
                ctx.arc(x, lineY, 5, 0, Math.PI * 2); // Draw a circle for each point
                ctx.fill();
                ctx.closePath();
            });
        };

        const sortPointsByX = (points) => {
            return points.sort((a, b) => a.x - b.x);
        };

        const handleClick = (event) => {
            const rect = canvasRef.current.getBoundingClientRect();
            const x = event.clientX - rect.left; // Get X position relative to canvas
            if (x >= lineStartX && x <= lineEndX) {
                const newPoint = { x, color: pointColor }; // Create a new point with the current color
                setPoints((prevPoints) => sortPointsByX([...prevPoints, newPoint])); // Add point to the array
                const dp = [];
                for (let i = 0; i < points.length; i += 1) {
                    dp.push([(points[i].x - lineStartX) / (lineStartX - lineEndX), points[i].color === 'red' ? 0 : 1]);
                }
                setDataPoints(dp)
                const newRocData = calculateROC(dp);
                setRocData(newRocData);
            }
            console.log(points)
        };

        const handleClear = () => {
            setPoints([]); // Clear the points array
        };

        const handleChangeColor = () => {
            // Toggle between red and blue
            setPointColor((prevColor) => (prevColor === 'red' ? 'blue' : 'red'));
        };

        const handleRandom = () => {
            const randomPoints = sortPointsByX(Array.from({ length: 10 }, () => {
                const randomX = Math.random() * (lineEndX - lineStartX) + lineStartX;
                const randomColor = ['red', 'blue'][Math.floor(Math.random() * 2)];
                return { x: randomX, color: randomColor };
            }));
            setPoints(randomPoints)
            const dp = [];
            for (let i = 0; i < points.length; i += 1) {
                dp.push([(randomPoints[i].x - lineStartX) / (lineStartX - lineEndX), randomPoints[i].color === 'red' ? 0 : 1]);
            }
            setDataPoints(dp)
            const newRocData = calculateROC(dp);
            setRocData(newRocData);  q
        };

        useEffect(() => {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            drawLine(ctx);
            drawPoints(ctx);
        }, [points, pointColor]);

        return (
            <div>
                <canvas
                    ref={canvasRef}
                    width={600}
                    height={120}
                    onClick={handleClick}
                    style={{ display: 'block', margin: '0 auto' }}
                />
                <button onClick={handleClear} style={{ marginTop: '10px', display: 'block', margin: 'auto' }}>
                    Clear
                </button>
                <button onClick={handleChangeColor} style={{ marginTop: '10px', display: 'block', margin: 'auto' }}>
                    Change Point Color (Current: {pointColor})
                </button>
                <button onClick={handleRandom} style={{ marginTop: '10px', display: 'block', margin: 'auto' }}>
                    Random
                </button>
            </div>
        );
    };


    return (
        <div className="chart-container">
            <h2>ROC Curve</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px', width: '30%' }}>
                <RangeSlider/>
                <CanvasComponent/>
            </div>
            <div className="line-chart">
                <Line
                    data={{
                        labels: rocData.labels,
                        datasets: rocData.datasets,
                    }}
                    options={{
                        scales: {
                            x: {
                                title: {
                                    display: true,
                                    text: 'False Positive Rate',
                                },
                            },
                            y: {
                                title: {
                                    display: true,
                                    text: 'True Positive Rate',
                                },
                            },
                        },
                    }}
                />
            </div>
            <div className="auc-value">
                <h3>AUC: {auc.toFixed(2)}</h3> {}
            </div>
        </div>
    );
};

export default ROCChart;

