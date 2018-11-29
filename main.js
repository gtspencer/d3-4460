selectedYear = "All";
selectedGenre = "All Genres";

var xAttributes = ['movieLikes', 'duration'];

var yAxisMap = { 'movieLikes' : 'Movie Facebook Likes',
                 'duration' : 'Duration (min)'}

var trellisColor = { 'movieLikes' : '#56d945',
                 'duration' : '#3379eb'}

var flag = true;

var currentDirector = "none";
var currentA1 = "none";
var currentA2 = "none";
var currentA3 = "none";
var currentMovie = "none";

//var currentActor1

var svg = d3.select('svg');

var svgWidth = +svg.attr('width');
var svgHeight = +svg.attr('height');

var chartWidth = svgWidth - 200;
var chartHeight = 420 - 50 - 40;

var trellisWidth = svgWidth/2.8;
var trellisHeight = svgHeight/4;

var domains = { 'imdb' : [0.0, 10.0] };

var bubbleChart = svg.append('g')
    .attr('class', 'bubblechart')
    .attr('transform', 'translate('+[80, 50]+')');

var trellis = svg.append('g')
    .attr('class', 'trellis')
    .attr('transform', 'translate('+[80, chartHeight+80*1.85-15]+')');

var legendColors = ['#00ff00','#29e6ff','#ec973c','#ff0000','#b42695', '#232323'];
var legendWords = ['G', 'PG','PG-13', 'R', 'Unrated', 'Not Rated'];

var genres = [];

var xScale = d3.scaleLinear()
var yScale = d3.scaleLinear().range([chartHeight,0]).domain(domains['imdb']);
var rScale = d3.scaleSqrt().range([0,40]);
var grossScale = d3.scaleLinear().range([trellisHeight, 0]);

d3.csv('./movies.csv',
    function(d){
        return {
            gross: +d.gross,
            budget: +d.budget,
            movieTitle: d.movie_title,
            year: +d.title_year,
            directorName: d.director_name,
            directFbLikes: d.director_facebook_likes,
            actor1: d.actor_1_name,
            actor2: d.actor_2_name,
            actor3: d.actor_3_name,
            a1Likes: d.actor_1_facebook_likes,
            a2Likes: d.actor_2_facebook_likes,
            a3Likes: d.actor_3_facebook_likes,
            castTotalLikes: +d.cast_total_facebook_likes,
            movieLikes: +d.movie_facebook_likes,

            genres: d.genres,
            imdbScore: +d.imdb_score,
            language: d.language,
            country: d.country,
            contentRating: d.content_rating,
            duration: +d.duration,

            color: d.color,
            numCritForReviews: +d.num_critic_for_reviews,
            numUserForReviews: +d.num_user_for_reviews,
            numVotedUsers: +d.num_voted_users,
            faceNumInPoster: +d.facenumber_in_poster,
            plotKeywords: d.plot_keywords,
            imdbLink: d.movie_imdb_link,
            aspectRatio: +d.aspect_ratio,

        }
    },
    function(error, dataset){
        if(error) {
            console.error(error);
            return;
        }

        movies = dataset;


        grossExtent = d3.extent(dataset, function(d){ return d.gross; });
        budgetExtent = d3.extent(dataset, function(d) { return d.budget; });
        maxMovieLikes = d3.max(dataset, function(d) {return d.movieLikes });
        maxDuration = d3.max(dataset, function(d) { return d.duration; });

        extentMap = { 'movieLikes' : [0, maxMovieLikes],
                      'duration' : [0, maxDuration]}

        grossScale.domain(grossExtent);

        nestByMovieTitle = d3.nest()
            .key(function(d) { return d.movieTitle})
            .entries(dataset);

        bubbleChart.append('text')
            .attr('x', chartWidth/2)
            .attr('y', chartHeight + 30)
            .text('Total Budget');

        bubbleChart.append('text')
            .attr('x', -chartHeight)
            .attr('y', -30)
            .attr('transform', 'rotate(270)')
            .text('IMDb Score');

        bubbleChart.append('text')
            .attr('x', -60)
            .attr('y', -15)
            .style('align', 'center');
            //.text('IMDb Score vs. Total Budget - Click on a circle to view IMDB page');

        trellis.append('text')
            .attr('x', -60)
            .attr('y', -15)
            .attr("transform", "translate("+((svgWidth/3) + 100)+","+0+")")
            .text('Gross Relations');

        updateChart(selectedYear, selectedGenre, '/');
        
        var set = new Set()
        movies.forEach(function(d) {
            var temp = d['genres'].split('|');
            temp.forEach(function(v) {
                set.add(v);
            })
        })

        var sorted = Array.from(set).sort();

        genreSelect = d3.select('#genreSelect');
        genreOptions = genreSelect.selectAll('option')
            .data(sorted)
            .enter()
            .append('option')
            .text(function (d) { return d; })

        makeTrellis(selectedYear, selectedGenre, '/');

    });

