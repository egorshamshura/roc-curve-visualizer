import {useEffect, useRef, useState} from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import './ROCChart.css';

Chart.register(...registerables);

const ROCChart = () => {
    const [dataPoints, setDataPoints] = useState([]);
    const [rocData, setRocData] = useState({ labels: [], datasets: [] });
    const [auc, setAuc] = useState(0);
    const [[h_x, h_y], setXY] = useState([0, 0]);


    const calculateROC = (points) => {
        if (points === rocData)
            return;
        const sortedPoints = points.sort((a, b) => a[0] - b[0]);
        const totalPositive = points.filter(point => point[1] === 1).length;
        const totalNegative = points.length - totalPositive;
        let tpr = [0];
        let fpr = [0];
        let [highlighted_x, highlighted_y] = [0, 0]
        let diff = 10000
        const thresholds = [...new Set(sortedPoints.map(point => point[0]))];
        console.log(value);
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
            if (Math.abs(value / 100 - threshold) < diff) {
                highlighted_y = truePositiveRate / totalPositive
                highlighted_x = falsePositiveRate / totalNegative
                console.log(value);
                diff = Math.abs(value / 100 - threshold)
            }
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
        if (value === '0')
        {
            setXY([1, 1]);
        } else if (value === 100)
        {
            setXY([0, 0]);
        } else
        {
            console.log(value);
            setXY([highlighted_x, highlighted_y]);
        }

        calcConfusionMatrix(sortedPoints, value / 100)
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
        setMetrics({
            accuracy : ((TP + TN) / (TP + TN + FP + FN)).toFixed(2),
            precision : (TP / (TP + FP)).toFixed(2),
            recall : (TP / (TP + FN)).toFixed(2)
        });
        let tpr_ = TP / (TP + FN);
        let fpr_ = FP / (FP + TN);
        console.log(fpr_, tpr_)
        setXY([fpr_, tpr_]);
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


    const generateAlmostIdealSwitchROCData = (n_samples = 1000) => {
        const data = [];

        for (let i = 0; i < n_samples; i++) {
            const y_i = Math.random() < 0.5 ? 0 : 1;

            const p_i = y_i === 0
                ? Math.random() * 0.6 + 0.4
                : Math.random() * 0.6;

            data.push([p_i, y_i]);
        }

        return data;
    }


    const [value, setValue] = useState(50);

    const RangeSlider = () => {
        const [thrs, setThrs] = useState(value);
        const tempValueRef = useRef(value);

        const handleChange = (event) => {
            tempValueRef.current = event.target.value;
        };

        const handleInteractionEnd = () => {
            const finalValue = tempValueRef.current;
            setThrs(finalValue);
            setMatrix(calcConfusionMatrix(dataPoints, finalValue / 100));

            const dp = points.map((pt) => [
                (pt.x - lineStartX) / (lineEndX - lineStartX),
                pt.color === 'red' ? 0 : 1,
            ]);
            setValue(finalValue);
            setMatrix(calcConfusionMatrix(dataPoints, finalValue / 100));
            calculateROC(dp);
            setMatrix(calcConfusionMatrix(dataPoints, finalValue / 100));
        };

        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    marginTop: '5px',
                }}
            >
                <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    defaultValue={value}
                    style={{
                        width: '804px',
                        WebkitAppearance: 'none',
                        appearance: 'none',
                        height: '8px',
                        background: 'transparent',
                        outline: 'none',
                        borderRadius: '4px',
                        position: 'relative',
                        zIndex: 2,
                    }}
                    onChange={handleChange}
                    onMouseUp={handleInteractionEnd}
                    onTouchEnd={handleInteractionEnd}
                />
                <style>
                    {`
                input[type="range"]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 4px;
                    height: 40px;
                    background: #007bff;
                    cursor: pointer;
                    border-radius: 0;
                    margin-top: -55px;
                }

                input[type="range"]::-moz-range-thumb {
                    width: 4px;
                    height: 15px;
                    background: #007bff;
                    cursor: pointer;
                    border: none;
                }

                input[type="range"]::-webkit-slider-runnable-track {
                    background: transparent; /* Прозрачная дорожка */
                }

                input[type="range"]::-moz-range-track {
                    background: transparent; /* Прозрачная дорожка */
                }
            `}
                </style>
                <p style={{ marginTop: '1px' }}>threshold: {thrs / 100}</p>
            </div>
        );
    };


    const [points, setPoints] = useState([]);
    const canvasRef = useRef(null);
    const [pointColor, setPointColor] = useState('red');
    const lineStartX = 50;
    const lineEndX = 848;

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
            points.forEach(({x, color}) => {
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
            const newPoint = { x, color: pointColor };
            if (x >= lineStartX && x <= lineEndX) {
                const newPoints = [...points, newPoint]
                setPoints(newPoints);
                const dp = [];
                for (let i = 0; i < newPoints.length; i += 1) {
                    dp.push([(newPoints[i].x - lineStartX) / (lineEndX - lineStartX), newPoints[i].color === 'red' ? 0 : 1]);
                }
                setDataPoints(dp)
                const newRocData = calculateROC(dp);
                setRocData(newRocData);
                setMatrix(calcConfusionMatrix(dataPoints, value / 100));
            }
        };

        const handleClear = () => {
            setPoints([]);
            setRocData({
                labels: [],
                datasets: [
                    {
                        label: 'ROC Curve',
                        data: {},
                        borderColor: 'rgba(75, 192, 192, 1)',
                        fill: false,
                    },
                ],
            })
            setAuc(NaN);
            setXY([0, 0])
            setMetrics({accuracy : NaN, precision: NaN, recall : NaN});
            setMatrix(calcConfusionMatrix([], value / 100));
        };

        const handleChangeColor = () => {
            setPointColor((prevColor) => (prevColor === 'red' ? 'blue' : 'red'));
        };

        const handleRandom = () => {
            let randomPoints = sortPointsByX(Array.from({ length: 30 }, () => {
                const randomX = Math.random() * (lineEndX - lineStartX) + lineStartX;
                const randomColor = ['red', 'blue'][Math.floor(Math.random() * 2)];
                return { x: randomX, color: randomColor };
            }));
            setPoints(randomPoints)
            const dp = [];
            for (let i = 0; i < randomPoints.length; i += 1) {
                dp.push([(randomPoints[i].x - lineStartX) / (lineEndX - lineStartX), randomPoints[i].color === 'red' ? 0 : 1]);
            }
            setDataPoints(dp)
            const newRocData = calculateROC(dp);
            setRocData(newRocData);
            setMatrix(calcConfusionMatrix(dp, value / 100));
        };

        useEffect(() => {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            drawLine(ctx);
            drawPoints(ctx);
        }, []);

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

        const handleAlmostIdealSwitch = () => {
            const dp = generateAlmostIdealSwitchROCData(30);
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
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <div style={{marginRight: '20px'}}>
                    <canvas
                        ref={canvasRef}
                        width={900}
                        height={120}
                        onClick={handleClick}
                        style={{display: 'block'}}
                    />
                    <RangeSlider/>
                </div>
                <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                    <button onClick={handleClear}>
                        Clear
                    </button>
                    <button onClick={handleChangeColor}>
                        Change Point Color (Current: {pointColor})
                    </button>
                    <button onClick={handleRandom}>
                        Random
                    </button>
                    <button onClick={handleIdeal}>
                        Ideal
                    </button>
                    <button onClick={handleAlmostIdeal}>
                        AlmostIdeal
                    </button>
                    <button onClick={handleAlmostIdealSwitch}>
                        AlmostIdealSwitch
                    </button>
                </div>
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
            <div style={{textAlign: "center"}}>
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
                    <p>AUC: {auc.toFixed(2)} </p>
                </div>
                <ConfusionMatrix/>
                <CanvasComponent/>
            </div>
            <div className="line-chart">
                <Line
                    data={{
                        labels: rocData.labels,
                        datasets: rocData.datasets.concat([{
                            label: 'Highlighted Point',
                            data: [{ x: h_x, y: h_y }],
                            borderColor: 'red',
                            backgroundColor: 'red',
                            pointRadius: 10,
                            showLine: false,
                        }]),
                    }}
                    options={{
                        scales: {
                            x: {
                                type: 'linear',
                                min: 0,
                                max: 1,
                                ticks: {
                                    stepSize: 0.1,
                                },
                                title: {
                                    display: true,
                                    text: 'False Positive Rate',
                                },
                            },
                            y: {
                                min: 0,
                                max: 1,
                                ticks: {
                                    stepSize: 0.1,
                                },
                                title: {
                                    display: true,
                                    text: 'True Positive Rate',
                                },
                            },
                        },
                    }}
                />
            </div>
        </div>
    );
};

export default ROCChart;

