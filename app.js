// reference to Modul 'firebaseIndexView' in firebaseindex.js
var app = angular.module('IndexView_Demo', ['FirebaseIndexView']);  

// set your Firebase Account here  or use for demonstration - https://fireindex.firebaseio.com/
var firebaseRef="https://fireindex.firebaseio.com/";
        

// helper functions
var uniqueArray=function(source)
    {
        var n = {},target=[], l=source.length;
        for(var i = 0; i < l; i++) 
        {
            if (!n[source[i].indexName]) 
            {
                n[source[i].indexName] = true; 
                target.push(source[i]); 
            }
        }
        return target;
    };

// use Service 'firebaseIndexView' from Modul 'firebaseIndexView' 
app.controller('appCtrl', ['$scope','firebaseIndexView', '$timeout', function ($scope, firebaseIndex, $timeout) {
    'use strict';        
        
    //-----------------------------------------------------------------------------------------------------------
    
    function convertToCase(doc,index, upper) { if(doc[index]) return upper ? doc[index].toUpperCase():doc[index].toLowerCase(); }      
    function convertToBirthday(doc) {if (doc.birthdate) { var a=new Date(doc.birthdate).getTime(); return Math.floor(a/36000000)+100000;} }
    function convertToBirthdayQuery(term) { var a=new Date(term).getTime(); return Math.floor(a/36000000)+100000;} 
    function emitFullArray(doc,specify,stamp) {var c=0;return [{count:c++, name: doc.lastname},'Hund',23,4,56]    }  
    function emitFullName(doc, specify, stamp) {       
        return {
            
            //kartei:(function(doc){ return FirebaseIdx_kartei.getLinkedDocument(doc);  })() ,
            time: stamp, 
            matched:specify,
            childrenCount: doc.children ? doc.children.length : 0,
            childrensAge: (function(){ 
                var age=0; 
                if (doc.children) {
                    for ( var f = 0; f < doc.children.length; f++ ){ 
                        age+=doc.children[f] ? (doc.children[f].age || 0) : 0; 
                    };
                return age;  
                }
                return undefined;
            })(),

            childrens: (function(){ var r=[]; if (doc.children) {for ( var f = 0; f < doc.children.length; f++ ){ 
                r.push(doc.children[f].firstname)};}; return r;  
                 })(),

            //    name: ((doc.title || "") +" " + (doc.firstname || "") + " " + (doc.lastname || "no lastname")).trim(), birthdate: doc.birthdate
            name: ((doc.title || "") +" " + (doc.firstname || "") + " " + (doc.lastname || "no lastname")).trim()}
    };
    
    // this is the most important Array where all the Indices and Views are declared!! 
    var indexDeclaration_karteixxxxxxxxx = [
        {   indexName: '_joinPerson',
            mapIndex: function(doc){ return FirebaseIdx.getLinkedIndex(doc,"_linkedX")},
            mapView: function(doc){ return FirebaseIdx.getLinkedDocument(doc,"_linkedX"); }
        },
         {   indexName: 'diagnose',
            mapIndex: function(doc){  return (doc.diagnose && doc.diagnose.length) ? doc.diagnose[0].toLowerCase() : undefined;},
            mapView: function(doc){  return doc.diagnose.join(",")}        
        },
         {   indexName: 'diagnose',
            mapIndex: function(doc){  return (doc.diagnose && doc.diagnose.length) ? doc.diagnose[1].toLowerCase() : undefined;;},
            mapView: function(doc){  return doc.diagnose.join(",")}        
        },
         {   indexName: 'diagnose',
            mapIndex: function(doc){  return (doc.diagnose && doc.diagnose.length) ? doc.diagnose[2].toLowerCase() : undefined;;},
            mapView: function(doc){  return doc.diagnose.join(",")}        
        },
         {   indexName: 'leistung',
            mapIndex: function(doc){  return (doc.leistung && doc.leistung.length) ? doc.leistung[0].toLowerCase() : undefined;},
            mapView: function(doc){  return doc.leistung.join(",")}        
        },
        {   indexName: 'leistung',
            mapIndex: function(doc){  return (doc.leistung && doc.leistung.length) ? doc.leistung[1].toLowerCase() : undefined;},
            mapView: function(doc){  return doc.leistung.join(",")}        
        },
         {   indexName: 'leistung',
            mapIndex: function(doc){  return (doc.leistung && doc.leistung.length) ? doc.leistung[2].toLowerCase() : undefined;},
            mapView: function(doc){  return doc.leistung.join(",")}        
        },
     ];

    // this is the most important Array where all the Indices and Views are declared!! 
    var indexDeclaration_person = [
        {   
            indexName: 'firstname',
            mapIndex: function(doc) {return doc.firstname ? doc.firstname.toLowerCase() : '' },
            mapView: function(doc) { return (doc.firstname && doc.lastname) ?  doc.firstname + ' ' + doc.lastname : "xxx" }
        },
    /*
        {   indexName: '_linkedToKartei',
            mapIndex: function(doc){ return doc._linked || undefined;},
            mapView: function(doc){ var d= FirebaseIdx_kartei.getLinkedDocument(doc); 
                                   //console.log("### Person _linkedToKartei",a,"***", doc); 
                                   return d; }
        },
        {   indexName: '_linkedToPerson',
            mapIndex: function(doc){ return doc._linked || undefined;},
            mapView: function(doc){ 
                console.log("VIEW  _linkedToPerson ",doc);
                return getLinkedDoc(doc);  
                }       
        },
        
        {   indexName: 'person/children/age',
            mapIndex: function(doc){ 
                var age=0; 
                if (doc.children) {
                    for ( var f = 0; f < doc.children.length; f++ ){ 
                        age+=doc.children[f] ? (doc.children[f].age || 0) : 0; 
                    };
                return age;  
                }
                return undefined;
            }          
        },
        
        {   indexName: 'fullname',                        
            mapIndex: function(doc){ return doc.firstname ? doc.firstname.toLowerCase() : '' },
            mapView:  function(doc){ return (doc.firstname && doc.lastname) ?  doc.firstname + ' ' + doc.lastname : undefined }
        },
        
        
        {
            indexName: 'person/name',                
            // create a lowercase index from lastname
            mapIndex: [convertToCase,'lastname',false],
            mapView: [emitFullName,'Nachname', new Date().getUTCMinutes()]
        },
        {
            indexName: 'person/name',                
            // create a lowercase index from lastname
            mapIndex: [convertToCase,'title',false],
            mapView: [emitFullName,'Title', new Date().getUTCMinutes()]
        },
        {
            indexName: 'person/children',                
            // create a lowercase index from lastname
            mapIndex: function(doc){if (doc.children && doc.children[0]) {return doc.children[0].firstname.toLowerCase();} else {return undefined} },
            mapView: emitFullName  
        },
        {
            indexName: 'person/children',                
            // create a lowercase index from lastname
            mapIndex: function(doc){if (doc.children && doc.children[1]) {return doc.children[1].firstname.toLowerCase();} else {return undefined} },
            mapView: emitFullName
        },
        {
            indexName: 'person/children',                
            // create a lowercase index from lastname
            mapIndex: function(doc){if (doc.children && doc.children[2]) {return doc.children[2].firstname.toLowerCase();} else {return undefined} },
            mapView: emitFullName
        },
       {
            indexName: 'fullname',                
            // create a combined lowercase index from lastname,firstname
            mapIndex: function(doc) {if (doc.lastname && doc.firstname) return (doc.lastname + "." + doc.firstname).toLowerCase(); },
            mapView: emitFullName
            // mapView: emitFullName  <-   emitFullName=function(doc) { ... }                      
        },
        {
            indexName: 'phone/privateNumber', // you can use individual names and also nest your index in firebase using '/'
            mapIndex:function(doc){ if (doc.telephon && doc.telephon.privat) return doc.telephon.privat.replace(/[^\d]/g,'')},
            mapView:function(doc){ return doc.telephon} // generate view containing only person.telephon object 
        },
        {
            indexName: 'phones', // you can use individual names and also nest your index in firebase using '/'
            mapIndex:function(doc){ if (doc.telephon && doc.telephon.privat) return doc.telephon.privat.replace(/[^\d]/g,'')},
            mapView:function(doc){ return doc.telephon} // generate view containing only person.telephon object 
        },
        {
            indexName: 'phones', // you can use individual names and also nest your index in firebase using '/'
            mapIndex:function(doc){ if (doc.telephon && doc.telephon.mobil) return doc.telephon.mobil.replace(/[^\d]/g,'')},
            mapView:function(doc){ return doc.telephon} // generate view containing only person.telephon object 
        },
        {
            indexName: 'adress/location',
            mapIndex: function(doc) {if (doc.adress && doc.adress.location) return doc.adress.location.toLowerCase(); },
            mapView: function(doc){ return doc.adress || null} // generate view containing only person.adress object 
        },*/
        
    ];
    
    
     var indexDeclaration = [
        {   
            indexName: 'order',
            mapIndex: function(doc) {return doc.order ? doc.order.toLowerCase() : '' },
            mapView: function(doc) { return (doc.order && doc.weight) ?  doc.order + ' has weight of ' + doc.weight : "no Dinosaur" }
        },
         {   
            indexName: 'volume',
            mapIndex: function(doc) {return doc.length && doc.weight ? (doc.length * doc.weight ) : null },
            mapView: function(doc) { return (doc.length && doc.weight) ?  doc._key + ' has a volume from  ' + (doc.length * doc.weight  ) : "no volume" }
        },
        {   
            indexName: 'timespan',
            mapIndex: function(doc) {return doc.appeared && doc.vanished ? (doc.vanished-doc.appeared ) : null },
            mapView: function(doc) { return (doc.appeared && doc.vanished) ?  doc._key + ' lives ' + (doc.vanished-doc.appeared  ) + ' years.': "no timespan" }
        },
        {   
            indexName: 'isFlying',
            mapIndex: function(doc) { return (doc.order==='ornithischia').toString(); },
            mapView: function(doc) { return doc.order}
        },
        
        
    ];
   
    var indexDeclaration_kartei = [
        {   
            indexName: 'dinoWithMeal',
            mapIndex: function(doc) {return FirebaseIdx.getLinkedIndex(doc) || null },
            mapView: function(doc) { var dino=FirebaseIdx.getLinkedDocument(doc); if( dino) {dino.food=doc}; return dino || 'no dino'; }
        },
        {   
            indexName: 'meals',
            mapIndex: function(doc) { return doc.meals.drink ? doc.meals.drink.toLowerCase() : null},
            mapView: [function(doc, kindOfMeal) { return kindOfMeal + ": " + (doc._linked + " drinks only " + doc.meals.drink) || 'no Drink'; },'Drink']
        },
        {   
            indexName: 'meals',
            mapIndex: function(doc) {return doc.meals.meat ? doc.meals.meat.toLowerCase() : null },
            mapView: [function(doc, kindOfMeal) { return kindOfMeal + ": " + (doc._linked + " eats like a raptor rare " + doc.meals.meat)  || 'no Meat'; },'Meat']
        },
        {   
            indexName: 'meals',
            mapIndex: function(doc) {return doc.meals.vegetarian ? doc.meals.vegetarian.toLowerCase() : null },
            mapView: [function(doc, kindOfMeal) { return kindOfMeal + ": " + (doc._linked + " eats vegetarian " + doc.meals.vegetarian) || 'no Vegi'; },'Vegi']
        },
        {   
            /*
            you can indivual configurate your index tree if necessary
            */
            indexName: 'meals/day',
            mapIndex: function(doc) {return doc.mealsPerDay || null },
            mapView: function(doc) { return "Meals per day:"+doc.mealsPerDay + " -> weight: " + (FirebaseIdx.getLinkedDocument(doc) ? FirebaseIdx.getLinkedDocument(doc).weight : null)}
        },
        
        
    
    
    ];
    
    //-----------------------------------------------------------------------------------------------------------
    
    // get Firebase - Reference to your Data 
    var reference = new Firebase(firebaseRef + "person");    
    var reference_kartei = new Firebase(firebaseRef + "kartei");    
    
    // // optional get Firebase - Reference to locate your Index  
    var referenceIndexView = new Firebase(firebaseRef + "IDX-persons");        
    var referenceIndexView_kartei = new Firebase(firebaseRef + "IDX-kartei");        
        
     //  Create an IndexView Object for working on  
    var FirebaseIdx=new firebaseIndex(reference, indexDeclaration, referenceIndexView); // take Default referenceIndexView
    var FirebaseIdx_kartei=new firebaseIndex(reference_kartei, indexDeclaration_kartei); // take Default referenceIndexView
    // alternativ  
    // var FirebaseIdx=new firebaseIndex(reference, indexDeclaration, referenceIndexView ); // use referenceIndexView
    
    
    //  DINOSAUR  XXXXXXXXX  XXXXXXXXX  XXXXXXXXX  XXXXXXXXX  XXXXXXXXX  XXXXXXXXX  XXXXXXXXX  XXXXXXXXX  
    reference = new Firebase("https://dinosaur-facts.firebaseio.com/dinosaurs")
    referenceIndexView = new Firebase(firebaseRef + "IDX-dinosaurs");        
    reference_kartei = new Firebase(firebaseRef+"dinomeal")
    referenceIndexView_kartei = new Firebase(firebaseRef + "IDX-dinomeal");        
     //  DINOSAUR    Create an IndexView Object for working on  
    FirebaseIdx=new firebaseIndex(reference, indexDeclaration, referenceIndexView); // take Default referenceIndexView
    FirebaseIdx_kartei=new firebaseIndex(reference_kartei, indexDeclaration_kartei, referenceIndexView_kartei); // take Default referenceIndexView
    
    
    
    /*
        if you have a reference in your 'Person' Index to 'Company'-Data, then changing 'Company'-Data must synchronise the view in 'Person' Index 
        'indexSync' will keep your views containing 'Company' Data upToDate and changes will be reflected in the View of 'Person' Index
        
        @param
        reference: Firebasereference to your Index which should be updated
        [index]:   a string or object, which holds the name of the index
        -
        FirebaseIndexCompany.update(referenceIndexView_Person.child('_joinPerson'));
        or 
        FirebaseIndexCompany.update(referenceIndexView_Person, '_joinPerson');
        
        IMPORTANT NOTE: Circular Linking is not allowed! 
        Firebase1.indexSync( referenceIndexView2.child('_join1') ) 
        AND 
        Firebase2.indexSync( referenceIndexView1.child('_join2') )
   */
    //FirebaseIdx.indexSync(referenceIndexView_kartei,'_joinPerson');
    // alternativ
    //FirebaseIdx.indexSync(referenceIndexView_kartei.child('_joinPerson'));
    
    
    // Start automatic INDEXING here...
    FirebaseIdx.indexOn();
    FirebaseIdx_kartei.indexOn();
    
    /*  
        Now you can add a Person to Firebase with 'refData.push(person)' and then watch the Firebase Result in Chrome with Vulcane, 
        all in Array 'indexDeclaration[]' declared Indices and Views will be automatically generated.

        IMPORTANT NOTE: If you have a lot of data, rebuilding is an expensive Job!
        Is your Index damaged, corrupted or lost, then rebuild with 'FirebaseIdx.indexRebuild()'. 
        
        IMPORTANT NOTE: All Data in Index-Reference MUST NOT BE EDITED !!!
        Never edit manually Data located in your Index-Reference, they will be overwritten on next automatically Index-Update!!!    
        Only edit and manipulate Data in your Data-Reference.       
    */
    
    //-----------------------------------------------------------------------------------------------------------
       
    $scope.selection=uniqueArray(indexDeclaration.concat(indexDeclaration_kartei));
    
    $scope.removeItem=function (ix, p) {
  
        reference.child(p.key).remove(function(){        
            $timeout(function(){ $scope.persons.splice(ix, 1); });            
        });
        
    };
    
    $scope.isIndexing=FirebaseIdx.isIndexing;
    
    $scope.query=function (term, index, sortup, view) {
      
        if(index === undefined || !term || term.length<1) {
            $scope.persons=[];
            return;
        }
        
        if (term==='*') term="";
        var termFrom = isNaN(parseInt(term, 10)) ? term : parseInt(term, 10) ;
        var termTo = isNaN(parseInt(term, 10)) ? term+'\uFFFF' : parseInt(term, 10)+100000000;

        console.log(termFrom,termTo);

        
        FirebaseIdx_kartei.queryFromTo(index, termFrom, termTo, sortup, view)        
        //FirebaseIdx.queryFromTo(index, termFrom)        
        //FirebaseIdx_kartei.queryStartAt(index, termFrom, 999,sortup, view)        
        .then( function(result){            
                    return FirebaseIdx.queryFromTo(index, termFrom, termTo, sortup, view, result)        
        })        
        .then(function(result){
            //console.log(result);
            $timeout(function(){$scope.persons=result; });  // instead of scope.$watch(...)             
        });
    
    };
      
    $scope.toggleIDX=function () {

        FirebaseIdx.isIndexing() ? FirebaseIdx.indexOff(): FirebaseIdx.indexOn();
        FirebaseIdx_kartei.isIndexing() ? FirebaseIdx_kartei.indexOff(): FirebaseIdx_kartei.indexOn();

    };
  
    $scope.rebuildIDX=function () {

        FirebaseIdx.indexRebuild();
        FirebaseIdx_kartei.indexRebuild();
    
    };
    
    $scope.deleteIDX=function () {
        
        FirebaseIdx.indexDelete();
        FirebaseIdx_kartei.indexDelete();
        
    };
   
    $scope.generatePersons=function () {
         
        var ixc;
        var ln = 1;
        
        for (ixc = 0; ixc < ln; ixc++) {

            var person=generateParent();
            
            var kartei=generateKartei();
            
            person.children=[];
            var l=Math.floor(Math.random() * 5)-1;
            var c = 0; 
            while (c < l) {
                c++;
                person.children.push(generateChild());
            }
        
            // add your person-object to firebase, the Index and View will be generated automatically 
            //var timekeyP=Math.floor(Date.now()/1000);            
            //person._linked=timekeyP+1;
            //kartei._linked="K"+timekeyP; // +"_"+appendixDate();
            var dinoMeal=generateDinoMeal();
            dinoMeal._linked=getRandom(["lambeosaurus","bruhathkayosaurus","linhenykus","stegosaurus","pterodactyl","triceratops"]);
            reference_kartei.push(dinoMeal);
            //var person_key= reference.push(person).key();       
            // reference and link from KARTEI to PERSON  
            //kartei._linkedX=person_key;
            //reference_kartei.push(kartei);

        }
    };
    
    var indexCounterLen = 4,   
        indexCounterFiller = new Array(indexCounterLen + 1).join('0');  
                       
    function appendixDate(){
                        var d=Math.floor(Date.now()/86400000);  // 1000 *3600 *24 1TAG
                        return (indexCounterFiller+d.toString(36)).substr(-indexCounterLen); 
    };
    
    
    function generateDinoMeal(){
        
        var p={},
            ml={};
        
        
            var m=["Beef","Sausage","Lamb","Turkey","Dino small","rotten carcass"];
            ml.meat=getRandom(m);
            
            var v=["gras","fruits","bananas","trees","grain","straw"];
            ml.vegetarian=getRandom(v);
            
            var dx=["water","Milk","blood","beer","seawater"];
            ml.drink=getRandom(dx);
            
            p.meals=ml
        
            p.weight = 10+ Math.floor(Math.random() * 1000);
        
            p.mealsPerDay = 1+ Math.floor(Math.random() * 5);   
        
        return p;
    }
    
    
    function generateKartei(){
    var p={};
            
            var d=["Cervicale Stenose","Ischialgie","Rhizarthrose","Epikondylitis","Omarthrose","Husten","Gonarthrose","Coxarthrose","KMÖS","Spondylolisthese","Lumbago","Cervicalsyndrom","Impingement subacromial","Hallux valgus","Hallux rigidus"];
            p.diagnose=[getRandom(d),getRandom(d),getRandom(d)]
            
            p.text="Your blood test results explained! When is a blood value considered abnormal? Blood test PRO helps you using a clear color-scheme, also providing more information about the general meanings of more than 160 lab values."
        
            var l=["ORD","EOU","INF","IA","INFIP","USGE","ORD0","INTER","EXT","MW","US","CHIRO","TA","BU"];
            p.leistung=[getRandom(l),getRandom(l),getRandom(l)]
                        
        return p;
    }
    
    function generateParent(){
    var p={};
            
            // Randomize names
            p.title=getRandom(["MD","Master","PhD","DO","Professor","Consul","Governor","Associate Professor","President","","","","",""]);
            p.lastname = getRandom(["Miller","Smith","Scholes","Levenstein","Flint","Einstein","Turner","Turing","Major","Mc Millan","Rice","Stanford","Mandelbrot","Geibel","Freshman","Stronach"]);
            p.firstname = getRandom(['Heather','Heidi','Samuel','Sissi','Tom','Timothy','Tessa','Sam','Sarah','Francis','Trevis','Larissa','Jack','Mike','John','Frank','Joe','Jimmy','Nathan','Ben','Dave','Rachel','Belinda','Jeremy','Jennifer','Helen','Sandra','Carol','Ruth','Steve','Mary','Patricia']);
            
            //p.birthdate=randomDate().toDateString();
            p.age=Math.floor(Math.random() * 70)+20;
       
            p.telephon = {
                mobil:  getRandom(['+1-123-6543-342','+1-123-7743-242','+1-175-5393-042','+1-773-1142-311','+1-109-5573-299','+1-774-5911-090','+1-177-767-998','+1-177-1331-378','+1-773-8989-300']),                
                privat: getRandom(['+1-123-6543-342','+1-123-7743-242','+1-175-5393-042','+1-773-1142-311','+1-109-5573-299','+1-774-5911-090','+1-177-767-998','+1-177-1331-378','+1-773-8989-300'])
            }
            
            p.adress={
                street : getRandom(["Cameron Court","Campus Place","Canton Court","Carroll Street","Bristol Street","Broadway","Brooklyn Road","Dewitt Avenue","Diamond Street","Eastern Parkway","Eaton Court","Ebony Court","Eckford Street","Lafayette Walk","Lake Avenue","Parkside Avenue","Parkville Avenue"]),                                      
                location: getRandom(["Vienna","Paris","Berlin","Rom","Madrid","Venice","NY","Washington","Seattle","LA","Phoenix","Warsaw","Atlanta","Athen","Oslo","Amsterdam","Dallas","Miami","Denver","Chicago","Detroit"])
            }
        
        return p;
    }
    function generateChild(){
    var p={};
            
            // Randomize names
            p.firstname = getRandom(['Tom','Timothy','Tessa','Sam','Sarah','Francis','Trevis','Larissa','Jack','Mike','John','Frank','Joe','Jimmy','Nathan','Ben','Dave','Rachel','Belinda','Jeremy','Jennifer','Helen','Sandra','Carol','Ruth','Steve','Mary','Patricia']);
            p.age=Math.floor(Math.random() * 14)
        
        return p;
    }
   
    function randomDate() {
        var start=new Date(1950, 0, 1);        
        return new Date(start.getTime() + Math.random() * 1500000000000);
    }    
    function getRandom(template){
            return template[Math.floor(Math.random() * template.length)];            
    }
        
}]);