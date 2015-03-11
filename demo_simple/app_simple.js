// reference to Modul 'firebaseIndexView' in firebaseindex.js
var app = angular.module('IndexView_Demo_Simple', ['FirebaseIndexView']);




// TO CHANGE HERE: set your  Firebase Account here  
//var firebaseRef = "https://[  YOUR ACCOUNT HERE ].firebaseio.com/";
var firebaseRef = "https://fireindex.firebaseio.com/";

// use Service 'firebaseIndexView' from Modul 'firebaseIndexView' 
app.controller('appCtrl', ['$scope', 'FirebaseIndexView', '$timeout', function ($scope, FirebaseIndexView, $timeout) {

    'use strict';

    // define Index and View in Indexdeclaration Array 
    var indexDeclaration = [

        {
            indexName: 'order'
        }, // minimalistic order indexname must be a property name  

        {
            // name of index node
            indexName: 'dino_living_timespan',
            // generates index
            mapIndex: function (doc) {
                return (doc.appeared && doc.vanished) ? (doc.vanished - doc.appeared) : null;
            },
            // generates the view linke with index 
            mapView: function (doc) {
                return (doc.appeared && doc.vanished) ? doc._key + ' lives ' + (doc.vanished - doc.appeared) + ' years.' : "no timespan";
            }
        },

    ];

    // get Firebase - Reference to Dinosaur Facts Database 
    var reference = new Firebase("https://dinosaur-facts.firebaseio.com/dinosaurs");

    //  get Firebase - Reference to  Index  
    var referenceIndexView = new Firebase(firebaseRef + "IDX-dinosaur");

    //  Create an IndexView Object for working on  
    var FirebaseIdx = new FirebaseIndexView(reference, indexDeclaration, referenceIndexView); // take Default referenceIndexView


    // Start and build INDEX from existing database
    FirebaseIdx.indexRebuild();

    FirebaseIdx.queryFromTo('dino_living_timespan', 2000000, 20000000, true, true)
        .then(function (result) {
            console.log(result);
            $timeout(function () {
                $scope.result = result;
            }); // instead of scope.$watch(...)   
        })

}]);