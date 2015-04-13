/*jshint undef: false, maxerr: 512*/
/*
     Firebase IndexView - Demo Application
     @version 0.1.0
     @autor wotamann 2015
     @license MIT
 */

// reference to Modul 'firebaseIndexView' in firebaseindex.js
var app = angular.module('IndexView_Demo', ['FirebaseIndexView']);

// use Service 'firebaseIndexView' from Modul 'firebaseIndexView' 
app.controller('appCtrl', ['$scope', 'FirebaseIndexView', '$timeout', function ($scope, FirebaseIndexView, $timeout) {
    'use strict';
        
    //--- FirebaseIndexView DINOSAUR  --------------------------------------------------------------------------------------------------------
    
    var indexDeclarationDinosaur = [
        
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
        },
        
        {   
            viewName: 'weight'
        },
        
        {   
            viewName: 'order',                        
            mapView: function(emit, doc){ 
                var k= doc.order ? doc.order.toLowerCase() : null,
                    v= (doc.order && doc._key) ?  doc._key + ' belongs to ' + doc.order : null 

            emit(k,v)

            },
        }       
  
    ];
    
    var referenceDinosaur = new Firebase("https://dinosaur-facts.firebaseio.com/dinosaurs");
    var referenceDinosaurIDX = new Firebase("https://fireindex.firebaseio.com/IDX-dinosaurs");
    var IndexViewDino = new FirebaseIndexView(referenceDinosaur, indexDeclarationDinosaur, referenceDinosaurIDX); // take Default referenceIndexView

    IndexViewDino.indexOn();
        
    //--- FirebaseIndexView DINO MEALS --------------------------------------------------------------------------------------------------------
    
    // mapping and emiting function
    function meals(emit, doc, fullMeal) {
        
        var e,
            meal = doc.meals || {};
        
        for (e in meal) {  // iterate over all meals  drink, food, meat...
            var n = meal[e];
            
            if(!n) continue;
            
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
   
    
    //--- ANGULAR UI --------------------------------------------------------------------------------------------------------
    
    $scope.selOutput=["Property","Key","Value","Document","_View"];
    
    $scope.selection = uniqueArray(indexDeclarationDinomeals.concat(indexDeclarationDinosaur));

    $scope.isIndexing = IndexViewDinoMeals.isIndexing;
    
    $scope.query = function (s) {

        
        if (s.index === undefined || !s.term || s.term.length < 1) {
            $scope.persons = [];
            return;
        }
        
        var t=s.term;

        if (t === '*') t = "";
        s.startAt = isNaN(parseInt(t, 10)) ? t : parseInt(t, 10);
        s.endAt = isNaN(parseInt(t, 10)) ? t + '\uFFFF' : parseInt(t, 10) + 100000000;

        s.reduceFn=null;      
        if (s.reduce===true)  {
            s.reduceFn=CountRecords;
            //s.reduceFn=countMealsFN;
        }
       
        IndexViewDinoMeals.queryFromTo(s)
            //IndexViewDinoMeals.queryFromTo(index, termFrom)        
            //FirebaseIndexView_kartei.queryStartAt(index, termFrom, 999,sortup, view)        
            .then(function (result) {
                return IndexViewDino.queryFromTo(s, result);
            })
       
            .then(function (result) {
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

    $scope.addMeals = function () {

        var i,
            l = 100,
            dinoMeal;

        for (i = 0; i < l; i += 1) {

            dinoMeal = generateDinoMeal();
            dinoMeal._linked = getRandom(1,["lambeosaurus", "bruhathkayosaurus", "linhenykus", "stegosaurus", "pterodactyl", "triceratops"]);
            referenceDinoMeal.push(dinoMeal);
            
        }
    };
    
    // Some Reduce Functions - function.name becomes property in reduce-object e.g. { 'countMealsFN':10 }
    function countMealsCalc(previousValue, currentValue){
       
        // console.log(previousValue,currentValue)
        
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
    function countMealsFN(previousValue, currentValue, index, array) {
            
        if (index === 1) {
            previousValue= countMealsCalc({drink: 0, meat: 0, vegetarian: 0}, previousValue)
        }

        return countMealsCalc(previousValue, currentValue)
       
    }
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
   
    // some helper functions
    function generateDinoMeal() {
        
        // generate random DinoMeals object
        
        var f,
            s,
            rnd=0.66,
            dm = {},
            ml = {},
            rnd=Math.random();
            ml.meat="";
            ml.vegetarian = "";
            ml.drink = "";

        for (f = 0; f < 5; f++) {
            s = ["Beef", "Sausage", "Chicken", "Chorizo", "Pork", "Burger", "Lamb", "Turkey", "Dino small", "DINO XXL", "Fish", "Duck",  "Carcass", "Humans", "Mammoth"];
            ml.meat += getRandom(rnd, s);

            s= ["Gras", "Grape", "pineapple", "Tomatoes", "fruits", "bananas", "trees", "apples", "grain", "leafs", "straw", "corn"];
            ml.vegetarian += getRandom(rnd, s);

            s = ["Water", "Wine", "Milk", "Beer", "Seawater", "Budweiser", "Sprite", "Orange Juice", "Murauer", "Warstein", "Coke", "Cola", "Fanta", "Ice Tea"];
            ml.drink += getRandom(rnd, s);
        }
        
        ml.meat = ml.meat.slice(0, -1);
        ml.drink = ml.drink.slice(0, -1);
        ml.vegetarian = ml.vegetarian.slice(0, -1);
       
        dm.meals = ml;
       
        dm.calory = 1000 + Math.floor(Math.random() * 5000);

        dm.mealsPerDay = 1 + Math.floor(Math.random() * 5);

        return dm;
    }
    function getRandom(rnd,template) {
        if (Math.random()>rnd) return "";
        return template[Math.floor(Math.random() * template.length)] + ",";
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