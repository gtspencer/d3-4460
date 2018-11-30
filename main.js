//Variables initialization
var yearSel = "All";
var genreSel = "All Genres";

var attributesX = ['movieLikes', 'duration'];
var axisMapY = { 'movieLikes' : 'Movie Facebook Likes',
                 'duration' : 'Duration (min)'}
var subGraphColor = { 'movieLikes' : '#ba29c3',
                 'duration' : '#29b0c3'}

var find = true;

var directorCurrent = "none";
var a1Current = "none";
var a2Current = "none";
var a3Current = "none";
var movieCurrent = "none";

var svg = d3.select('svg');
var wSVG = +svg.attr('width');
var hSVG = +svg.attr('height');

var wGraph = wSVG - 200;

var hGraph = 330;

var wSubGraph = wSVG/2.8;

var hSubGraph = hSVG/4;

var domains = { 'imdb' : [0.0, 10.0] };

var bubbleGraph = svg.append('g')
    .attr('class', 'bubbleGraph')
    .attr('transform', 'translate('+[80, 50]+')');

var SubGraph = svg.append('g')
    .attr('transform', 'translate('+[80, hGraph+80*1.85-15]+')');

var contentColors = ['#64f22b','#ffff00','#ffa700','#ff0000','#e90df6', '#d4d4d4'];
var contentLegend = ['G', 'PG','PG-13', 'R', 'Unrated', 'Not Rated'];

var genres = [];

var scaleX = d3.scaleLinear()
var scaleY = d3.scaleLinear().range([hGraph,0]).domain(domains['imdb']);
var scaleR = d3.scaleSqrt().range([0,40]);
var scaleGross = d3.scaleLinear().range([hSubGraph, 0]);

d3.csv('./movies.csv',
    function(d){
        return {
            gross: +d.gross,
            budget: +d.budget,
            movieTitle: d.movie_title,
            year: +d.title_year,
            dirName: d.director_name,
            dirLikes: d.director_facebook_likes,
            a1: d.actor_1_name,
            a2: d.actor_2_name,
            a3: d.actor_3_name,
            a1Likes: d.actor_1_facebook_likes,
            a2Likes: d.actor_2_facebook_likes,
            a3Likes: d.actor_3_facebook_likes,
            movieLikes: +d.movie_facebook_likes,
            genres: d.genres,
            imdbScore: +d.imdb_score,
            language: d.language,
            country: d.country,
            contentRating: d.content_rating,
            duration: +d.duration,
            color: d.color,
            faceNumInPoster: +d.facenumber_in_poster,
            plotKeywords: d.plot_keywords,
            imdbLink: d.movie_imdb_link,
            aspectRatio: +d.aspect_ratio,
        }
    },
    // functions needed
    function(error, dataset){
        if(error) {
            console.error(error);
            return;
        }
        movies = dataset;
        extentGross = d3.extent(dataset, function(d){ return d.gross; });
        extentBudget = d3.extent(dataset, function(d) { return d.budget; });
        movieLikesMaximum = d3.max(dataset, function(d) {return d.movieLikes });
        durationMaximum = d3.max(dataset, function(d) { return d.duration; });
        extentMap = { 'movieLikes' : [0, movieLikesMaximum],
                      'duration' : [0, durationMaximum]}
        scaleGross.domain(extentGross);
        nestByMovieTitle = d3.nest()
            .key(function(d) { return d.movieTitle})
            .entries(dataset);
        bubbleGraph.append('text')
            .attr('x', wGraph/2)
            .attr('y', hGraph + 30)
            .text('Total Budget');
        bubbleGraph.append('text')
            .attr('x', -hGraph)
            .attr('y', -30)
            .attr('transform', 'rotate(270)')
            .text('IMDb Score');
        bubbleGraph.append('text')
            .attr('x', -60)
            .attr('y', -15)
            .style('align', 'center');
        SubGraph.append('text')
            .attr('x', -60)
            .attr('y', -15)
            .attr("transform", "translate("+((wSVG/3) + 100)+","+0+")")
            .text('Gross Relations');
        updateGraph(yearSel, genreSel, '/');
        var set = new Set()
        movies.forEach(function(d) {
            var temp = d['genres'].split('|');
            temp.forEach(function(v) {
                set.add(v);
            })
        })
        var sortedArr = Array.from(set).sort();
        genreSelect = d3.select('#genreSelect');
        genreOptions = genreSelect.selectAll('option')
            .data(sortedArr)
            .enter()
            .append('option')
            .text(function (d) { return d; })
        makeSubGraph(yearSel, genreSel, '/');
    });
