import ga_event from "./ga_event.js"


// Retrieve ramo info to modal, triggered on modal show
export const loadQuota = (id) => {
    var modal = $("#quotaChart")
    modal.html("<div class=\"spinner-border\" role=\"status\"></div>")

    $.get(`/banner/${id.toString()}`)
        .done((response) => loadQuotaHandleResponse(response, modal))
        .catch(error => {
            console.log(error)
            modal.html("Error al cargar información.")
        })
}


const loadQuotaHandleResponse = (response, modal) => {
    $("#quotaTitle").text(response.initials)
    // Format data
    let categories_keys = new Set();
    let categories = {};

    response.quota.forEach(({ category }) => {
        categories_keys.add(category);
    });

    categories_keys.forEach(category => {
        categories[category] = [];
    });

    response.quota.forEach(({ category, date, quota, banner }) => {
        categories[category].push({
            date: new Date(date),
            quota: quota,
            banner: banner,
            category: category
        });
    });

    categories_keys = Array.from(categories_keys);

    const data = [];
    categories_keys.forEach(category => {
        data.push(categories[category])
    });

    // Create the visualization using D3.js
    const d3 = require('d3');

    const WIDTH = 1000,
        HEIGHT = 500;

    const margins = {
        top: 63.5,
        left: 45.5,
        bottom: 52.5,
        right: 357.5
    };

    const width = WIDTH - margins.left - margins.right,
        height = HEIGHT - margins.top - margins.bottom;

    const divQuotaChart = d3.select("#quotaChart");

    const lineChart = divQuotaChart
        .append("svg")
        .attr("width", WIDTH)
        .attr("height", HEIGHT);

    lineChart
        .append("text")
        .attr("font-size", 16)
        .attr("fill", "#757575")
        .attr("x", margins.left/3)
        .attr("y", margins.top*3/4)
        .text("Disponibilidad de cupos");

    lineChart
        .append("text")
        .attr("font-size", 16)
        .attr("fill", "#757575")
        .attr("x", margins.left + width/2)
        .attr("y", HEIGHT - margins.bottom/5)
        .text("Fechas y horarios")
        .attr("text-anchor", "middle");

    const maxQuota = categories_keys.map(category => categories[category].map(d => d.quota).reduce((a, b) => Math.max(a, b), 0)).reduce((a, b) => Math.max(a, b), 0);

    const sortedDates = categories[categories_keys[0]].map(d => d.date).sort((a, b) => a - b);
    const firstDate = sortedDates[0],
        lastDate = sortedDates[sortedDates.length - 1];

    const quotaScale = d3
        .scaleLinear()
        .domain([0, maxQuota])
        .range([height, 0])
        .nice();

    const timeScale = d3
        .scaleTime()
        .domain([firstDate, lastDate])
        .range([0, width]);

    const colorScale = d3
        .scaleOrdinal(d3.schemeCategory10)
        .domain(categories_keys);

    const axisQuota = d3.axisLeft(quotaScale);
    const containerAxisQuota = lineChart
        .append("g")
        .attr("transform", `translate(${margins.left}, ${margins.top})`)
        .call(axisQuota);

    containerAxisQuota
        .selectAll(".tick")
        .select("line")
        .attr("x1", width)
        .attr("stroke-dasharray", "8")
        .attr("opacity", 0.5)
        .attr("stroke", "#757575");

    containerAxisQuota
        .selectAll(".tick")
        .select("text")
        .attr("font-size", 12)
        .attr("fill", "#757575");

    const axisDates = d3
        .axisBottom(timeScale)
        .ticks(10);

    const axisDatesContainer = lineChart
        .append("g")
        .attr("transform", `translate(${margins.left}, ${height + margins.top})`);

    axisDatesContainer.call(axisDates);

    const drawLines = d3
        .line(d3.curveStepAfter)
        .x((d) => timeScale(d.date))
        .y((d) => quotaScale(d.quota));

    const linesContainer = lineChart
        .append("g")
        .attr("transform", `translate(${margins.left}, ${margins.top})`);

    const circlesContainer = lineChart
        .append("g")
        .attr("transform", `translate(${margins.left}, ${margins.top})`);

    const captionSquaresContainer = lineChart
        .append("g")
        .attr("transform", `translate(${margins.left + width}, ${margins.top})`);

    const captionTextContainer = lineChart
        .append("g")
        .attr("transform", `translate(${margins.left + width}, ${margins.top})`);

    const tooltipContainer = lineChart
        .append("g")
        .attr("transform", `translate(${margins.left}, ${margins.top})`);

    const highlight = (dato) => {
        linesContainer
            .selectAll("path")
            .attr("stroke-opacity", d => d == dato ? 1 : 0.3)
            .transition()
            .duration(500)
            .attr("stroke-width", d => d == dato ? 5 : 2.4);

        captionSquaresContainer
            .selectAll("rect")
            .attr("fill-opacity", d => d == dato ? 1 : 0.3);

        captionTextContainer
            .selectAll("text")
            .attr("fill-opacity", d => d == dato ? 1 : 0.3);

        circlesContainer
            .selectAll("circle")
            .data(dato)
            .join(
                enter => {
                    enter
                        .append("circle")
                        .attr("cx", d => timeScale(d.date))
                        .attr("cy", d => quotaScale(d.quota))
                        .attr("fill", d => colorScale(d.category))
                        .attr("r", 0)
                        .transition()
                        .duration(500)
                        .attr("r", 5);
                },
                update => {
                    update
                        .attr("cx", d => timeScale(d.date))
                        .attr("cy", d => quotaScale(d.quota))
                        .attr("fill", d => colorScale(d.category))
                        .attr("r", 0)
                        .transition()
                        .duration(500)
                        .attr("r", 5);

                },
                exit => {
                    exit
                        .transition()
                        .duration(500)
                        .attr("r", 0)
                        .remove();
                }
            );

        circlesContainer
            .selectAll("circle")
            .on("mouseenter", (event, dato) => {

                circlesContainer
                    .selectAll("circle")
                    .transition()
                    .duration(500)
                    .attr("r", d => d == dato ? 5 : 0);

                const detail = [dato.date, dato.category, dato.quota];

                const x = parseFloat(event.target.attributes[0].nodeValue);
                const y = parseFloat(event.target.attributes[1].nodeValue);

                tooltipContainer.append("rect");
                tooltipContainer.style("visibility", "visible");

                tooltipContainer
                    .selectAll("text")
                    .data(detail)
                    .join(
                        enter => {
                            tooltipContainer
                                .select("rect")
                                .attr("width", 160)
                                .attr("height", 110)
                                .attr("fill", "white")
                                .attr("stroke", "#757575")
                                .attr("stroke-width", 1)
                                .attr("x", () => x < width/2 ? x + 20 : x - 180)
                                .attr("y", (_, i) => y < height/2 ? y + i*25 + 10 : y + i*25 - 120);

                            enter
                                .append("text")
                                .attr("font-size", (_, i) => {
                                    if (i == 0) {
                                        return 14
                                    } else if (i == 1) {
                                        return 14
                                    } else if (i == 2) {
                                        return 24
                                    }
                                })
                                .attr("fill", (_, i, a) => {
                                    if (i == 0) {
                                        return "black"
                                    } else if (i == 1) {
                                        return "#757575"
                                    } else if (i == 2) {
                                        return colorScale(a[1].__data__)
                                    }
                                })
                                .attr("x", () => x < width/2 ? x + 20 : x - 180)
                                .attr("y", (_, i) => y < height/2 ? y + i*25 + 10 : y + i*25 - 120)
                                .attr("dy", (_, i) => {
                                    if (i == 2) {
                                        return 40
                                    } else {
                                        return 30
                                    }
                                })
                                .attr("dx", 15)
                                .text((d, i) => {
                                    if (i == 0) {
                                        return d.toLocaleString('es-CL')
                                    } else if (i == 1) {
                                        if (d.length > 18) {
                                            return d.substring(0, 18) + "..."
                                        }
                                        return d
                                    } else if (i == 2) {
                                        return d
                                    }
                                })
                                .raise();
                        },
                        update => {
                            update
                                .attr("fill", (_, i, a) => {
                                    if (i == 0) {
                                        return "black"
                                    } else if (i == 1) {
                                        return "#757575"
                                    } else if (i == 2) {
                                        return  colorScale(a[1].__data__)
                                    }
                                })
                                .attr("x", () => x < width/2 ? x + 20 : x - 180)
                                .attr("y", (_, i) => y < height/2 ? y + i*25 + 10 : y + i*25 - 120)
                                .text((d, i) => {
                                    if (i == 0) {
                                        return d.toLocaleString('es-CL')
                                    } else if (i == 1) {
                                        if (d.length > 18) {
                                            return d.substring(0, 18) + "..."
                                        }
                                        return d
                                    } else if (i == 2) {
                                        return d
                                    }
                                })
                                .raise();
                        }
                    );
            })
            .on("mouseleave", () => {
                tooltipContainer
                    .style("visibility", "hidden");
            });
    };

    const unhighlight = () => {
        linesContainer
            .selectAll("path")
            .attr("stroke-opacity", 1)
            .transition()
            .duration(500)
            .attr("stroke-width", 2.4);

        captionSquaresContainer
            .selectAll("rect")
            .attr("fill-opacity", 1);

        captionTextContainer
            .selectAll("text")
            .attr("fill-opacity", 1);
    };

    linesContainer
        .selectAll("path")
        .data(data)
        .join(
            (enter) => {
                enter
                    .append("path")
                    .attr("stroke", d => colorScale(d[0].category))
                    .attr("fill", "transparent")
                    .attr("stroke-width", 2.4)
                    .attr("d", d => drawLines(d))
                    .style("pointer-events", "visibleStroke")
                    .on("mouseenter", (_, dato) => highlight(dato))
                    .on("mouseleave", unhighlight);
            }
        );

    lineChart
        .append("rect")
        .attr("id", "trigger")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "transparent")
        .attr("x", margins.left)
        .attr("y", margins.top)
        .lower()
        .on("mouseenter", () => {
            circlesContainer
                .selectAll("circle")
                .transition()
                .duration(500)
                .attr("r", 0);
        });

    lineChart
        .append("rect")
        .attr("width", WIDTH)
        .attr("height", HEIGHT)
        .attr("fill", "transparent")
        .lower()
        .on("mouseenter", () => {
            circlesContainer
                .selectAll("circle")
                .transition()
                .duration(500)
                .attr("r", 0);
        });


    captionSquaresContainer
        .selectAll("rect")
        .data(data)
        .join(
            (enter) => {
                enter
                    .append("rect")
                    .attr("width", 12)
                    .attr("height", 12)
                    .attr("fill", d => colorScale(d[0].category))
                    .attr("x", 30)
                    .attr("y", (_, i) => 50 + i * 50)
                    .attr("ry", 2)
                    .on("mouseenter", (_, dato) => highlight(dato))
                    .on("mouseleave", unhighlight)
            }
        );

    captionTextContainer
        .selectAll("rect")
        .data(data)
        .join(
            (enter) => {
                enter.append("text")
                    .attr("x", 30 + 20)
                    .attr("y", (_, i) => 50 + 12 + i * 50)
                    .text(d => d[0].category)
                    .attr("fill", "#757575")
                    .on("mouseenter", (_, dato) => highlight(dato))
                    .on("mouseleave", unhighlight)
            }
        )

    //implement zooming for time axis
    lineChart
        .append("clipPath")
        .attr("id", "clip-visualization")
        .append("rect")
        .attr("width", width)
        .attr("height", height);

    lineChart
        .append("clipPath")
        .attr("id", "clip-axisDates")
        .append("rect")
        .attr("width", width + 6)
        .attr("height", HEIGHT)
        .attr("x", -6)
        .attr("y", -margins.top);

    linesContainer
        .attr("clip-path", "url(#clip-visualization)");

    circlesContainer
        .attr("clip-path", "url(#clip-visualization)");

    axisDatesContainer
        .attr("clip-path", "url(#clip-axisDates)");

    const zoomHandler = (event) => {
        const transformation = event.transform;

        timeScale.rangeRound([transformation.applyX(0), transformation.applyX(width)]);
        axisDates.ticks(Math.max(10, Math.floor(10 * transformation.k * 0.6)));
        axisDatesContainer.call(axisDates);

        linesContainer
            .selectAll("path")
            .attr("d", d => drawLines(d));

        circlesContainer
            .selectAll("circle")
            .attr("cx", d => timeScale(d.date));
    };

    const zoom = d3
        .zoom()
        .extent([
            [0, 0],
            [width, height]
        ])
        .translateExtent([
            [0, 0],
            [width, height]
        ])
        .scaleExtent([1, 100])
        .on("zoom", zoomHandler);

    d3.select("#trigger").call(zoom);

    d3.select(".spinner-border").remove();
    ga_event("detail", { event_category: "follow", event_label: response.initials });
}