//-------------------Functions---------------------------------

function search(){
    var text = d3.select('#searchInput').node().value;
    updateChart(selectedYear, selectedGenre, text);
    makeTrellis(selectedYear, selectedGenre, text);
}

function clearSearch() {
    d3.select('#searchInput').node().value = "";
    updateChart(selectedYear, selectedGenre, '/');
    makeTrellis(selectedYear, selectedGenre, '/');
}

function onYearChanged() {
    var select = d3.select('#yearSelect').node();
    selectedYear = select.options[select.selectedIndex].value;
    updateChart(selectedYear,selectedGenre, '/');
    makeTrellis(selectedYear, selectedGenre, '/');
}

function onGenreChanged() {
    var select = d3.select('#genreSelect').node();
    selectedGenre = select.options[select.selectedIndex].value;
    updateChart(selectedYear, selectedGenre, '/');
    makeTrellis(selectedYear, selectedGenre, '/');
}

function updateChart(year, genre, text) {
    var filtered;

    if(text != '/') {
        filtered = movies.filter(function(d) {
            var title = d['movieTitle'].toLowerCase();
            return title.includes(text.toLowerCase());
        })
    } else {
        var filteredYears = movies.filter(function(d){
            if (year == "All") {return true;}
            return year == d.year;
        });

        var filteredYearAndGenres = filteredYears.filter(function(d){
            if (genre == "All Genres") {return true;}
            return d.genres.includes(genre);
        });
        filtered = filteredYearAndGenres;
    }

    var dot = svg.selectAll('.block')
        .classed('filtered', function(d) {
            if(text != '/') {
                var title = d['movieTitle'].toLowerCase();
                return title.includes(text.toLowerCase());
            } else {
                var yearFilter;
                var genreFilter;

                if(year == "All") {
                    yearFilter = true;
                } else {
                    yearFilter = year == d.year;
                }

                if (genre == "All Genres") {
                    genreFilter = true;
                } else {
                    genreFilter = d.genres.includes(genre);
                }
                return yearFilter && genreFilter;
            }
        })

    var maxBud = d3.max(filtered, function(d){
        return d.budget;
    });

    xScale.domain([0, maxBud*1.1]).range([0, chartWidth-80]);

    rScale.domain(grossExtent);

    svg.selectAll('.xGrid').remove();
    var xGrid = bubbleChart.append('g')
        .attr('class', 'xGrid')
        .attr('transform', 'translate('+[0, chartHeight]+')')
        .call(d3.axisBottom(xScale)
            .tickSizeInner(-chartHeight)
            .tickFormat(d3.format(".2s")));

     var yGrid = bubbleChart.append('g')
        .attr('class', 'yGrid')
        .call(d3.axisLeft(yScale).ticks(20)
        .tickSizeInner(-chartWidth+80)
        .tickFormat(d3.format(".1f")));


    var bChart = bubbleChart.selectAll('.bChart')
        .data(filtered, function(d) { return d.movieTitle});

    var bChartEnter = bChart.enter()
        .append('g')
        .attr('class', 'bChart')
        .on('mouseover', function(d){
            //console.log(flag);

            svg.selectAll('.dot')
                .classed('hidden', function(v) {
                    return v != d;
                })
                .classed('hovered', function(v) {
                    return v == d;
                })

            bubbleChart.selectAll('image').remove();
            flag = true;

            var hoveredMatch = svg.selectAll('.bData')
                .classed('hovered', function(i) {
                return (d.movieTitle == i.movieTitle);
            });

            var tempKeywords = d['plotKeywords'].split('|');
            var stringKeywords = "";
            //console.log(tempKeywords);
            tempKeywords.forEach(function(d) {
                stringKeywords += d + ", ";
            })
            stringKeywords = stringKeywords.substring(0, stringKeywords.length - 2);

            var tempGenres = d['genres'].split('|');
            var stringGenres = "";
            //console.log(genreKeywords);
            tempGenres.forEach(function(d) {
                stringGenres += d + ", ";
            })
            stringGenres = stringGenres.substring(0, stringGenres.length - 2);

            document.getElementById("title").innerHTML = "Movie: " + "<u>" + d.movieTitle.substring(0, d.movieTitle.length - 1) + "</u>";
            document.getElementById("director").innerHTML = "Director: <u>" + d.directorName + " (" + d3.format(',')(d.directFbLikes) + " likes)</u>";
            //document.getElementById("stars").innerHTML = "Stars: " + d.actor1 + ", " + d.actor2 + ", and " + d.actor3;
            document.getElementById("a1").innerHTML = "<u>" + d.actor1 + " (" + d3.format(',')(d.a1Likes) + " likes)</u>, ";
            document.getElementById("a2").innerHTML = "<u>" + d.actor2 + " (" + d3.format(',')(d.a2Likes) + " likes)</u>, and ";
            document.getElementById("a3").innerHTML = "<u>" + d.actor3 + " (" + d3.format(',')(d.a3Likes) + " likes)</u>";
            document.getElementById("gross").innerHTML = "Gross: $" + d3.format(',')(d.gross);
            document.getElementById("budget").innerHTML = "Budget: $" + d3.format(',')(d.budget);
            document.getElementById("duration").innerHTML = "Duration: " + d.duration + " mins";
            document.getElementById("rating").innerHTML = "Age Rating: " + d.contentRating;
            document.getElementById("year").innerHTML = "Year: " + d.year;
            document.getElementById("genres").innerHTML = "Genres: " + stringGenres;
            document.getElementById("aspect").innerHTML = "Aspect Ratio: " + d.aspectRatio;
            document.getElementById("color").innerHTML = "Film Hue: " + d.color;
            document.getElementById("faces").innerHTML = "Faces in Poster: " + d.faceNumInPoster;
            document.getElementById("keywords").innerHTML = "Plot Keywords: " + stringKeywords;
            document.getElementById("country").innerHTML = "Country: " + d.country;
            document.getElementById("language").innerHTML = "Language: " + d.language;

            setSearchTerm(d.directorName);
            setA1Search(d.actor1);
            setA2Search(d.actor2);
            setA3Search(d.actor3);
            setMovieSearch(d.movieTitle);

        })
        .on('mouseout', function(d){
            flag = false;
            var hoverMatched = svg.selectAll('.bData')
            .classed('hovered', function(i) {
                return false;
            });

            svg.selectAll('.dot')
                .classed('hidden', function(v) {
                    return false;
                })
                .classed('hovered', function(v) {
                    return false;
                })

            bubbleChart.selectAll('image').remove();

        })
        .on('click', function(d) {
            //console.log("clicked " + d.movieTitle);
            var win = window.open(d.imdbLink, '_blank');
            win.focus();
        });

    var bData = bubbleChart.selectAll('.bData')
        .data(movies);

    var bDataEnter = bData.enter()
        .append('g')
        .attr('class', 'bData')
        .attr('transform','translate(' +[chartWidth-250, 400]+ ')');


    bChart.merge(bChartEnter)
        .transition()
        .duration(600)
        .attr('transform', function(d){
            return 'translate(' +(xScale(d.budget))+ ', ' + (yScale(d.imdbScore)) + ')';
        });

    bChartEnter.append('circle')
        .transition()
        .duration(600)
        .attr('r', function(d) {
            return rScale(d.gross);
        })
        .style('fill', function(d){
            if (d.contentRating === "G") {
                return '#00ff00';
            } else if (d.contentRating === "PG") {
                return '#29e6ff';
            } else if (d.contentRating === "PG-13") {
                return '#ec973c';
            } else if (d.contentRating === "R") {
                return '#ff0000';
            } else if (d.contentRating === "Unrated") {
                return '#b42695';
            } else if (d.contentRating === "Not Rated") {
                return '#232323';
            } else {

            }
        });

    var legend = bubbleChart.selectAll('.legend')
        .data([1])
        .enter()
        .append('g')
        .attr('class', 'legend')
        .attr('transform', 'translate('+[chartWidth - 50, chartHeight - 170]+')');

        legend.append('rect')
            .attr('x', 0)
            .attr('y', -30)
            .attr('height', 170)
            .attr('width', 110)
            .style('fill', 'none')
            .style('stroke', 'black');

        legend.append('text')
            .attr('x', 0)
            .attr('y', -20)
            .attr('dy', '0.7em')
            .attr('transform', function(a,b) {
                return 'translate( '+ [10, 15]+ ')';})
            .text('Age Rating')
            .style('font-size', '0.7em')
            .style('text-anchor', 'start');


        legendColors.forEach(function(d) {
            var legendItems = legend.selectAll('.legendItems')
                .data(legendColors);

            var legendItemsEnter = legendItems.enter()
                .append('g')
                .attr('class', 'legendItems');

            legendItemsEnter.append('rect')
                .attr('x', 20)
                .attr('y', 10)
                .attr('height', 15)
                .attr('width', 15)
                .attr('transform', function(a,b) {
                    return 'translate( '+ [0, b*15 + 10]+ ')';})
                .style('fill', function(d) {return d;})
                .style('opacity', '0.7');

            legendItemsEnter.append('text')
                .attr('x', 40)
                .attr('y', 20)
                .attr('dy', '0.7em')
                .attr('transform', function(a,b) {
                    return 'translate( '+ [0, b*15 + 3]+ ')';})
                .text(function(d,i) {
                    return legendWords[i];
                })
                .style('font-size', '0.7em')
                .style('text-anchor', 'start');

        })


    bChartEnter.append('text')
        .attr('dy', '0.7em')
        .attr('transform', 'translate(' +[0, -20]+ ')')
        .text(function(d){
                return d.movieTitle;
            });

    bChart.exit().remove();
    bData.exit().remove();
}

