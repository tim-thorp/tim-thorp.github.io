// Create namespace for the chart
const BarcelonaChart = {};

BarcelonaChart.coxcomb = function() {
    // Chart parameters
    const config = {
        legend: ["france", "uk", "usa"],
        legendTitle: ["France", "United Kingdom", "USA"],
        delay: 0,
        duration: 500,
        height: 600,
        width: 600,
        margin: { top: 50, right: 50, bottom: 50, left: 50 }
    };

    let canvas, graph, centerX, centerY, numWedges;

    // Create arc generator
    const arc = d3.arc()
        .innerRadius(0)
        .startAngle(d => d.startAngle)
        .endAngle(d => d.endAngle)
        .outerRadius(d => d.radius);

    // Main chart function
    function chart(selection) {
        selection.each(function(data) {
            createBase(this);
            createWedges(data);
        });
    }

    // Create base SVG function
    function createBase(selection) {
        d3.select(selection).select('svg').remove();

        canvas = d3.select(selection)
            .append('svg')
            .attr('width', config.width)
            .attr('height', config.height)
            .attr('class', 'canvas')
            .style('display', 'block')
            .style('margin', '0 auto');

        centerX = config.width / 2;
        centerY = config.height / 2;

        graph = canvas.append('g')
            .attr('class', 'graph')
            .attr('transform', `translate(${centerX},${centerY})`);
    }

    // Create wedges function
    function createWedges(data) {
        numWedges = data.length;
        const angleSlice = (2 * Math.PI) / numWedges;

        const maxValue = d3.max(data, d => Math.max(d.france, d.uk, d.usa));
        const radiusScale = d3.scaleLinear()
            .domain([0, maxValue])
            .range([0, Math.min(config.width, config.height) / 2 - Math.max(...Object.values(config.margin))]);

        const wedgeData = [];
        data.forEach((d, i) => {
            const startAngle = i * angleSlice;
            const monthValues = config.legend.map(country => ({
                startAngle: startAngle,
                endAngle: startAngle + angleSlice,
                radius: radiusScale(d[country]),
                value: d[country],
                country: country,
                countryTitle: config.legendTitle[config.legend.indexOf(country)],
                month: d.month
            }));

            monthValues.sort((a, b) => b.value - a.value);
            wedgeData.push(...monthValues);
        });

        const wedges = graph.selectAll('.wedge')
            .data(wedgeData)
            .enter()
            .append('path')
            .attr('class', d => `wedge ${d.country}`)
            .attr('d', arc);

        wedges.on('mouseover', function(event, d) {
            const tooltip = d3.select('body')
                .append('div')
                .attr('class', 'tooltip')
                .style('opacity', 0);

            tooltip.transition()
                .duration(200)
                .style('opacity', 0.9);

            tooltip.html(`${d.countryTitle} - ${d.month}: ${d.value.toLocaleString()} visitors`)
                .style('left', `${event.pageX + 10}px`)
                .style('top', `${event.pageY - 28}px`);

            d3.select(this)
                .style('opacity', 0.8);
        })
            .on('mouseout', function() {
                d3.selectAll('.tooltip').remove();
                d3.select(this)
                    .style('opacity', 1);
            });

        graph.selectAll('.month-label')
            .data(data)
            .enter()
            .append('text')
            .attr('class', 'month-label')
            .attr('transform', (d, i) => {
                const angle = i * angleSlice + angleSlice / 2;
                const radius = Math.min(config.width, config.height) / 2 - 20;
                const x = Math.sin(angle) * radius;
                const y = -Math.cos(angle) * radius;
                return `translate(${x},${y})`;
            })
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .style('font-size', '12px')
            .text(d => d.month);
    }

    return chart;
};

// Initialize chart with data from CSV
document.addEventListener('DOMContentLoaded', async function() {
    const response = await fetch('nightingale.csv');
    const csvText = await response.text();
    const data = d3.csvParse(csvText);
    const chart = BarcelonaChart.coxcomb();
    d3.select('#chart')
        .datum(data)
        .call(chart);
});