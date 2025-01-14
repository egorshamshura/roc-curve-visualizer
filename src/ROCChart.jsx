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


        let combined = fpr.map((x, index) => ({ x, y: tpr[index] }));

        combined.sort((a, b) => {
            if (a.x === b.x) {
                return a.y - b.y;
            }
            return a.x - b.x;
        });


        fpr = combined.map(item => item.x);
        tpr = combined.map(item => item.y);


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

    const calcConfusionMatrix = (pts, threshold) => {
        let TP = 0;
        let FP = 0;
        let FN = 0;
        let TN = 0;
        console.log(pts.length);
        console.log(pts);
        for (let i = 0; i < pts.length; i++) {
            const predicted = pts[i][0] >= threshold ? 1 : 0;
            const actual = pts[i][1];
            if (predicted === 1 && actual === 1) {
                TP++;
            } else if (predicted === 1 && actual === 0) {
                FP++;
            } else if (predicted === 0 && actual === 1) {
                FN++;
            } else if (predicted === 0 && actual === 0) {
                TN++;
            }
        }
        console.log(TP, FP, FN, TN);
        setMetrics({
            accuracy : ((TP + TN) / (TP + TN + FP + FN)).toFixed(2),
            precision : (TP / (TP + FP)).toFixed(2),
            recall : (TP / (TP + FN)).toFixed(2)
        });
        return {TP : TP, FP:  FP, FN: FN, TN : TN };
    }

    const [metrics, setMetrics] = useState({
        accuracy: NaN,
        precision: NaN,
        recall: NaN,
    });


    const generateIdealROCData = (n_samples = 1000) => {
        const data = [];

        for (let i = 0; i < n_samples; i++) {
            const y_i = Math.random() < 0.5 ? 0 : 1;

            const p_i = y_i === 1
                ? Math.random() * 0.3 + 0.7
                : Math.random() * 0.3;

            data.push([p_i, y_i]);
        }

        return data;
    }

    const generateAlmostIdealROCData = (n_samples = 1000) => {
        const data = [];

        for (let i = 0; i < n_samples; i++) {
            const y_i = Math.random() < 0.5 ? 0 : 1;

            const p_i = y_i === 1
                ? Math.random() * 0.6 + 0.4
                : Math.random() * 0.6;

            data.push([p_i, y_i]);
        }

        return data;
    }



    const [value, setValue] = useState(50);
    const RangeSlider = () => {
        const [thrs, setThrs] = useState(value);
        const handleChange = (event) => {
            setThrs(event.target.value);
        };

        const handleMouseUp = () => {
            setValue(thrs)
            setMatrix(calcConfusionMatrix(dataPoints, value / 100));
        };

        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '30px' }}>
                <h3 style={{ marginBottom: '10px' }}>Threshold slider</h3>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={thrs}
                    onChange={handleChange}
                    onMouseUp={handleMouseUp}
                    style={{ width: '500px' }}
                />
                <p style={{ marginTop: '10px' }}> threshold: {thrs / 100}</p>
            </div>
        );
    };
    const [points, setPoints] = useState([]);
    const canvasRef = useRef(null);
    const [pointColor, setPointColor] = useState('red');
    const lineStartX = 50;
    const lineEndX = 550;

    const CanvasComponent = () => {
        const lineY = 100;

        const drawLine = (ctx) => {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
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
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(x, lineY, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.closePath();
            });
        };

        const sortPointsByX = (points) => {
            return points.sort((a, b) => a.x - b.x);
        };

        const handleClick = (event) => {
            const rect = canvasRef.current.getBoundingClientRect();
            const x = event.clientX - rect.left;
            if (x >= lineStartX && x <= lineEndX) {
                const newPoint = { x, color: pointColor };
                setPoints((prevPoints) => sortPointsByX([...prevPoints, newPoint]));
                const dp = [];
                for (let i = 0; i < points.length; i += 1) {
                    dp.push([(points[i].x - lineStartX) / (lineEndX - lineStartX), points[i].color === 'red' ? 0 : 1]);
                }
                setDataPoints(dp)
                const newRocData = calculateROC(dp);
                setRocData(newRocData);
                setMatrix(calcConfusionMatrix(dataPoints, value / 100));
            }
        };

        const handleClear = () => {
            setPoints([]);
            setMatrix(calcConfusionMatrix(dataPoints, value / 100));
        };

        const handleChangeColor = () => {
            setPointColor((prevColor) => (prevColor === 'red' ? 'blue' : 'red'));
        };

        const handleRandom = () => {
            const randomPoints = sortPointsByX(Array.from({ length: 30 }, () => {
                const randomX = Math.random() * (lineEndX - lineStartX) + lineStartX;
                const randomColor = ['red', 'blue'][Math.floor(Math.random() * 2)];
                return { x: randomX, color: randomColor };
            }));
            setPoints(randomPoints)
            const dp = [];
            for (let i = 0; i < points.length; i += 1) {
                dp.push([(randomPoints[i].x - lineStartX) / (lineEndX - lineStartX), randomPoints[i].color === 'red' ? 0 : 1]);
            }
            setDataPoints(dp)
            const newRocData = calculateROC(dp);
            setRocData(newRocData);
            setMatrix(calcConfusionMatrix(dataPoints, value / 100));
        };

        useEffect(() => {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            drawLine(ctx);
            drawPoints(ctx);
        }, [points, pointColor]);

        const handleIdeal = () => {
            const dp = generateIdealROCData(30);
            const pts = [];
            for (let i = 0; i < dp.length; i += 1) {
                pts.push({x : lineStartX + (lineEndX - lineStartX) * dp[i][0], color : dp[i][1] === 0 ? 'red' : 'blue'});
            }
            setPoints(pts)
            setDataPoints(dp)
            const newRocData = calculateROC(dp);
            setRocData(newRocData);
            setMatrix(calcConfusionMatrix(dataPoints, value / 100));
        }


        const handleAlmostIdeal = () => {
            const dp = generateAlmostIdealROCData(30);
            const pts = [];
            for (let i = 0; i < dp.length; i += 1) {
                pts.push({x : lineStartX + (lineEndX - lineStartX) * dp[i][0], color : dp[i][1] === 0 ? 'red' : 'blue'});
            }
            setPoints(pts)
            setDataPoints(dp)
            const newRocData = calculateROC(dp);
            setRocData(newRocData);
            setMatrix(calcConfusionMatrix(dataPoints, value / 100));
        }

        return (
            <div>
                <canvas
                    ref={canvasRef}
                    width={600}
                    height={120}
                    onClick={handleClick}
                    style={{display: 'block', margin: '0 auto'}}
                />
                <button onClick={handleClear} style={{marginTop: '10px', display: 'block', margin: 'auto'}}>
                    Clear
                </button>
                <button onClick={handleChangeColor} style={{marginTop: '10px', display: 'block', margin: 'auto'}}>
                    Change Point Color (Current: {pointColor})
                </button>
                <button onClick={handleRandom} style={{marginTop: '10px', display: 'block', margin: 'auto'}}>
                    Random
                </button>
                <button onClick={handleIdeal} style={{marginTop: '10px', display: 'block', margin: 'auto'}}>
                    Ideal
                </button>
                <button onClick={handleAlmostIdeal} style={{marginTop: '10px', display: 'block', margin: 'auto'}}>
                    AlmostIdeal
                </button>
            </div>
        );
    };

    const [matrix, setMatrix] = useState({
        TP: 40,
        FP: 7,
        FN: 8,
        TN: 44,
    });

    const ConfusionMatrix = () => {
        return (
            <div style={{ textAlign: "center" }}>
                <h2>Confusion matrix</h2>
                <table className="confusion-matrix">
                    <thead>
                    <tr>
                        <th></th>
                        <th colSpan="2">Actually</th>
                    </tr>
                    <tr>
                        <th></th>
                        <th>Positive</th>
                        <th>Negative</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr>
                        <th>Predicted Positive</th>
                        <td className="tp">
                            TP={matrix.TP}
                        </td>
                        <td className="fp">
                            FP={matrix.FP}
                        </td>
                    </tr>
                    <tr>
                        <th>Predicted Negative</th>
                        <td className="fn">
                            FN={matrix.FN}
                        </td>
                        <td className="tn">
                            TN={matrix.TN}
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="chart-container">
            <h2>ROC Curve</h2>
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '10px',
                width: '100%',
                height: '100vh',
                boxSizing: 'border-box',
            }}>
                <div>
                    <h2>Metrics</h2>
                    <p>Accuracy: {metrics.accuracy}</p>
                    <p>Precision: {isNaN(metrics.precision) ? 'NaN' : metrics.precision}</p>
                    <p>Recall: {metrics.recall}</p>
                </div>
                <ConfusionMatrix/>
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