function makeTrellis(year, genre, text) {
    svg.selectAll('.dot').remove();

    if(text != '/') {
        filtered = movies.filter(function(d) {
            var title = d['movieTitle'].toLowerCase();
            return title.includes(text.toLowerCase());
        })
    } else {
        var filteredYears = movies.filter(function(d){
            if (year == "All") {return true;}
            return year == d.year;
        });

        var filteredYearAndGenres = filteredYears.filter(function(d){
            if (genre == "All Genres") {return true;}
            return d.genres.includes(genre);
        });
        filtered = filteredYearAndGenres;
    }

    var charts = trellis.selectAll('.cell')
        .data(xAttributes)
        .enter()
        .append('g')
        .attr('class', 'cell')
        .attr("transform", function(d, i) {
            return 'translate(' +[1.2 * trellisWidth * i]+ ')';
        });

    xAttributes.forEach(function(attribute, i) {

    var cell = trellis.append('g')
        .attr('class', 'cell')
        .attr("transform", function(d) {
            return 'translate(' +[1.2 * trellisWidth * i]+ ')';
        });


    xScale.range([0, trellisWidth]).domain(extentMap[attribute]);

    var xAxis = cell.append('g')
        .attr('class', 'trellis axis x')
        .attr('transform', 'translate(' +[0, trellisHeight]+ ')')
        .call(d3.axisBottom(xScale).ticks(5).tickFormat(d3.format(".2s")))

    var yAxis = cell.append('g')
        .attr('class', 'trellis axis y')
        .call(d3.axisLeft(grossScale).tickFormat(d3.format(".2s")));

    cell.append('text')
        .attr('class', 'tpyaxis')
        .attr('x', -trellisHeight/2)
        .attr('y', -45)
        .attr('transform', 'rotate(270)')
        .text('Gross ($)');

    cell.append('text')
        .attr('class', 'tpxaxis')
        .attr('x', trellisWidth/2)
        .attr('y', trellisHeight + 35)
        .text(yAxisMap[attribute]);

    var dots = cell.selectAll('.dot')
        .data(filtered);

    var dotsEnter = dots.enter()
        .append('circle')
        .attr('class', 'dot')
        .attr('r', 2.5)
        .style('fill', trellisColor[attribute]);

    dots.merge(dotsEnter)
        .attr('cx', function(d) {

            return xScale(d[attribute]);
        })
        .attr('cy', function(d) {
            return grossScale(d['gross']);
        })

    dots.exit().remove()
    })
}

