/*jshint undef: false, maxerr: 512*/
/*
     Firebase IndexView - Demo Application
     @version 0.1.0
     (c) 2015 wotamann
     @license MIT
 */

// reference to Modul 'firebaseIndexView' in firebaseindex.js
var app = angular.module('IndexView_Demo', ['FirebaseIndexView']);

// use Service 'firebaseIndexView' from Modul 'firebaseIndexView' 
app.controller('appCtrl', ['$scope', 'FirebaseIndexView', '$timeout', function ($scope, FirebaseIndexView, $timeout) {
    'use strict';
    
    
    //---  DINOSAUR  --------------------------------------------------------------------------------------------------------
    
    var indexDeclarationDinosaur = [
        {
            viewName: 'order',
            mapView: function (emit, doc) {
                var key = doc.order ? doc.order.toLowerCase() : '',
                    val = (doc.order && doc.weight) ?  doc.order + ' has weight of ' + doc.weight : "no Dinosaur";
                emit(key, val);
            }
        },
        {
            viewName: 'volume',
            mapView: function (emit, doc) {
                var key = doc.length && doc.weight ? (doc.length * doc.weight) : null,
                    val = (doc.length && doc.weight) ?  doc._key + ' has a volume from  ' + (doc.length * doc.weight) : "no volume";
                emit(key, val);
            }
        },
        {
            viewName: 'timespan',
            mapView: function (emit, doc) {
                var key = doc.appeared && doc.vanished ? (doc.vanished - doc.appeared) : null,
                    val = (doc.appeared && doc.vanished) ?  doc._key + ' lives ' + (doc.vanished - doc.appeared) + ' years.' : "no timespan";
                emit(key, val);
            }
        },
        {
            viewName: 'isFlying',
            mapView: function (emit, doc) {
                if ((doc.order === 'ornithischia') === true) {
                    emit(doc._key, true);
                }
            }
        }
  
    ];
    
    var referenceDinosaur = new Firebase("https://dinosaur-facts.firebaseio.com/dinosaurs");
    var referenceDinosaurIDX = new Firebase("https://fireindex.firebaseio.com/IDX-dinosaurs");
    var IndexViewDino = new FirebaseIndexView(referenceDinosaur, indexDeclarationDinosaur, referenceDinosaurIDX); // take Default referenceIndexView

    IndexViewDino.indexOn();
        
    //--- DINO MEALS --------------------------------------------------------------------------------------------------------
    
    // mapping and emiting function
    function meals(emit, doc, fullMeal) {
        
        var e,
            meal = doc.meals || {};
        
        for (e in meal) {  // iterate over all meals  drink, food, meat...
            var n = meal[e];
            n = n ? n.toLowerCase() : null;
            // iterate and generate an index for each split word in every meal like water, milk, ... in drink 
            n.split(",").forEach(
                function (key) {
                    key = key.trim() + "-" + e;

                    // emit calculated key and value to build the index
                    if (fullMeal === true) {
                        emit(key, meal);
                    } else {
                        var val = doc._linked + " likes following " + e + ": " + meal[e];
                        emit(key, val);
                    }
                }
            );
        }
    }  
       
    var indexDeclarationDinomeals = [
        {
            viewName: 'dino',
            mapView: function (emit, doc) { emit(doc._linked, true); }
        },
        
        {
            viewName: 'singleMeal',
            mapView: [meals,  false]
        },
        
        {
            viewName: 'meals',
            mapView: [meals,  true]
        },
        
        {   
            viewName: 'mealsPerDay',
            mapView:function(emit, doc) {
                
                var key = doc.mealsPerDay || null,
                    ext_doc = IndexViewDino.getLinkedDocument(doc._linked),
                    val = doc.mealsPerDay + " Meals per day" + (ext_doc ? " makes a Dino weight of " + ext_doc.weight : " but no Dino");
                
                emit(key, val);
            }

        },
        
        {
            viewName: 'dinoWithMeal',
            mapView: function (emit, doc) {
                
                var val,
                    key = doc._linked || null,
                    ext_doc = IndexViewDino.getLinkedDocument(doc._linked);
                if (ext_doc) {ext_doc.food = doc; }
                val = ext_doc || 'no dino found';
                emit(key, val);
            }
          
        }
        
    ];
    
    // set your Firebase Account here  or use for demonstration - https://fireindex.firebaseio.com/...
    var firebaseReferenceDinoMeal = "https://fireindex.firebaseio.com/dinomeals";

    // get Firebase - Reference to your Data 
    var referenceDinoMeal = new Firebase(firebaseReferenceDinoMeal);
  
    //  Create an IndexView Object for working on  
    var IndexViewDinoMeals = new FirebaseIndexView(referenceDinoMeal, indexDeclarationDinomeals); // take Default referenceIndexView

    // Let INDEXVIEW automatic working...
    IndexViewDinoMeals.indexOn();
   
    //--- UI --------------------------------------------------------------------------------------------------------
    
    $scope.selection = uniqueArray(indexDeclarationDinomeals.concat(indexDeclarationDinosaur));

    $scope.isIndexing = IndexViewDinoMeals.isIndexing;

    // Some Reduce Functions - function.name becomes property in reduce-object e.g. { 'countMealsFN':10 }
    function countMealsFN(previousValue, currentValue, index, array) {
            
        if (index === 1) {
            previousValue = {drink: 0, meat: 0, vegetarian: 0};
        }
        //console.log(index, previousValue,currentValue)
        if (currentValue.drink) {
            previousValue.drink = previousValue.drink + currentValue.drink.split(",").length;
        }
        if (currentValue.meat) {
            previousValue.meat = previousValue.meat + currentValue.meat.split(",").length;
        }
        if (currentValue.vegetarian) {
            previousValue.vegetarian = previousValue.vegetarian + currentValue.vegetarian.split(",").length;
        }

        return previousValue;

    }
    // Some Reduce Functions - function.name becomes property in reduce-object e.g. { 'CountRecords':10 }
    function CountRecords(previousValue, currentValue, index, array) {
            
        if (index === 1) {
            previousValue = 1;
        }
        //console.log(index, previousValue,currentValue)
        if (currentValue) {
            previousValue += 1; 
        }

        return previousValue;
        
    }
   
    $scope.query = function (term, index, sort, unique, output, reduce) {

        if (index === undefined || !term || term.length < 1) {
            $scope.persons = [];
            return;
        }

        if (term === '*') term = "";
        var termFrom = isNaN(parseInt(term, 10)) ? term : parseInt(term, 10);
        var termTo = isNaN(parseInt(term, 10)) ? term + '\uFFFF' : parseInt(term, 10) + 100000000;

        //console.log("$scope.output", $scope.output, termFrom, termTo, sort, output);
        
        var reduceFN;        
        if (reduce===true)  {
            reduceFN=CountRecords;
        }
        
        IndexViewDinoMeals.queryFromTo(index, termFrom, termTo, sort, unique, output,undefined,reduceFN)
            //IndexViewDinoMeals.queryFromTo(index, termFrom)        
            //FirebaseIndexView_kartei.queryStartAt(index, termFrom, 999,sortup, view)        
            .then(function (result) {
                return IndexViewDino.queryFromTo(index, termFrom, termTo, sort, unique, output, result, reduceFN);
            })
            .then(function (result) {
                //console.log(result);
                $timeout(function () {
                    $scope.persons = result;
                }); // instead of scope.$watch(...)             
            });

    };

    $scope.toggleIDX = function () {

        IndexViewDinoMeals.isIndexing() ? IndexViewDinoMeals.indexOff() : IndexViewDinoMeals.indexOn();
        IndexViewDino.isIndexing() ? IndexViewDino.indexOff() : IndexViewDino.indexOn();
    };

    $scope.rebuildIDX = function () {

        IndexViewDino.indexRebuild();
        IndexViewDinoMeals.indexRebuild();

    };

    $scope.deleteIDX = function () {

        IndexViewDinoMeals.indexDelete();
        IndexViewDino.indexDelete();
    };

    $scope.generateMeals = function () {

        var i,
            l = 1,
            dinoMeal;

        for (i = 0; i < l; i += 1) {

            dinoMeal = generateDinoMeal();
            dinoMeal._linked = getRandom(["lambeosaurus", "bruhathkayosaurus", "linhenykus", "stegosaurus", "pterodactyl", "triceratops"]);
            referenceDinoMeal.push(dinoMeal);
            
        }
    };

    // helper functions
    
    function generateDinoMeal() {
        
        // generate random DinoMeals object
        
        var p = {},
            ml = {};

        var m = ["Beef", "Sausage", "Lamb", "Turkey", "Dino small", "Dino XXLarge", "Fish", "Duck",  "rotten Carcass", "Humans", "Mammoth"];
        ml.meat = getRandom(m) + ",";
        
        var v = ["gras", "grape", "pineapple", "Tomatoes", "fruits", "bananas", "trees", "apples", "grain", "leafs", "straw", "corn"];
        ml.vegetarian = getRandom(v) + ",";
        
        var dx = ["Water", "Milk", "blood", "Beer", "seawater", "Budweiser", "Fruit Juice", "Murauer", "Gösser", "Puntigamer", "Coke", "Cola", "Fanta", "Ice Tea"];
        ml.drink = getRandom(dx) + ",";
        
        if (Math.random() > 0.4) {
            ml.meat += getRandom(m) + ",";
        }
        if (Math.random() > 0.4) {
            ml.vegetarian += getRandom(v) + ",";
        }
        if (Math.random() > 0.4) {
            ml.drink += getRandom(dx) + ",";
        }
        
        if (Math.random() > 0.66) {
            ml.meat += getRandom(m) + ",";
        }
        if (Math.random() > 0.66) {
            ml.vegetarian +=  getRandom(v) + ",";
        }
        if (Math.random() > 0.66) {
            ml.drink += getRandom(dx) + ",";
        }

        if (Math.random() > 0.8) {
            ml.meat += getRandom(m) + ",";
        }
        if (Math.random() > 0.8) {
            ml.vegetarian +=  getRandom(v) + ",";
        }
        if (Math.random() > 0.8) {
            ml.drink += getRandom(dx) + ",";
        }

        ml.meat = ml.meat.slice(0, -1);
        ml.drink = ml.drink.slice(0, -1);
        ml.vegetarian = ml.vegetarian.slice(0, -1);
        
        p.meals = ml;
       
        p.calory = 1000 + Math.floor(Math.random() * 5000);

        p.mealsPerDay = 1 + Math.floor(Math.random() * 5);

        return p;
    }

    function getRandom(template) {
        return template[Math.floor(Math.random() * template.length)];
    }

    function uniqueArray(source) {
        var i,
            n = {},
            target = [],
            l = source.length;
        
        for (i = 0; i < l; i += 1) {
            if (!n[source[i].viewName]) {
                n[source[i].viewName] = true;
                target.push(source[i]);
            }
        }
        return target;
    }

}]);