// search function
function search(){
    var text = d3.select('#searchInput').node().value;
    updateGraph(yearSel, genreSel, text);
    makeSubGraph(yearSel, genreSel, text);
}
// function to clear search
function clearSearch() {
    d3.select('#searchInput').node().value = "";
    updateGraph(yearSel, genreSel, '/');
    makeSubGraph(yearSel, genreSel, '/');
}
// function for yeaar change
function onYearChanged() {
    var select = d3.select('#yearSelect').node();
    yearSel = select.options[select.selectedIndex].value;
    updateGraph(yearSel, genreSel, '/');
    makeSubGraph(yearSel, genreSel, '/');
}
//function for genre change
function onGenreChanged() {
    var select = d3.select('#genreSelect').node();
    genreSel = select.options[select.selectedIndex].value;
    updateGraph(yearSel, genreSel, '/');
    makeSubGraph(yearSel, genreSel, '/');
}
// function to update the Graph
function updateGraph(year, genre, text) {
    var filtered;

    if(text != '/') {
        filtered = movies.filter(function(d) {
            var title = d['movieTitle'].toLowerCase();
            return title.includes(text.toLowerCase());
        })
    } else {
        var yearsFiltered = movies.filter(function(d){
            if (year == "All") {return true;}
            return year == d.year;
        });

        var yearsGenresFiltered = yearsFiltered.filter(function(d){
            if (genre == "All Genres") {return true;}
            return d.genres.includes(genre);
        });
        filtered = yearsGenresFiltered;
    }

    var point = svg.selectAll('.block')
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

    var budgetMaximum = d3.max(filtered, function(d){
        return d.budget;
    });

    scaleX.domain([0, budgetMaximum*1.1]).range([0, wGraph-80]);

    scaleR.domain(extentGross);

    svg.selectAll('.xGrid').remove();
    var xGrid = bubbleGraph.append('g')
        .attr('class', 'xGrid')
        .attr('transform', 'translate('+[0, hGraph]+')')
        .call(d3.axisBottom(scaleX)
            .tickSizeInner(-hGraph)
            .tickFormat(d3.format(".2s")));

     var yGrid = bubbleGraph.append('g')
        .attr('class', 'yGrid')
        .call(d3.axisLeft(scaleY).ticks(20)
        .tickSizeInner(-wGraph+80)
        .tickFormat(d3.format(".1f")));


    var bGraph = bubbleGraph.selectAll('.bGraph')
        .data(filtered, function(d) { return d.movieTitle});

    var bGraphEnter = bGraph.enter()
        .append('g')
        .attr('class', 'bGraph')
        .on('mouseover', function(d){
            svg.selectAll('.point')
                .classed('hidden', function(v) {
                    return v != d;
                })
                .classed('hovered', function(v) {
                    return v == d;
                })

            bubbleGraph.selectAll('image').remove();
            find = true;

            var matchHovered = svg.selectAll('.bMovies')
                .classed('hovered', function(i) {
                return (d.movieTitle == i.movieTitle);
            });

            var temporaryKeyWords = d['plotKeywords'].split('|');
            var stringKeyWords = "";
            temporaryKeyWords.forEach(function(d) {
                stringKeyWords += d + ", ";
            })
            stringKeyWords = stringKeyWords.substring(0, stringKeyWords.length - 2);

            var temporaryGenres = d['genres'].split('|');
            var stringGenres = "";
            temporaryGenres.forEach(function(d) {
                stringGenres += d + ", ";
            })
            stringGenres = stringGenres.substring(0, stringGenres.length - 2);

            document.getElementById("title").innerHTML = "Movie: " + "<u>" + d.movieTitle.substring(0, d.movieTitle.length - 1) + "</u>";
            document.getElementById("director").innerHTML = "Director: <u>" + d.dirName + " (" + d3.format(',')(d.dirLikes) + " likes)</u>";
            document.getElementById("a1").innerHTML = "<u>" + d.a1 + " (" + d3.format(',')(d.a1Likes) + " likes)</u>, ";
            document.getElementById("a2").innerHTML = "<u>" + d.a2 + " (" + d3.format(',')(d.a2Likes) + " likes)</u>, and ";
            document.getElementById("a3").innerHTML = "<u>" + d.a3 + " (" + d3.format(',')(d.a3Likes) + " likes)</u>";
            document.getElementById("gross").innerHTML = "Gross: $" + d3.format(',')(d.gross);
            document.getElementById("budget").innerHTML = "Budget: $" + d3.format(',')(d.budget);
            document.getElementById("duration").innerHTML = "Duration: " + d.duration + " mins";
            document.getElementById("rating").innerHTML = "Age Rating: " + d.contentRating;
            document.getElementById("year").innerHTML = "Year: " + d.year;
            document.getElementById("genres").innerHTML = "Genres: " + stringGenres;
            document.getElementById("aspect").innerHTML = "Aspect Ratio: " + d.aspectRatio;
            document.getElementById("color").innerHTML = "Film Hue: " + d.color;
            document.getElementById("faces").innerHTML = "Faces in Poster: " + d.faceNumInPoster;
            document.getElementById("keywords").innerHTML = "Plot Keywords: " + stringKeyWords;
            document.getElementById("country").innerHTML = "Country: " + d.country;
            document.getElementById("language").innerHTML = "Language: " + d.language;

            setSearchTerm(d.dirName);
            setA1Search(d.a1);
            setA2Search(d.a2);
            setA3Search(d.a3);
            setMovieSearch(d.movieTitle);

        })
        .on('mouseout', function(d){
            find = false;
            var hoverMatched = svg.selectAll('.bMovies')
            .classed('hovered', function(i) {
                return false;
            });

            svg.selectAll('.point')
                .classed('hidden', function(v) {
                    return false;
                })
                .classed('hovered', function(v) {
                    return false;
                })

            bubbleGraph.selectAll('image').remove();

        })
        .on('click', function(d) {
            var win = window.open(d.imdbLink, '_blank');
            win.focus();
        });

    var bMovies = bubbleGraph.selectAll('.bMovies')
        .data(movies);

    var bMoviesEnter = bMovies.enter()
        .append('g')
        .attr('class', 'bMovies')
        .attr('transform','translate(' +[wGraph-250, 400]+ ')');


    bGraph.merge(bGraphEnter)
        .transition()
        .duration(600)
        .attr('transform', function(d){
            return 'translate(' +(scaleX(d.budget))+ ', ' + (scaleY(d.imdbScore)) + ')';
        });

    bGraphEnter.append('circle')
        .transition()
        .duration(600)
        .attr('r', function(d) {
            return scaleR(d.gross);
        })
        .style('fill', function(d){
            if (d.contentRating === "G") {
                return contentColors[0];
            } else if (d.contentRating === "PG") {
                return contentColors[1];
            } else if (d.contentRating === "PG-13") {
                return contentColors[2];
            } else if (d.contentRating === "R") {
                return contentColors[3];
            } else if (d.contentRating === "Unrated") {
                return contentColors[4];
            } else if (d.contentRating === "Not Rated") {
                return contentColors[5];
            } else {

            }
        });

    var legend = bubbleGraph.selectAll('.legend')
        .data([1])
        .enter()
        .append('g')
        .attr('class', 'legend')
        .attr('transform', 'translate('+[wGraph - 50, hGraph - 170]+')');

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


        contentColors.forEach(function(d) {
            var legendItems = legend.selectAll('.legendItems')
                .data(contentColors);

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
                    return contentLegend[i];
                })
                .style('font-size', '0.7em')
                .style('text-anchor', 'start');

        })


    bGraphEnter.append('text')
        .attr('dy', '0.7em')
        .attr('transform', 'translate(' +[0, -20]+ ')')
        .text(function(d){
                return d.movieTitle;
            });

    bGraph.exit().remove();
    bMovies.exit().remove();
}
// function to make subgraph
function makeSubGraph(year, genre, text) {
    svg.selectAll('.point').remove();

    if(text != '/') {
        filtered = movies.filter(function(d) {
            var title = d['movieTitle'].toLowerCase();
            return title.includes(text.toLowerCase());
        })
    } else {
        var yearsFiltered = movies.filter(function(d){
            if (year == "All") {return true;}
            return year == d.year;
        });

        var yearsGenresFiltered = yearsFiltered.filter(function(d){
            if (genre == "All Genres") {return true;}
            return d.genres.includes(genre);
        });
        filtered = yearsGenresFiltered;
    }

    var Graphs = SubGraph.selectAll('.cell')
        .data(attributesX)
        .enter()
        .append('g')
        .attr("transform", function(d, i) {
            return 'translate(' +[1.2 * wSubGraph * i]+ ')';
        });

    attributesX.forEach(function(attribute, i) {

    var cell = SubGraph.append('g')
        .attr("transform", function(d) {
            return 'translate(' +[1.2 * wSubGraph * i]+ ')';
        });


    scaleX.range([0, wSubGraph]).domain(extentMap[attribute]);

    var xAxis = cell.append('g')
        .attr('transform', 'translate(' +[0, hSubGraph]+ ')')
        .call(d3.axisBottom(scaleX).ticks(5).tickFormat(d3.format(".2s")))

    var yAxis = cell.append('g')
        .call(d3.axisLeft(scaleGross).tickFormat(d3.format(".2s")));

    cell.append('text')
        .attr('class', 'tpyaxis')
        .attr('x', -hSubGraph/2)
        .attr('y', -45)
        .attr('transform', 'rotate(270)')
        .text('Gross ($)');

    cell.append('text')
        .attr('class', 'tpxaxis')
        .attr('x', wSubGraph/2)
        .attr('y', hSubGraph + 35)
        .text(axisMapY[attribute]);

    var points = cell.selectAll('.point')
        .data(filtered);

    var pointsEnter = points.enter()
        .append('circle')
        .attr('class', 'point')
        .attr('r', 2.5)
        .style('fill', subGraphColor[attribute]);

    points.merge(pointsEnter)
        .attr('cx', function(d) {

            return scaleX(d[attribute]);
        })
        .attr('cy', function(d) {
            return scaleGross(d['gross']);
        })

    points.exit().remove()
    })
}
//function to search for director
function searchDirector() {
    if (directorCurrent == "none") {
        window.alert("No Director Selected!");
        return;
    }
    var win = window.open("https://www.google.com/search?q=" + directorCurrent, '_blank');
    win.focus();
}
// function to search for first actor
function searcha1() {
    if (a1Current == "none") {
        window.alert("No Actor Selected!");
        return;
    }
    var win = window.open("https://www.google.com/search?q=" + a1Current, '_blank');
    win.focus();
}
// function to search for second actor
function searcha2() {
    if (a2Current == "none") {
        window.alert("No Actor Selected!");
        return;
    }
    var win = window.open("https://www.google.com/search?q=" + a2Current, '_blank');
    win.focus();
}
//function to search for third actor
function searcha3() {
    if (a3Current == "none") {
        window.alert("No Actor Selected!");
        return;
    }
    var win = window.open("https://www.google.com/search?q=" + a3Current, '_blank');
    win.focus();
}
//function to search for movie
function searchMovie() {
    if (a3Current == "none") {
        window.alert("No Movie Selected!");
        return;
    }
    var win = window.open("https://www.google.com/search?q=" + movieCurrent, '_blank');
    win.focus();
}
// function to set the search term
function setSearchTerm(name) {
    directorCurrent = name;
}
// function to set A1 search
function setA1Search(name) {
    a1Current = name;
}
// function to set A2 search
function setA2Search(name) {
    a2Current = name;
}
// function to set A3 search
function setA3Search(name) {
    a3Current = name;
}
// function to set movie search
function setMovieSearch(name) {
    movieCurrent = name;
}
// function for clearing all filters
function clearAllFilters() {
    d3.select('#searchInput').node().value = "";
    updateGraph(yearSel, genreSel, '/');
    makeSubGraph(yearSel, genreSel, '/');

    yearSel = "All";
    genreSel = "All Genres";
    updateGraph(yearSel, genreSel, '/');
    makeSubGraph(yearSel, genreSel, '/');

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