function searchDirector() {
    if (currentDirector == "none") {
        window.alert("No Director Selected!");
        return;
    }
    var win = window.open("https://www.google.com/search?q=" + currentDirector, '_blank');
    win.focus();
}

function searchActor1() {
    if (currentA1 == "none") {
        window.alert("No Actor Selected!");
        return;
    }
    var win = window.open("https://www.google.com/search?q=" + currentA1, '_blank');
    win.focus();
}

function searchActor2() {
    if (currentA2 == "none") {
        window.alert("No Actor Selected!");
        return;
    }
    var win = window.open("https://www.google.com/search?q=" + currentA2, '_blank');
    win.focus();
}

function searchActor3() {
    if (currentA3 == "none") {
        window.alert("No Actor Selected!");
        return;
    }
    var win = window.open("https://www.google.com/search?q=" + currentA3, '_blank');
    win.focus();
}

function searchMovie() {
    if (currentA3 == "none") {
        window.alert("No Movie Selected!");
        return;
    }
    var win = window.open("https://www.google.com/search?q=" + currentMovie, '_blank');
    win.focus();
}

function setSearchTerm(name) {
    currentDirector = name;
}

function setA1Search(name) {
    currentA1 = name;
}

function setA2Search(name) {
    currentA2 = name;
}

function setA3Search(name) {
    currentA3 = name;
}

function setMovieSearch(name) {
    currentMovie = name;
}

function clearAllFilters() {
    d3.select('#searchInput').node().value = "";
    updateChart(selectedYear, selectedGenre, '/');
    makeTrellis(selectedYear, selectedGenre, '/');

    selectedYear = "All";
    selectedGenre = "All Genres";
    updateChart(selectedYear, selectedGenre, '/');
    makeTrellis(selectedYear, selectedGenre, '/');

    var val = "All";
    var sel = document.getElementById('yearSelect');
    var opts = sel.options;
    for (var opt, j = 0; opt = opts[j]; j++) {
        if (opt.value == val) {
          sel.selectedIndex = j;
          break;
        }
    }

    var valG = "All Genres";
    var selG = document.getElementById('genreSelect');
    var optsG = selG.options;
    for (var optG, j = 0; optG = optsG[j]; j++) {
        if (optG.value == valG) {
          selG.selectedIndex = j;
          break;
        }
    }

}