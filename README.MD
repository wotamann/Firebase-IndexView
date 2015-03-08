#Firebase - IndexView 

------
### Why **Firebase IndexView**?

Sorting or searching records is our daily work, but if you store documents (JSON) in [Firebase](https://www.firebase.com/), it is sometimes not easy to search for values in nested documents.  

Despite [structuring](https://www.firebase.com/docs/web/guide/structuring-data.html) and [denormalizing](https://www.firebase.com/blog/2013-04-12-denormalizing-is-normal.html) your data is the recommended way, sometimes you need to make a deeper lookup in a stored document(JSON) in Firebase. If you don't want to integrate an external solution like ElasticSearch and you want only using the capabilities of Firebase, then **IndexView** brings you up an - easy to go - AngularJS solution.

Firebase **IndexView** will help you to index any JSON document stored in Firebase and searching for each - even in nested - properties. Define index- and view-mapping functions and Firebase IndexView will automatically hold your index and view uptodate. 

![Data Structure](https://fireindex.firebaseapp.com/structure.PNG)

In difference to [Firebase data indexes](https://www.firebase.com/docs/security/guide/indexing-data.html) **IndexView** can index and sort also a nested 'child of a child of a...' . **IndexView** can also transform your index-keys to lowercase ie. you have mixed upper- lowercase entrys from a foreign readonly database, then you can transform all to lowercase. Or transform a date into a time value that represents the number of milliseconds for doing some calculations. 

Further **IndexView** provides the option to generate mapped views of your origin Firebase data-documents, which are stored as values. A view can return a simple 'true' but also an extract, a summary or a calculation over values in your data-document.

![Data Structure](https://fireindex.firebaseapp.com/structure_index.PNG)

**IndexView** - if activated - generates automatically indexes and views of your referenced Firebase DB. It watches your data and add, remove or update your index automatically, as data is changing. 


![Data Structure](https://fireindex.firebaseapp.com/structure_index_changed.PNG)


> IMPORTANT NOTE: All data in index-reference MUST NOT BE EDITED! Never manually edit data located in your index-reference, your changes will be overwritten on next automatically index-update. Edit and manipulate data only in your data-reference.


The created **IndexView** object exposes methods, to manage indexing with a simple **IndexOn()** or **IndexOf()**. If necessary you can use method **IndexDelete()** or method **IndexRebuild()** to delete or rebuild your index and the corresponding view.  


> IMPORTANT NOTE: Is your Index damaged, corrupted or lost, then rebuild it with 'FirebaseIdx.indexRebuild()'. 
> Warning: If you have large data sets, this procedure is expensive because it re-indexes all historical data. 

 

**IndexView** is an AngularJS modul which works perfect pure clientside. It provides the Firebase backend service strategy and needs no further serverside pre-requirements. 

**IndexView** recommends Vulcan, an Chrome application built by Firebase. Changing indexes can be visualized directly in Chrome's DevTools by using Vulcan. 

> TIP: Install Firebase Extension 'Vulcan', open Chrome Dev-Tools and observe Firebase Data, Indexes and Views.

This project is a simple, rapid prototyp, to facilitate the opportunities of [Firebase](https://www.firebase.com/), IMHO a wonderful frontend-concept, thanks to all Firebase developer! 

Check out  the **[Demo](https://fireindex.firebaseapp.com)** using Firebase's **[Dinosaurs](https://dinosaur-facts.firebaseio.com/)** database

---

###From Document to View:


Document: **'Parent with Children'** in your Firebase DB

	{
	    lastname: "Smith",
	    firstname: "Rachel",
		age:30,
	    children:[
					{ lastname: "Smith", firstname: "Mary", age:10 },
					{ lastname: "Smith", firstname: "Ben", age:4 }
				]  
	}

Define your Index, start IndexView with method '**.indexOn()**' and get an index containing all names of children and a view with firstnames of children, number and mean age of children'.

    {
        mary:   {
                    childrenCount: 2,
                    childrensMeanAge: 7,
                    childrenFirstnames:["Mary", "Ben"]
                },
        ben:   {
                    childrenCount: 2,
                    childrensMeanAge: 7,
                    childrenFirstnames:["Mary", "Ben"]
                },

        ...

    }

Now **search** for all documents with a child named **'Ben'** and get **view** with firstnames of children, number and mean age of children'.

----------

### Firebase Reference 

Create a new Firebase [reference](https://www.firebase.com/docs/web/guide/understanding-data.html) from a full Firebase URL for your data  


	var reference= 
		new Firebase("https:/[MyFirebaseAccount].firebaseio.com/mydata");     

---

### Firebase Index Reference 

Next create an index-reference where you want to store your index. This reference **must not be a child** of your data-reference. 

	var referenceIndex = 
		new Firebase("https://MyFirebaseAccount.firebaseio.com/IDX-person");     

But it is also possible to reference your index to any other Firebase account.

	var referenceIndex = 	
		new Firebase("https://AnotherFirebaseAccount.firebaseio.com/IDX-person");       


-------

### IndexDeclaration


This is the main point controlling your indexes. **IndexDeclaration** is an array of index-objects, which declares the mapping functions returning an index and a view. 

This is an example of one item in indexDeclaration array:

	    var IndexDeclaration =
		[...
		    
			{   
				indexName: 'name',                        
		        
				mapIndex: function(doc){ 
					return doc.firstname ? doc.firstname.toLowerCase() : null },
		        
				mapView:  function(doc){ 
					return (doc.firstname && doc.lastname) ?  doc.firstname + ' ' + doc.lastname : undefined }
		    },                       
	    
		...]

Any index-item in the **IndexDeclaration** Array is an object with 3 properties: 

1. First property **indexName**, which becomes an child of your [Firebase Index Reference](https://www.firebase.com/docs/web/guide/understanding-data.html#section-creating-references) and locates the position of your index in Firebase. **indexName** must be a string - in best case it could be one property of your document like 'doc.firstname'. The value of **indexName** could also be nested like 'person/adress/street'. In this case the index will be located at this path in Firebase. This allows building an individual index tree .

		{ indexName: 'lowerFirstName', ... } 

		// or

		{ indexName: 'adress/street', ... } 


 
2. Control the index with **mapIndex**, which expects a function or an array with a function as first item for mapping your data-document into an index-key (= Firebase priority). In this example the property 'firstname' from your data-document becomes the lowerCase IndexKey. This key is sorted and can be searched. Setting the index-kex (= Firebase priority) to null removes any existing priority and will be ordered first. See [Firebase setPriority().](https://www.firebase.com/docs/web/api/firebase/setpriority.html) 
   
		{ 
			indexName: 'lowerFirstName', 
			
			mapIndex: function(doc){ return doc.firstname ? doc.firstname.toLowerCase() : null }, 
		
		...} 
              
		// or 

		function makeIndex(doc, case){ 
			return doc.firstname ? (case ? doc.firstname.toUpperCase():doc.firstname.toLowerCase() ) : null };
		 
		{ 
			indexName: 'upperFirstName', 

			// first item is the mapping function, further items(2-n) are parameters for mapping function
			mapIndex: [makeIndex, true],   
		
		...} 
         

3. The 3. Index Property **mapView** expects a function or an array with a function as first item for mapping the document into a view, wich is stored as value. The value to be written to your Firebase (can be an object, array, string, number, boolean, or null). If mapView function returns 'undefined' the entry will be removed 
 		
		{ 
			indexName: 'lowerFirstName', 
			
			mapIndex: function(doc){ return doc.firstname ? doc.firstname.toLowerCase() : null }, 
		
			mapView: function(doc){ 
				return (doc.firstname && doc.lastname) ? doc.firstname + ' ' + doc.lastname : undefined }
		}

----

###Some Index Examples

####1) Simple Index 	

	var IndexDeclaration = 
	[ ...
	
		{	// Index Item 1 in IndexDeclaration Array

            indexName: 'lowerFirstName',                

            // controls the index(=Firebase property) in your index 			
			mapIndex: function(doc){ 
				return doc.firstname ? doc.firstname.toLowerCase() : '' },

            // controls the view (=Firebase value) in your index
			mapView: function(doc){ 
				return (doc.firstname && doc.lastname) ? doc.firstname + ' ' + doc.lastname : undefined }

        }, 
	
	... ]


####2) Minimalistic Index 

	var IndexDeclaration = 
	[ ...
	
		{
            indexName: 'firstname',                            
		},
		
	... ]


	
	/* 
		Is no 'mapIndex' property declared or 'mapIndex' is undefined, then IndexView tries 
		to use the value of 'doc[indexName]' of your data-document. If property 'firstname' in your 
		data-document exists, then an index with the value from 'document.firstname' will generated. 
		
		----
		
		Is no 'mapView' property declared or 'mapView' is undefined then the value of IndexView variable 'defaultMapView' becomes the view/value of your index. 
		
		FirebaseIndexView.defaultMapView=true;


		If the value of 'mapView' is a string then Firebase IndexView tries 
		this string as property of your Data-document like 'doc[mapview]' . 
		
		mapview:'lastname'  ->  'person.lastname'

		Is 'mapView' an Array then IndexView interpretates the first item as Function and 
		all other items (2-n) in the array as parameters
		
		mapView:[Function(Param1, Param2){...}, Param1, Param2, ...]				

    */                
      
		

####Combined Index

 Define a index holding 'firstname' and 'lastname' and a view emiting the 'fullname' 

	[ ...
		{	// Index1
                   
            indexName: 'name',  
			
			// 	Is 'mapIndex' or 'mapView' an Array then IndexView interpretates the first item as Function and 
			//	all other items (2-n) in the array as parameters

            mapIndex: [indexLowerCase,'lastname'],

            mapView: emitFullname

        },

		{	// Index 2 -use same indexName 'name' like in Index1            
			
			indexName: 'name',                
            
            // 	Is 'mapIndex' or 'mapView' an Array then IndexView interpretates the first item as Function and 
			//	all other items (2-n) in the array as parameters
            
			mapIndex: [indexLowerCase,'firstname'],

            mapView: emitFullname 
			
 
        } 
	... ];


	function indexLowerCase(doc, property) {
		return doc[property] ? doc[property].toLowerCase() : undefined; 
	};
		
	function emitFullname(doc) {
		return {fullname: doc.firstname + " " + doc.lastname}; 
	};   


---

    
### Create the main 'FirebaseIndexView' object
	

> var FirebaseIndexView = [new] firebaseIndex(**reference**, **indexDeclaration**, [**referenceIndex**])


> **Parameters:**  
> 
> 
> 1) **reference** - Firebase reference to your data  
>  
> 2) **indexDeclaration** - Array defining your indexes 
> 
> 3) [**referenceIndex**] - optional Firebase reference to your index
>  

	var FirebaseIndexView= 
			new firebaseIndex(referencePersons, indexDeclaration, referencePersonsIndex)
	
	//	or

	var FirebaseIndexView= 
			new firebaseIndex(referencePersons, indexDeclaration); 
	
	//  omiting referenceIndex takes default index-reference with heading 'IDX-'
    


---
### Manage Index

Methods of **FirebaseIndexView** for managing your Index 


	FirebaseIndexView.indexDelete();

	// start Indexing   	
	FirebaseIndexView.indexOn()          
	
	// stop Indexing   	
	FirebaseIndexView.indexOff()         
	
	// if your Index is corrupt then rebuild your Index, but if you have a large dataset this is an expensive job 
	FirebaseIndexView.indexRebuild()     
	
	// delete the Index DB 
	FirebaseIndexView.indexDelete()     


### That's it! 

    FirebaseIndexView.indexOn() 
... and every change (Set, Update, Remove) in your Firebase 'reference' will automatically update your index and view. 

Try to add a 'Sample Person' as data-document to your Firebase reference

	var person = {
	    lastname: "Smith",
	    firstname: "Rachel",
		age:30,
	    children:[
					{ lastname: "Smith", firstname: "Mary", age:10 },
					{ lastname: "Smith", firstname: "Ben", age:4 }
				]  
	}

	reference.push(person); 
  
---

### Try searching:


All query methods return a promise 

> FirebaseIndexView.queryFromTo(index, termFrom, [termTo], [sort], [showView], [queryResultArray] )
> 
> .then( function(result){ ... } )

IMPORTANT NOTE: This project uses native promises in ECMAScript 6 current only available in Chrome or Firefox. For using other Browsers you have to install a promise library ([kriskowal](https://github.com/kriskowal/q)). 

#### Method 'queryFromTo'
 
Parameter 'queryResultArray' is optional. If undefined a new queryResult will be generated, otherwise the query extends the existing 'queryResult' with the new result.

	var sortUp = true;
	var showView = true;

	var termFrom="s";
	var termTo=termFrom +'\uFFFF';
	
	var index=indexDeclaration[0];  				// ->  { indexName: 'lastname', ... }  
	// or
	// var index=indexDeclaration[0].indexName;  	// -> 'lastname'  
	// or
	// var index='lastname'  
	 
	// queryFromTo() returns a Promise
	FirebaseIndexView.queryFromTo( index, termFrom, termTo, sortUp, showView )
		.then(function(result){   
      
			if (showView===true){
      		
			// result = [ { key:key1, value:View1 }, ...  ]       
			
			}
			else
			{

			// result = [ { key:key1, value:Document }, ...  ]       
			
			}

		})
     
#### Query with promise chaining:

        FirebaseIdx.queryFromTo(index1, termFrom1, termTo1, sortup, view)        
        .then( function(result1)
        {            
			// here pass in result1 as last parameter   
            return FirebaseIdx.queryFromTo(index2, termFrom2, termTo2, sortup, view, result1)  
        })        
        .then( function(result2){
            // ... use result2 ...
        });


	
#### All query methods 

	// all query functions return a promise

	FirebaseIndexView.queryFromTo(index, startAt, endAt, sort, showView ).then(...);
	 
	FirebaseIndexView.queryStartAt(index, startAt, limit, sort, showView).then(...); 
	
	FirebaseIndexView.queryEndAt(index, endAt, limit, sort, showView).then(...); 
	 
	FirebaseIndexView.queryFirst(index, endAt, showView).then(...) ;
	 
	FirebaseIndexView.queryLast(index, endAt, showView).then(...);

-----
### Summary

	// get Firebase Reference to your Data 
    var reference =Firebase("https://[MyFirebaseAccount].firebaseio.com/persons"); 
 	
	// Helper Function for mapView 
	var convertToCase=function(doc, index, upper) { 
		if(doc[index]) return upper ? doc[index].toUpperCase(): doc[index].toLowerCase(); 
	}      
    
	// create a simple combined sorted index from first- and lastname without 
	// a specific view only holding value 'true'
	var indexDeclaration = [         
        {
            indexName: 'name', 
			// create a lowercase index from firstname
            mapIndex: [convertToCase,'firstname',false],
            mapView: 'true'  
        },
        {
            indexName: 'name',                
            // create a lowercase index from lastname
            mapIndex: [convertToCase,'lastname',false],
            mapView: 'true'
        }
	];
   
    
    // Create an IndexView Object for working on  
    var FirebaseIndexView=firebaseIndex(reference, indexDeclaration);  // take Default referenceIndex
    
    // Start automatic INDEXING here...
    FirebaseIndexView.indexOn();
    
    
	// Now you can add 'person' to Firebase and then watch the generated Index and View in Chrome with Vulcane, 

	var person = 
	{
        lastname: "Smith",
        firstname: "Frank"        
    };

	// store person with unique key
	reference.push(person);
    
	// query 
	FirebaseIndexView.queryFromTo('name', 'a', 'z', true, false)
		.then(function(result){   
      
			// result = [ { key:key1, value:document }, ...  ]       
			
		})


---

-

> TIP: Install Firebase extension 'Vulcan', open Chrome Dev-Tools and observe Firebase data, indexes and views.

-

> IMPORTANT NOTE: All data in index-reference MUST NOT BE EDITED!
> Never manually edit data located in your index-reference, your changes will be overwritten on next 
> automatically index-update. Edit and manipulate data only in your data-reference.

-

> IMPORTANT NOTE: Is your Index damaged, corrupted or lost, then rebuild it with 'FirebaseIdx.indexRebuild()'. 
> Warning: If you have large data sets, this procedure is expensive because it re-indexes all historical data. 

-

> 
> IMPORTANT NOTE: This project uses - to keep it simple - native promises in ECMAScript 6 current only available in Chrome or Firefox. For using other Browsers you have to install a promise library ([$q](https://docs.angularjs.org/api/ng/service/$q) or  [kriskowal](https://github.com/kriskowal/q)) instead. 
> 
     
