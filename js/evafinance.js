function p(a){
    if(typeof console === 'undefined') {
        return false;
    }
    console.log(a);
}

(function () {

    /*
    if(typeof jQuery == "undefined") {
        throw new ReferenceError('EvaFinance require jQuery support.');
    }
    */
        
    /************************************
        Constants
    ************************************/

    var evafinance
        , VERSION = '1.0.0'
        , namespace = null
        , options = {
            container : null,
            timezoneOffset : 0,
            width : 0,
            height : 0,
            marginLeft : 6,
            marginRight: 50,
            marginTop : 6,
            marginBottom : 12,

            //x axis
            xAxisStroke : '#CCC',
            xAxisShapeRendering : 'crispEdges',
            xAxisFill : 'none',
            xAxisTicks : 5,
            xAxisTickSize : 0,
            xAxisOrient : 'bottom',
            xAxisLabelSize : 12,
            xAxisLabelColor : '#999',

            //y axis
            yAxisStroke : '#CCC',
            yAxisShapeRendering : 'crispEdges',
            yAxisFill : 'none',
            yAxisTicks : 5,
            yAxisTickSize : 0,
            yAxisOrient : 'right',
            xGridStroke : '#EEE',
            xGridShapeRendering : 'crispEdges',
            xGridFill : 'none',
            xGridTicks : 5,
            yGridStroke : '#EEE',
            yGridShapeRendering : 'crispEdges',
            yGridFill : 'none',
            yGridTicks : 5,
            yAxisLabelSize : 12,
            yAxisLabelColor : '#999',

            //area chart
            areaFillEnable : true,
            areaFillColor : '#FFCCB8',
            areaFillOpacity : 0.8,
            areaLineEnable : true,
            areaLineColor : '#F9653C',
            areaLineWidth : 2,
            areaPointEnable : true,
            areaPointStroke : '#F9653C',
            areaPointStrokeWidth : 2,
            areaPointFill : '#FFF',
            areaPointSize : 3,
            areaPointWeight : 2,


            //candle chart
            xColor : '#CCC',
            yColor : '#CCC',
            rectUpColor : '#A0C45E',
            rectDownColor : '#F9653C',
            lineUpColor : '#A0C45E',
            lineDownColor : '#F9653C',
            dateFormatHour : 'HH:mm',
            dateFormatDay : 'DD HH:mm',
            tooltipStyle  : null,
            tooltipxStyle : null, 
            tooltipyStyle : null, 
            watermarkUrl : ''
        }
        , status = {
            x : null,
            y : null,
            interval : 0,
            innerWidth : 0,
            innerHeight : 0,
            priceMin : 0,
            priceMax : 0,
            timestampMin : 0,
            timestampMax : 0        
        }
        , chartType = 'candle'
        , prevClose = null
        , data = null
        , displayRange = []  //be able to display a part of data 
        , xaxisInterval = []
        , container = null  //only container is a jQuery object
        //All d3js objects in ui
        , ui = {
              chart : null
            , currentLine : null
            , tooltip : null
            , tooltipx : null
            , tooltipy : null
            , loading : null
        }
        , hasModule = (typeof module !== 'undefined' && module.exports);

    /************************************
        Constructors
    ************************************/


    function EvaFinance (inputOptions, inputUi) {
        options = $.extend(options, inputOptions);
        if(options.width <= 0) {
            options.width = container.width() || 600;
        }

        if(options.height <= 0) {
            options.height = container.height() || 300;
        }

        container = $(options.container);

        if(!container.get(0)) {
             throw new ReferenceError('Input container not exist');
        }

        namespace = randomString(10) + '_'; 

        initUi(ui);
    }

    /**
     * By James from http://www.xinotes.org/notes/note/515/
     */
    function randomString(length) {
        var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'.split('');
       
        if (! length) {
            length = Math.floor(Math.random() * chars.length);
        }
       
        var str = '';
        for (var i = 0; i < length; i++) {
            str += chars[Math.floor(Math.random() * chars.length)];
        }
        return str;
    }

    function initUi(inputUi) {
        var width = options.width,
            height = options.height,
            marginLeft = options.marginLeft,
            marginRight = options.marginRight,
            marginTop = options.marginTop,
            marginBottom = options.marginBottom,
            innerWidth = width - marginLeft - marginRight,
            innerHeight = height - marginTop - marginBottom;

        status.marginLeft = marginLeft;
        status.marginRight = marginRight;
        status.marginTop = marginTop;
        status.marginBottom = marginBottom;
        status.innerWidth = innerWidth;
        status.innerHeight = innerHeight;

        ui.chart = d3.select(container.get(0))
            .append("svg:svg")
            .attr("class", "evafinance-wrapper")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("class", "evafinance-inner")
            .attr("transform", "translate(" + marginLeft + "," + marginTop + ")");

        container.css({
            //background : '#EFEFEF',
            border : '1px solid',
            position : 'relative',
            width : width + 'px',
            height : height + 'px'
        });

        ui.tooltip = d3.select(container.get(0)).append("div").attr("class", "evafinance-tooltip");
        ui.tooltipx = d3.select(container.get(0)).append("div").attr("class", "evafinance-tooltipx");
        ui.tooltipy = d3.select(container.get(0)).append("div").attr("class", "evafinance-tooltipy");

    }

    function drawXaxis() {
        var x = d3.scale.linear()
                .domain([0, data.length -1])
                .range([0, status.innerWidth]);

        //time diff cross a day
        //p(moment(status.timestampMax).format('YYYYMMDD') - moment(status.timestampMin).format('YYYYMMDD'));

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .tickFormat(function(d) { return moment(data[d].start).format("HH:mm")})
            .tickSize(options.xAxisTickSize)
            .ticks(options.xAxisTicks);
            
        status.x = x;

        ui.chart.append("g")
        .attr("class", "evafinance-xaxis")
        .attr("transform", "translate(0," + status.innerHeight + ")")
        .call(xAxis);

        ui.chart.selectAll(".evafinance-xaxis text")
            .attr("font-size", options.xAxisLabelSize + "px")
            .attr("fill", options.xAxisLabelColor);
        
        //xAxis.selectAll("text").attr("font-size", "12px");

        ui.chart.selectAll('.evafinance-xaxis path, .evachart-xaxis line')
            .attr('stroke', options.xAxisStroke)
            .attr('shape-rendering', options.xAxisShapeRendering)
            .attr('fill', options.xAxisFill);

        ui.chart.append("g")
        .attr("class", "evafinance-xgridlines")
        .selectAll(".evafinance-xgridline")
        .data(x.ticks(options.xGridTicks))
        .enter().append("svg:line")
            .attr("class", "evafinance-xgridline")
            .attr("x1", x)
            .attr("x2", x)
            .attr("y1", 0)
            .attr("y2", status.innerHeight)
            .attr("shape-rendering", options.xGridShapeRendering)
            .attr("fill", options.xGridFill)
            //.attr("stroke-dasharray", "5,5")
            .attr("stroke", options.xGridStroke);

    
    }

    function drawYaxis() {
        trigger('evafinance.drawxaxis.before');

        var domainDiff = (status.priceMax - status.priceMin) / 20;

        if(status.maxNumLength > 2) {
            var yAxisMax = status.priceMax + domainDiff, //add 10% domain offset
            yAxisMin = status.priceMin - domainDiff,
            yAxisMax = prevClose > 0 && prevClose >= yAxisMax ? prevClose + domainDiff : yAxisMax,
            yAxisMin = prevClose > 0 && prevClose <= yAxisMin ? prevClose - domainDiff : yAxisMin;
        } else {
            var yAxisMax = Math.ceil(status.priceMax + domainDiff), //add 10% domain offset
            yAxisMin = Math.floor(status.priceMin - domainDiff),
            yAxisMax = prevClose > 0 && prevClose >= yAxisMax ? Math.ceil(prevClose + domainDiff) : yAxisMax,
            yAxisMin = prevClose > 0 && prevClose <= yAxisMin ? Math.floor(prevClose - domainDiff) : yAxisMin;
        }

        var y = d3.scale.linear().domain([yAxisMin, yAxisMax]).range([status.innerHeight, 0]),
            yAxis = d3.svg.axis().scale(y)
                    .ticks(options.yAxisTicks)
                    .tickSize(options.yAxisTickSize)
                    .orient(options.yAxisOrient);

        status.y = y;

        ui.chart.append("g")
            .attr("class", "evafinance-yaxis")
            .attr("transform", "translate(" + status.innerWidth + ",0)")
            .call(yAxis);

        ui.chart.selectAll('.evafinance-yaxis path, .evachart-yaxis line')
            .attr('stroke', options.yAxisStroke)
            .attr('shape-rendering', options.yAxisShapeRendering)
            .attr('fill', options.yAxisFill);

        ui.chart.selectAll(".evafinance-yaxis text")
            .attr("font-size", options.yAxisLabelSize + "px")
            .attr("fill", options.yAxisLabelColor);

        ui.chart.append("g")
        .attr("class", "evafinance-ygridlines")
        .selectAll(".evafinance-xgridline")
        .data(y.ticks(options.yGridTicks))
        .enter().append("svg:line")
            .attr("class", "evafinance-xgridline")
            .attr("x1", 0)
            .attr("x2", status.innerWidth)
            .attr("y1", y)
            .attr("y2", y)
            .attr("shape-rendering", options.yGridShapeRendering)
            //.attr("stroke-dasharray", "5,5")
            .attr("stroke", options.yGridStroke);
    
        trigger('evafinance.drawxaxis.after');
    }

    function trigger(eventName) {
        $(document).trigger(namespace + eventName, this);
    }

    /************************************
        Top Level Functions
    ************************************/
    evafinance = function (options, ui) {
        return new EvaFinance(options, ui);
    };

    // version number
    evafinance.version = VERSION;

    /************************************
        EvaFinance Prototype
    ************************************/
    evafinance.fn = EvaFinance.prototype = {
        setData : function(input) {
            if(input instanceof Array === false) {
                throw new TypeError('Chart data require array type');
            }

            var chartData = input.slice(0);
            //sort data by start ASC
            chartData.sort(function(a, b) {
                if (a.start === b.start) {
                    return 0;
                } else if (b.start < a.start) {
                    return 1;
                }
                return -1;
            });

            var priceMin = chartData[0].low,
                priceMax = chartData[0].high,
                maxNumLength = chartData[0].price.toString().length,
                interval = chartData[1] - chartData[0];

            //js timestamp is ms
            chartData = $.map(chartData, function(n, i){
                n.index =  i;
                maxNumLength = maxNumLength > n.price.toString().length ? maxNumLength : n.price.toString().length;

                //interval MUST be caculated here before *1000
                if(typeof chartData[i + 1] !== 'undefined') {
                    interval = interval >= chartData[i + 1].start - n.start ? interval : chartData[i + 1].start - n.start;
                }
                n.start = (n.start - options.timezoneOffset) * 1000;
                n.end = (n.end - options.timezoneOffset) * 1000;
                priceMin = priceMin < n.low ? priceMin : n.low;
                priceMax = priceMax > n.high ? priceMax : n.high;

                return n;
            });

            //Longest num after .
            maxNumLength = maxNumLength - Math.floor(priceMin).toString().length - 1;

            data = chartData;
            status.priceMin = priceMin;
            status.priceMax = priceMax;
            status.timestampMin = chartData[0].start;
            status.timestampMax = chartData[chartData.length - 1].start;
            status.maxNumLength = maxNumLength;
            status.interval = interval;

            return this;
        }

        , getData : function(){
            return data;
        }

        , setPrevClose : function(num){
            prevClose = num;
            return this;
        }

        , getPrevClose : function(){
            return prevClose;
        }

        , getStatus : function(){
            return status;
        }

        , setChartType : function(input) {
            chartType = input || 'area';
            return this;
        }

        , drawChart : function(){
            drawXaxis();
            drawYaxis();
            if(chartType === 'area') {
                this.drawCandleChart();
            } else {
                this.drawAreaChart();
            }

            return this;
        }

        , drawCandleChart : function(){
        
        }

        , drawAreaChart : function(){
            var area = d3.svg.area()
                .x(function(d, i) { return status.x(i); })
                .y0(status.innerHeight)
                .y1(function(d) { return status.y(d.price); })
            , line = d3.svg.line()
                .x(function(d, i) { return status.x(i); })
                .y(function(d) { return status.y(d.price); })
            , board = ui.chart.selectAll('g.evafinance-boardarea').empty() ? 
                ui.chart.append("g").attr('class', 'evafinance-boardarea') : 
                ui.chart.selectAll('g.evafinance-boardarea');

            //init xInterval whatever
            xInterval = [];

            board.append("path")
            .datum(data)
            .attr("class", "evafinance-chartarea-fill")
            .attr("d", area)
            .attr("fill", options.areaFillColor)
            .attr("opacity", options.areaFillOpacity);

            board.append("path")
            .datum(data)
            .attr("class", "evafinance-chartarea-line")
            .attr("d", line)
            .attr("fill", 'none')
            .attr("stroke", options.areaLineColor)
            .attr("stroke-width", options.areaLineWidth + "px");

            board.selectAll("circle").data(data).enter()
            .append("circle")
            .attr("stroke", options.areaPointStroke)
            .attr("stroke-width", options.areaPointStrokeWidth)
            .attr("fill", options.areaPointFill)
            .attr("class", "evafinance-chartarea-circle")
            .attr("cx", function(d, i) { 
                var point = status.x(i);
                xInterval.push(point);
                return point; 
            })
            .attr("cy", function(d, i) { return status.y(d.price) })
            .attr("r", options.areaPointSize);

            options.areaPointEnable ? '' : board.selectAll("circle").attr("visibility", "hidden");
            

            return this;
        }

        , bind : function(eventName, func){
            $(document).on(namespace + eventName, func);

            return this;
        }

        , unbind : function(eventName) {
            $(document).off(namespace + eventName);

            return this;
        }
    }


    // CommonJS module is defined
    if (hasModule) {
        module.exports = evafinance;
    }

    /*global ender:false */
    if (typeof ender === 'undefined') {
        // here, `this` means `window` in the browser, or `global` on the server
        // add `evafinance` as a global object via a string identifier,
        // for Closure Compiler 'advanced' mode
        this['EvaFinance'] = evafinance;
    }

    /*global define:false */
    if (typeof define === 'function' && define.amd) {
        define([], function () {
            return evafinance;
        });
    }
}).call(this);
