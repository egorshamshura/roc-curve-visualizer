import { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import './ROCChart.css'; // Импортируем CSS файл

Chart.register(...registerables);

const ROCChart = () => {
    const [dataPoints, setDataPoints] = useState([]);
    const [rocData, setRocData] = useState({ labels: [], datasets: [] });
    const [auc, setAuc] = useState(0);
    const [inputArray, setInputArray] = useState('');

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

    const generateRandomPoints = (numPoints = 10) => {
        const randomPoints = [];
        for (let i = 0; i < numPoints; i++) {
            const p = Math.random();
            const y = Math.random() < 0.5 ? 0 : 1;
            randomPoints.push([p, y]);
        }
        setDataPoints(randomPoints);
        const newRocData = calculateROC(randomPoints);
        setRocData(newRocData);
    };

    const handleArrayInput = (e) => {
        e.preventDefault();
        try {
            const points = JSON.parse(inputArray);
            if (!Array.isArray(points) || !points.every(point => Array.isArray(point) && point.length === 2)) {
                throw new Error('Неверный формат массива. Используйте [[p1, y1], [p2, y2], ...]');
            }
            setDataPoints(points);
            const newRocData = calculateROC(points);
            setRocData(newRocData);
            setInputArray('');
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <div className="chart-container">
            <h2>ROC Curve</h2>
            <form onSubmit={handleArrayInput}>
                <input
                    type="text"
                    value={inputArray}
                    onChange={(e) => setInputArray(e.target.value)}
                    placeholder='В формате [[p1, y1], [p2, y2], ...]'
                    required
                />
                <button type="submit">Добавить точки</button>
            </form>
            <button onClick={() => generateRandomPoints(50)}>Сгенерировать случайные 50 точек</button>
            <button onClick={() => generateRandomPoints(100)}>Сгенерировать случайные 100 точек</button>
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

